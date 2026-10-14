<?php

namespace App\Services\Progress;

use App\Models\QuizAttempt;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Streak belajar: berapa hari berturut-turut user menyelesaikan minimal satu
 * quiz. Dipakai bersama oleh Dashboard dan Profile supaya kedua halaman tidak
 * mungkin menampilkan angka streak yang berbeda.
 *
 * Hanya attempt yang sudah selesai (completed_at tidak null) dan hanya pada
 * dokumen milik course user yang dihitung. document_ids HARUS sudah di-scope
 * ke course.user_id oleh pemanggil.
 */
class StudyStreak
{
    /**
     * @param  Collection<int, int>  $documentIds
     * @return array{current: int, longest: int}
     */
    public function forUser(int $userId, Collection $documentIds): array
    {
        $days = QuizAttempt::query()
            ->where('user_id', $userId)
            ->whereIn('document_id', $documentIds)
            ->whereNotNull('completed_at')
            ->pluck('completed_at')
            ->map(fn ($completedAt) => Carbon::parse($completedAt)->toDateString())
            ->unique()
            ->sort()
            ->values();

        if ($days->isEmpty()) {
            return ['current' => 0, 'longest' => 0];
        }

        return [
            'current' => $this->current($days),
            'longest' => $this->longest($days),
        ];
    }

    /**
     * @param  Collection<int, string>  $days  tanggal unik, urut naik (Y-m-d)
     */
    private function current(Collection $days): int
    {
        $set = array_flip($days->all());

        $cursor = Carbon::today();

        // Streak tetap dihitung kalau latihan terakhir kemarin.
        if (! isset($set[$cursor->toDateString()])) {
            $cursor->subDay();

            if (! isset($set[$cursor->toDateString()])) {
                return 0;
            }
        }

        $streak = 0;

        while (isset($set[$cursor->toDateString()])) {
            $streak++;
            $cursor->subDay();
        }

        return $streak;
    }

    /**
     * @param  Collection<int, string>  $days  tanggal unik, urut naik (Y-m-d)
     */
    private function longest(Collection $days): int
    {
        $longest = 0;
        $run = 0;
        $previous = null;

        foreach ($days as $day) {
            $carbon = Carbon::parse($day);

            if ($previous !== null && $previous->copy()->addDay()->isSameDay($carbon)) {
                $run++;
            } else {
                $run = 1;
            }

            $longest = max($longest, $run);
            $previous = $carbon;
        }

        return $longest;
    }
}
