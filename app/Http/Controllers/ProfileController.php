<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\Progress\ProgressData;
use App\Services\Progress\StudyStreak;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Halaman Profile: identitas (dari auth.user yang di-share Inertia) plus
 * statistik belajar nyata.
 *
 * Statistik di sini memakai ProgressData yang sama dengan Progress/Dashboard,
 * jadi tidak mungkin menampilkan angka berbeda. Persentasenya tetap dihitung
 * di resources/js/utils/gap.js. Semua query di-scope lewat course.user_id.
 */
class ProfileController extends Controller
{
    public function index(Request $request, ProgressData $progressData, StudyStreak $streak)
    {
        $user = $request->user();

        $documentIds = Document::query()
            ->whereHas('course', fn ($query) => $query->where('user_id', $user->id))
            ->pluck('id');

        return Inertia::render('Profile/Index', [
            'gap' => $progressData->forUser($user),
            'streak' => $streak->forUser($user->id, $documentIds),
        ]);
    }
}
