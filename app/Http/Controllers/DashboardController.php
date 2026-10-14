<?php

namespace App\Http\Controllers;

use App\Models\AttemptAnswer;
use App\Models\Document;
use App\Models\QuizAttempt;
use App\Services\Progress\ProgressData;
use App\Services\Progress\StudyStreak;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/**
 * Dashboard V2: ringkasan belajar + preview Knowledge Gap.
 *
 * CATATAN PENTING soal "aktivitas mingguan": aplikasi TIDAK melacak durasi
 * belajar (tidak ada kolom menit). Karena itu grafik mingguan memakai data
 * nyata yang memang ada, yaitu jumlah soal yang dijawab per hari dari
 * attempt_answers, bukan menit. Jangan mengarang menit.
 *
 * Data gap (courses/concepts/questions/attempts) diambil dari ProgressData
 * supaya angka di Dashboard tidak pernah berbeda dengan halaman Progress:
 * persentasenya tetap dihitung satu kali di resources/js/utils/gap.js.
 * Semua query di-scope lewat course.user_id.
 */
class DashboardController extends Controller
{
    public function index(Request $request, ProgressData $progressData, StudyStreak $streak)
    {
        $user = $request->user();

        $courseIds = $user->courses()->pluck('id');

        $documents = Document::query()
            ->whereIn('course_id', $courseIds)
            ->with('course:id,user_id,name,color')
            ->latest('updated_at')
            ->get();

        $documentIds = $documents->pluck('id');

        $weekly = $this->weeklyActivity($user->id, $documentIds);
        $questionsThisWeek = array_sum(array_column($weekly, 'questions'));

        $completedQuery = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('document_id', $documentIds)
            ->whereNotNull('completed_at');

        $quizzesTaken = (clone $completedQuery)->count();
        $averageScore = $quizzesTaken > 0
            ? (int) round((clone $completedQuery)->avg('score'))
            : null;

        $lastScores = (clone $completedQuery)
            ->orderBy('completed_at')
            ->get(['document_id', 'score'])
            ->groupBy('document_id')
            ->map(fn ($rows) => $rows->last()->score);

        return Inertia::render('Dashboard', [
            'greeting_name' => $this->greetingName($user->name),
            'study_streak_days' => $streak->forUser($user->id, $documentIds)['current'],
            'stats' => [
                'total_materials' => $documents->count(),
                'study_packs_ready' => $documents->where('study_pack_status', 'ready')->count(),
                'quizzes_taken' => $quizzesTaken,
                'average_score' => $averageScore,
                'questions_this_week' => $questionsThisWeek,
                'passing_score' => (int) config('sipanda.quiz.passing_score', 70),
            ],
            'weekly_activity' => $weekly,
            'continue_learning' => $documents->take(3)->map(fn (Document $document) => [
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
                'last_quiz_score' => $lastScores[$document->id] ?? null,
                'study_pack' => [
                    'status' => $document->study_pack_status,
                    'progress' => match ($document->study_pack_status) {
                        'ready' => 100,
                        'generating' => null,
                        default => 0,
                    },
                ],
            ])->values(),
            'recent_quizzes' => $this->recentQuizzes($user->id, $documentIds),
            'gap' => $progressData->forUser($user),
        ]);
    }

    private function greetingName(string $name): string
    {
        return trim(explode(' ', trim($name))[0]) ?: $name;
    }

    /**
     * Jumlah soal yang dijawab tiap hari untuk 7 hari terakhir (termasuk hari
     * ini). Dipakai sebagai grafik "aktivitas" karena durasi belajar tidak
     * dilacak.
     *
     * @param  \Illuminate\Support\Collection<int, int>  $documentIds
     * @return array<int, array{day: string, date: string, questions: int, is_today: bool}>
     */
    private function weeklyActivity(int $userId, $documentIds): array
    {
        $start = Carbon::today()->subDays(6);

        $counts = AttemptAnswer::query()
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'attempt_answers.quiz_attempt_id')
            ->where('quiz_attempts.user_id', $userId)
            ->whereIn('quiz_attempts.document_id', $documentIds)
            ->whereNotNull('quiz_attempts.completed_at')
            ->where('quiz_attempts.completed_at', '>=', $start)
            ->groupBy('day')
            ->selectRaw('DATE(quiz_attempts.completed_at) as day, COUNT(*) as questions')
            ->pluck('questions', 'day');

        $labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        $days = [];

        for ($i = 0; $i < 7; $i++) {
            $date = $start->copy()->addDays($i);
            $key = $date->toDateString();

            $days[] = [
                'day' => $labels[(int) $date->dayOfWeek],
                'date' => $key,
                'questions' => (int) ($counts[$key] ?? 0),
                'is_today' => $date->isToday(),
            ];
        }

        return $days;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, int>  $documentIds
     * @return array<int, array<string, mixed>>
     */
    private function recentQuizzes(int $userId, $documentIds): array
    {
        return QuizAttempt::query()
            ->where('user_id', $userId)
            ->whereIn('document_id', $documentIds)
            ->whereNotNull('completed_at')
            ->with('document.course:id,name,color', 'answers.question.concept:id,name')
            ->latest('completed_at')
            ->limit(5)
            ->get()
            ->map(function (QuizAttempt $attempt) {
                $weak = $attempt->answers
                    ->filter(fn ($answer) => ! $answer->is_correct)
                    ->map(fn ($answer) => $answer->question?->concept?->name)
                    ->filter()
                    ->unique()
                    ->values();

                return [
                    'id' => $attempt->id,
                    'document_id' => $attempt->document_id,
                    'material_title' => $attempt->document?->original_filename,
                    'course' => $attempt->document?->course?->name,
                    'score' => $attempt->score ?? 0,
                    'correct' => $attempt->correct_answers,
                    'total' => $attempt->total_questions,
                    'weak_concepts' => $weak,
                    'completed_at' => $attempt->completed_at?->toISOString(),
                    'results_url' => route('quiz.results', $attempt),
                ];
            })
            ->values()
            ->all();
    }
}
