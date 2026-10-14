<?php

namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Models\Document;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Alur Quiz: start (buat attempt + pilih soal), submit (nilai & simpan jawaban),
 * results (tampilkan skor + breakdown per konsep untuk Knowledge Gap).
 *
 * Semua akses di-scope ke pemilik data. Document lewat course.user_id, attempt
 * lewat user_id. Jangan pernah memercayai id dari URL tanpa cek ini.
 */
class QuizController extends Controller
{
    public function start(Request $request, Document $document)
    {
        $this->authorizeDocument($request, $document);

        $limit = (int) config('sipanda.quiz.questions_per_session', 10);

        $questions = $document->questions()
            ->with('concept')
            ->inRandomOrder()
            ->limit($limit)
            ->get();

        if ($questions->isEmpty()) {
            return redirect()
                ->route('materials.study-pack', $document)
                ->with('error', 'Quiz belum tersedia karena belum ada soal untuk materi ini.');
        }

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $request->user()->id,
            'total_questions' => $questions->count(),
            'started_at' => now(),
        ]);

        $course = $document->course;

        return Inertia::render('Quiz/Index', [
            'session' => [
                'id' => $attempt->id,
                'kind' => 'quiz',
                'document_id' => $document->id,
                'document_title' => $document->original_filename,
                'course' => [
                    'name' => $course?->name,
                    'color' => $course?->color,
                ],
                'total_questions' => $questions->count(),
                'passing_score' => (int) config('sipanda.quiz.passing_score', 70),
                'time_limit_minutes' => (int) config('sipanda.quiz.time_limit_minutes', 10),
                'submit_url' => route('materials.quiz.submit', $attempt),
                'questions' => $questions->map(fn ($question) => [
                    'id' => $question->id,
                    'concept' => $question->concept_id,
                    'concept_name' => $question->concept?->name,
                    'question' => $question->question,
                    'options' => $question->options,
                    'correct_index' => $question->correct_index,
                    'explanation' => $question->explanation,
                ])->values(),
            ],
        ]);
    }

    public function submit(Request $request, QuizAttempt $attempt)
    {
        $this->authorizeAttempt($request, $attempt);

        $data = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer',
            'answers.*.chosen' => 'nullable|integer|min:0',
        ]);

        $questions = $attempt->document->questions()->get()->keyBy('id');

        $correctCount = 0;

        foreach ($data['answers'] as $row) {
            $question = $questions->get((int) $row['question_id']);

            if (! $question) {
                continue;
            }

            $chosen = $row['chosen'] ?? null;
            $isCorrect = $chosen !== null && (int) $chosen === (int) $question->correct_index;

            if ($isCorrect) {
                $correctCount++;
            }

            AttemptAnswer::updateOrCreate(
                ['quiz_attempt_id' => $attempt->id, 'question_id' => $question->id],
                ['selected_index' => $chosen, 'is_correct' => $isCorrect]
            );
        }

        $total = $attempt->total_questions ?: $questions->count();
        $score = $total > 0 ? (int) round($correctCount / $total * 100) : 0;

        $attempt->update([
            'correct_answers' => $correctCount,
            'score' => $score,
            'completed_at' => now(),
        ]);

        return redirect()->route('quiz.results', $attempt);
    }

    public function results(Request $request, QuizAttempt $attempt)
    {
        $this->authorizeAttempt($request, $attempt);

        $attempt->load('answers.question.concept', 'document.course');

        $answers = $attempt->answers->map(fn ($answer) => [
            'question_id' => $answer->question_id,
            'concept' => $answer->question?->concept_id,
            'concept_name' => $answer->question?->concept?->name,
            'chosen' => $answer->selected_index,
            'correct' => $answer->is_correct,
            'question' => $answer->question?->question,
            'options' => $answer->question?->options,
            'correct_index' => $answer->question?->correct_index,
            'explanation' => $answer->question?->explanation,
        ])->values();

        $breakdown = $attempt->answers
            ->groupBy(fn ($answer) => $answer->question?->concept_id)
            ->map(function (Collection $items, $conceptId) {
                $total = $items->count();
                $correct = $items->filter(fn ($answer) => $answer->is_correct)->count();

                return [
                    'concept_id' => $conceptId,
                    'name' => $items->first()->question?->concept?->name ?? 'Tanpa konsep',
                    'total' => $total,
                    'correct' => $correct,
                    'score' => $total > 0 ? (int) round($correct / $total * 100) : 0,
                ];
            })
            ->sortBy('score')
            ->values();

        $course = $attempt->document?->course;

        return Inertia::render('Quiz/Results', [
            'result' => [
                'attempt_id' => $attempt->id,
                'document_id' => $attempt->document_id,
                'document_title' => $attempt->document?->original_filename,
                'course' => [
                    'name' => $course?->name,
                    'color' => $course?->color,
                ],
                'total' => $attempt->total_questions,
                'correct' => $attempt->correct_answers,
                'score' => $attempt->score ?? 0,
                'passing_score' => (int) config('sipanda.quiz.passing_score', 70),
                'completed_at' => $attempt->completed_at?->toISOString(),
                'answers' => $answers,
                'breakdown' => $breakdown,
            ],
        ]);
    }

    protected function authorizeDocument(Request $request, Document $document): void
    {
        abort_unless(
            $document->course && $document->course->user_id === $request->user()->id,
            403
        );
    }

    protected function authorizeAttempt(Request $request, QuizAttempt $attempt): void
    {
        abort_unless($attempt->user_id === $request->user()->id, 403);
    }
}
