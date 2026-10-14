<?php

namespace App\Services\Progress;

use App\Models\Concept;
use App\Models\Document;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\User;

/**
 * Menyiapkan data mentah Knowledge Gap & Progress untuk satu user.
 *
 * Sengaja TIDAK menghitung persentase di sini. Definisi "konsep lemah" hanya
 * boleh ada satu, dan itu ada di resources/js/utils/gap.js. Service ini cuma
 * mengeluarkan baris yang bentuknya meniru tabelnya:
 *
 *   concepts  -> concepts JOIN documents untuk dapat course_id
 *   questions -> questions JOIN documents untuk dapat course_id
 *   attempts  -> quiz_attempts + attempt_answers
 *
 * Semua query WAJIB di-scope lewat course.user_id = $user->id. Jangan pernah
 * memakai Course::all() / Document::all() di sini: documents tidak punya
 * user_id sendiri, jadi satu-satunya pemisah antar-user adalah course.
 */
class ProgressData
{
    public function forUser(User $user): array
    {
        // Semua course milik user. Document & turunannya hanya boleh dari sini.
        $courses = $user->courses()
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        $courseIds = $courses->pluck('id');

        $documents = Document::query()
            ->whereIn('course_id', $courseIds)
            ->get(['id', 'course_id', 'original_filename'])
            ->keyBy('id');

        $documentIds = $documents->keys();

        // concept_id -> course_id lewat documents, karena concepts tidak punya
        // course_id sendiri dan utils/gap.js memfilter pakai field itu.
        $courseIdOfDocument = $documents->pluck('course_id', 'id');

        $concepts = Concept::query()
            ->whereIn('document_id', $documentIds)
            ->orderBy('sort_order')
            ->get(['id', 'document_id', 'name', 'description', 'importance']);

        $questions = Question::query()
            ->whereIn('document_id', $documentIds)
            ->orderBy('id')
            ->get(['id', 'document_id', 'concept_id', 'question', 'options', 'correct_index', 'explanation']);

        // Hanya attempt yang sudah selesai. Attempt yang dibuat waktu "start"
        // tapi belum submit tidak punya jawaban apa pun, jadi tidak ada yang
        // bisa dihitung dan ia cuma menggelembungkan jumlah percobaan.
        $attempts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->whereIn('document_id', $documentIds)
            ->with(['answers:id,quiz_attempt_id,question_id,is_correct'])
            ->orderBy('completed_at')
            ->get(['id', 'document_id', 'completed_at']);

        return [
            'courses' => $courses->map(fn ($course) => [
                'id' => $course->id,
                'name' => $course->name,
                'color' => $course->color,
            ])->values(),

            'concepts' => $concepts->map(fn (Concept $concept) => [
                'id' => $concept->id,
                'document_id' => $concept->document_id,
                'course_id' => $courseIdOfDocument[$concept->document_id] ?? null,
                'name' => $concept->name,
                'description' => $concept->description,
                'importance' => $concept->importance,
            ])->values(),

            'questions' => $questions->map(fn (Question $question) => [
                'id' => $question->id,
                'document_id' => $question->document_id,
                'course_id' => $courseIdOfDocument[$question->document_id] ?? null,
                'concept_id' => $question->concept_id,
                'question' => $question->question,
                'options' => $question->options,
                'correct_index' => $question->correct_index,
                'explanation' => $question->explanation,
            ])->values(),

            'attempts' => $attempts->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                // Satu document = satu quiz di model ini, jadi quiz_id dan
                // document_id memang sama. Field quiz_id dipertahankan supaya
                // bentuk ini tetap cocok dengan utils/gap.js.
                'quiz_id' => $attempt->document_id,
                'document_id' => $attempt->document_id,
                'document_title' => $documents[$attempt->document_id]?->original_filename,
                'course_id' => $courseIdOfDocument[$attempt->document_id] ?? null,
                'completed_at' => $attempt->completed_at?->toISOString(),
                'answers' => $attempt->answers->map(fn ($answer) => [
                    'question_id' => $answer->question_id,
                    'correct' => (bool) $answer->is_correct,
                ])->values(),
            ])->values(),
        ];
    }
}
