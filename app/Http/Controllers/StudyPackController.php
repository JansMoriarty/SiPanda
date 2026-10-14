<?php

namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Models\Document;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Study Pack satu dokumen: ringkasan, poin penting, konsep (+penguasaan),
 * dan ringkasan quiz. Semua di-scope lewat course.user_id.
 *
 * Penguasaan per konsep SENGAJA dihitung di sini dengan definisi yang sama
 * seperti Knowledge Gap: benar ÷ dijawab dari attempt yang sudah selesai.
 * Konsep yang belum pernah dijawab dikirim mastery null, bukan 0.
 */
class StudyPackController extends Controller
{
    public function show(Request $request, Document $document)
    {
        $this->authorizeOwnership($request, $document);

        $document->load('course:id,user_id,name,color');

        $concepts = $document->concepts()->get(['id', 'name', 'description', 'importance']);

        $masteryByConcept = $this->masteryByConcept($request, $document);

        $questions = $document->questions()->get(['id', 'concept_id']);

        $attempts = QuizAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('document_id', $document->id)
            ->whereNotNull('completed_at');

        $bestScore = (clone $attempts)->max('score');

        return Inertia::render('Materials/StudyPack', [
            'pack' => [
                'document' => [
                    'id' => $document->id,
                    'title' => $document->original_filename,
                    'course' => [
                        'id' => $document->course?->id,
                        'name' => $document->course?->name,
                        'color' => $document->course?->color,
                    ],
                    'file_type' => $document->file_type,
                    'file_size' => (int) $document->file_size,
                    'page_count' => $document->page_count,
                    'uploaded_at' => $document->created_at?->toISOString(),
                    'status' => $document->status,
                    'study_pack' => [
                        'status' => $document->study_pack_status,
                        'generated_at' => $document->study_pack_generated_at?->toISOString(),
                    ],
                ],
                'summary' => $document->summary,
                'key_points' => $document->key_points ?? [],
                'concepts' => $concepts->map(function ($concept) use ($masteryByConcept) {
                    $bucket = $masteryByConcept->get($concept->id);

                    return [
                        'id' => $concept->id,
                        'name' => $concept->name,
                        'description' => $concept->description,
                        'importance' => $concept->importance,
                        'mastery' => $bucket === null
                            ? null
                            : (int) round($bucket['correct'] / $bucket['answered'] * 100),
                    ];
                })->values(),
                // Flashcards belum punya tabel (nice-to-have di roadmap),
                // jadi dikirim kosong alih-alih mengarang isinya.
                'flashcards' => [],
                'quiz' => [
                    'total_questions' => min(
                        $questions->count(),
                        (int) config('sipanda.quiz.questions_per_session', 10)
                    ),
                    'time_limit_minutes' => (int) config('sipanda.quiz.time_limit_minutes', 10),
                    'passing_score' => (int) config('sipanda.quiz.passing_score', 70),
                    'best_score' => $bestScore,
                    'attempts' => (clone $attempts)->count(),
                    'covered_concepts' => $questions->pluck('concept_id')->unique()->values(),
                ],
                'ask_panda' => [
                    'scope_note' => 'Jawaban Ask PANDA diambil dari materi kuliahmu lewat pencarian RAG.',
                    'suggested_questions' => $concepts
                        ->take(3)
                        ->map(fn ($concept) => "Jelaskan konsep \"{$concept->name}\" pada materi ini.")
                        ->values(),
                ],
            ],
        ]);
    }

    /**
     * concept_id => ['answered' => int, 'correct' => int] untuk attempt milik
     * user ini pada dokumen ini.
     *
     * @return Collection<int, array{answered: int, correct: int}>
     */
    private function masteryByConcept(Request $request, Document $document): Collection
    {
        return AttemptAnswer::query()
            ->join('questions', 'questions.id', '=', 'attempt_answers.question_id')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'attempt_answers.quiz_attempt_id')
            ->where('quiz_attempts.user_id', $request->user()->id)
            ->where('quiz_attempts.document_id', $document->id)
            ->whereNotNull('quiz_attempts.completed_at')
            ->groupBy('questions.concept_id')
            ->selectRaw('questions.concept_id as concept_id, COUNT(*) as answered, SUM(attempt_answers.is_correct) as correct')
            ->get()
            ->keyBy('concept_id')
            ->map(fn ($row) => [
                'answered' => (int) $row->answered,
                'correct' => (int) $row->correct,
            ]);
    }

    private function authorizeOwnership(Request $request, Document $document): void
    {
        abort_unless(
            $document->course && $document->course->user_id === $request->user()->id,
            403
        );
    }
}
