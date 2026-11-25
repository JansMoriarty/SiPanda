<?php

namespace App\Services;

use App\Models\Document;
use App\Models\StudyLevel;
use App\Models\User;
use App\Models\XpClaim;
use Illuminate\Support\Collection;
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
            'per_level' => (int) config('sipanda.xp.per_level', 5),
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

    public function claimedRewardLevelIds(User $user): Collection
    {
        return XpClaim::query()
            ->where('user_id', $user->id)
            ->where('points', '>=', (int) config('sipanda.xp.per_claim', 50))
            ->pluck('level_id');
    }

    public function awardCompletedLevels(User $user, Document $document): int
    {
        $levels = $this->progress->levelRows(
            $document,
            $document->concepts()->get(['id', 'name', 'description', 'importance'])
        );
        $mastery = $this->progress->masteryByConcept($user, $document);
        $passingScore = (int) config('sipanda.quiz.passing_score', 70);
        $points = (int) config('sipanda.xp.per_level', 5);
        $awarded = 0;

        foreach ($levels as $row) {
            $levelId = $row['id'];

            if (! is_numeric($levelId)) {
                continue;
            }

            $result = $this->progress->evaluate(collect($row['concepts']), $mastery, $passingScore);

            if (! $result['completed']) {
                continue;
            }

            $claim = XpClaim::firstOrCreate(
                ['user_id' => $user->id, 'level_id' => (int) $levelId],
                ['points' => $points, 'claimed_at' => now()]
            );

            if ($claim->wasRecentlyCreated) {
                $user->increment('xp', $points);
                $awarded += $points;
            }
        }

        return $awarded;
    }

    public function claimLevel(User $user, StudyLevel $level): XpClaim
    {
        $document = $level->document()->with('course:id,user_id')->firstOrFail();

        abort_unless(
            $document->course && $document->course->user_id === $user->id,
            403
        );

        $levels = $this->progress->levelRows(
            $document,
            $document->concepts()->get(['id', 'name', 'description', 'importance'])
        );
        $target = $levels->last();

        abort_unless(
            $target !== null && is_numeric($target['id']) && (int) $target['id'] === $level->id,
            422,
            'EXP hanya bisa diklaim pada level target.'
        );

        $mastery = $this->progress->masteryByConcept($user, $document);
        $passingScore = (int) config('sipanda.quiz.passing_score', 70);

        foreach ($levels as $row) {
            $result = $this->progress->evaluate(collect($row['concepts']), $mastery, $passingScore);

            abort_unless(
                $result['completed'],
                422,
                'Selesaikan semua level sampai target dulu sebelum klaim EXP.'
            );
        }

        $points = (int) config('sipanda.xp.per_claim', 50);

        return DB::transaction(function () use ($user, $level, $points) {
            $claim = XpClaim::query()
                ->where('user_id', $user->id)
                ->where('level_id', $level->id)
                ->first();

            if ($claim && (int) $claim->points >= $points) {
                return $claim;
            }

            if ($claim) {
                $claim->update([
                    'points' => (int) $claim->points + $points,
                    'claimed_at' => now(),
                ]);
                $user->increment('xp', $points);

                return $claim;
            }

            $claim = XpClaim::create([
                'user_id' => $user->id,
                'level_id' => $level->id,
                'points' => $points,
                'claimed_at' => now(),
            ]);
            $user->increment('xp', $points);

            return $claim;
        });
    }
}
