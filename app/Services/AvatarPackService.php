<?php

namespace App\Services;

use App\Models\User;

class AvatarPackService
{
    public function forUser(User $user): array
    {
        $tiers = collect(config('sipanda.xp.tiers', []))->keyBy('id');
        $balance = (int) $user->xp;
        $claimedPackIds = $user->avatarPackClaims()->pluck('pack_id')->all();

        return collect(config('sipanda.avatar_packs.packs', []))
            ->map(function (array $pack, string $tierId) use ($tiers, $balance, $user, $claimedPackIds) {
                $tier = $tiers->get($tierId, []);
                $min = (int) ($tier['min'] ?? 0);
                $count = max(0, (int) ($pack['count'] ?? 0));
                $items = $count > 0
                    ? collect(range(1, $count))
                        ->map(fn (int $index): array => $this->item($user, $tierId, $pack, $index))
                        ->values()
                        ->all()
                    : [];

                return [
                    'id' => $pack['id'] ?? $tierId,
                    'tier_id' => $tierId,
                    'tier_label' => $tier['label'] ?? $tierId,
                    'label' => $pack['label'] ?? 'Avatar Pack',
                    'style' => $pack['style'] ?? null,
                    'count' => $count,
                    'unlocked' => $balance >= $min,
                    'claimed' => in_array($tierId, $claimedPackIds, true),
                    'remaining' => max(0, $min - $balance),
                    'items' => $items,
                ];
            })
            ->values()
            ->all();
    }

    public function urlFor(User $user, string $packId, int $index): ?string
    {
        $pack = config("sipanda.avatar_packs.packs.{$packId}");

        if (! is_array($pack)) {
            return null;
        }

        $tier = collect(config('sipanda.xp.tiers', []))->firstWhere('id', $packId);
        $count = max(0, (int) ($pack['count'] ?? 0));

        if (! $tier || (int) $user->xp < (int) $tier['min'] || $index < 1 || $index > $count) {
            return null;
        }

        return $this->url(
            (string) ($pack['style'] ?? 'notionists'),
            $this->seed($user, $packId, $index),
            $this->background($pack, $index)
        );
    }

    private function item(User $user, string $tierId, array $pack, int $index): array
    {
        $seed = $this->seed($user, $tierId, $index);

        return [
            'id' => "{$tierId}-{$index}",
            'index' => $index,
            'seed' => $seed,
            'url' => $this->url(
                (string) ($pack['style'] ?? 'notionists'),
                $seed,
                $this->background($pack, $index)
            ),
        ];
    }

    private function seed(User $user, string $packId, int $index): string
    {
        return sprintf('sipanda-%d-%s-%02d', $user->id, $packId, $index);
    }

    private function background(array $pack, int $index): ?string
    {
        $backgrounds = $pack['backgrounds'] ?? [];

        if (! is_array($backgrounds) || $backgrounds === []) {
            return null;
        }

        return (string) $backgrounds[($index - 1) % count($backgrounds)];
    }

    private function url(string $style, string $seed, ?string $background): string
    {
        $base = rtrim((string) config('sipanda.avatar_packs.api_base', 'https://api.dicebear.com/10.x'), '/');
        $query = http_build_query(array_filter([
            'seed' => $seed,
            'backgroundColor' => $background,
        ]));

        return "{$base}/".rawurlencode($style).'/svg?'.$query;
    }
}
