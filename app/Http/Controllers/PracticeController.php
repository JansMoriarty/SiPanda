<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Services\Progress\ProgressData;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Personalized Practice untuk satu mata kuliah. Course WAJIB milik user yang
 * sedang login: documents/chunks/concepts tidak punya user_id sendiri,
 * satu-satunya pemisahnya adalah course.user_id lewat relasi `courses`.
 *
 * Soal latihan diambil dari bank `questions` yang sama dengan Knowledge Gap.
 * Attemptnya tidak disimpan, jadi menjawab latihan tidak mengubah angka
 * Progress — itu memang perilaku yang diinginkan.
 */
class PracticeController extends Controller
{
    public function show(Request $request, Course $course, ProgressData $progressData)
    {
        abort_unless($course->user_id === $request->user()->id, 403);

        return Inertia::render('Practice/Index', [
            'courseId' => $course->id,
            ...$progressData->forUser($request->user()),
        ]);
    }
}
