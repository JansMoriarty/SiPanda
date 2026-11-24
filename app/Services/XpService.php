<?php

namespace App\Services;

use App\Models\StudyLevel;
use App\Models\User;
use App\Models\XpClaim;
use Illuminate\Support\Facades\DB;

class XpService
{
    public function __construct(private LevelProgress $progress) {}

    public function snapshot(User $user): array
    {
        $balance = (int) $user->xp;

        return [
            'balance' => $balance,
            'tier' => $this->tierFor($balance),
            'timeline' => $this->timeline($balance),
            'per_claim' => (int) config('sipanda.xp.per_claim', 50),
        ];
    }

    public function tierFor(int $xp): array
    {
        $tiers = collect(config('sipanda.xp.tiers', []));

        if ($tiers->isEmpty()) {
            return [
                'id' => 'pemula',
                'label' => 'Pemula',
                'color' => '#94A3B8',
                'min' => 0,
                'next' => null,
                'progress' => [
                    'earned' => 0,
                    'target' => 0,
                    'percent' => 100,
                    'remaining' => 0,
                ],
            ];
        }

        $current = $tiers->first();

        foreach ($tiers as $tier) {
            if ($xp >= $tier['min']) {
                $current = $tier;
            }
        }

        $next = $tiers->first(fn ($tier) => $tier['min'] > $xp);
        $currentMin = (int) $current['min'];
        $nextMin = $next ? (int) $next['min'] : null;
        $target = $nextMin === null ? 0 : max(1, $nextMin - $currentMin);
        $earned = max(0, $xp - $currentMin);

        return [
            'id' => $current['id'],
            'label' => $current['label'],
            'color' => $current['color'],
            'min' => $currentMin,
            'pack' => $current['avatar_pack'] ?? null,
            'next' => $next ? [
                'id' => $next['id'],
                'label' => $next['label'],
                'min' => (int) $next['min'],
                'color' => $next['color'],
            ] : null,
            'progress' => [
                'earned' => $earned,
                'target' => $target,
                'percent' => $nextMin === null ? 100 : (int) min(100, round($earned / $target * 100)),
                'remaining' => $nextMin === null ? 0 : max(0, $nextMin - $xp),
            ],
        ];
    }

    public function timeline(int $xp): array
    {
        $current = $this->tierFor($xp);

        return collect(config('sipanda.xp.tiers', []))
            ->map(function (array $tier) use ($xp, $current) {
                $isCurrent = $tier['id'] === $current['id'];

                return [
                    'id' => $tier['id'],
                    'label' => $tier['label'],
                    'min' => (int) $tier['min'],
                    'color' => $tier['color'],
                    'reward' => $tier['reward'] ?? null,
                    'pack' => $tier['avatar_pack'] ?? null,
                    'status' => $isCurrent
                        ? 'current'
                        : ($xp >= $tier['min'] ? 'achieved' : 'locked'),
                    'remaining' => max(0, (int) $tier['min'] - $xp),
                ];
            })
            ->values()
            ->all();
    }

    public function claimLevel(User $user, StudyLevel $level): XpClaim
    {
        $document = $level->document()->with('course:id,user_id')->firstOrFail();

        abort_unless(
            $document->course && $document->course->user_id === $user->id,
            403
        );

        abort_unless(
            $level->level_number % 2 === 0,
            422,
            'EXP hanya bisa diklaim pada level bernomor genap.'
        );

        $mastery = $this->progress->masteryByConcept($user, $document);
        $result = $this->progress->evaluate(
            $level->concepts,
            $mastery,
            (int) config('sipanda.quiz.passing_score', 70)
        );

        abort_unless(
            $result['completed'],
            422,
            'Selesaikan quiz level ini dulu sebelum klaim EXP.'
        );

        $points = (int) config('sipanda.xp.per_claim', 50);

        return DB::transaction(function () use ($user, $level, $points) {
            $claim = XpClaim::firstOrCreate(
                ['user_id' => $user->id, 'level_id' => $level->id],
                ['points' => $points, 'claimed_at' => now()]
            );

            if ($claim->wasRecentlyCreated) {
                $user->increment('xp', $points);
            }

            return $claim;
        });
    }
}
