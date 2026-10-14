<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Status online dihitung dari tabel `sessions` (SESSION_DRIVER=database),
 * BUKAN dari users.last_login_at. Sebuah user dianggap online bila punya sesi
 * dengan last_activity dalam WINDOW_MINUTES terakhir.
 *
 * Dipakai bersama oleh Admin Dashboard (jumlah online) dan halaman User Online.
 */
class OnlineUsers
{
    public const WINDOW_MINUTES = 5;

    /**
     * @return Collection<int, int> id user yang sedang online
     */
    public function ids(): Collection
    {
        return DB::table('sessions')
            ->where('last_activity', '>=', $this->threshold())
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values();
    }

    public function count(): int
    {
        return $this->ids()->count();
    }

    /**
     * Daftar user online + info sesi terbaru.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function list(): Collection
    {
        $sessions = DB::table('sessions')
            ->where('last_activity', '>=', $this->threshold())
            ->whereNotNull('user_id')
            ->orderByDesc('last_activity')
            ->get(['user_id', 'ip_address', 'user_agent', 'last_activity']);

        if ($sessions->isEmpty()) {
            return collect();
        }

        $sessionCounts = $sessions->groupBy('user_id')->map->count();

        // Sudah diurutkan terbaru dulu, jadi unique() menyisakan sesi terakhir
        // tiap user.
        $latest = $sessions->unique('user_id');

        $users = User::whereIn('id', $latest->pluck('user_id'))->get()->keyBy('id');

        return $latest
            ->map(function ($session) use ($users, $sessionCounts) {
                $user = $users->get($session->user_id);

                if (! $user) {
                    return null; // sesi yatim (user sudah dihapus)
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'sessions' => $sessionCounts[$session->user_id] ?? 1,
                    'last_activity' => Carbon::createFromTimestamp($session->last_activity)->toISOString(),
                ];
            })
            ->filter()
            ->values();
    }

    private function threshold(): int
    {
        return now()->subMinutes(self::WINDOW_MINUTES)->getTimestamp();
    }
}
