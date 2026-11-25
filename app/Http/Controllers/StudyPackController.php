<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\FlashcardReview;
use App\Models\QuizAttempt;
use App\Services\LevelProgress;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Study Pack satu dokumen: ringkasan, poin penting, konsep (+penguasaan),
 * kartu belajar (+status tinjauan user), dan ringkasan quiz. Semua di-scope
 * lewat course.user_id.
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

        $xpService = app(XpService::class);
        $claimedLevelIds = $xpService->claimedRewardLevelIds($request->user());

        $questions = $document->questions()->get(['id', 'concept_id']);

        $flashcards = $document->flashcards()
            ->with('concept:id,name,importance')
            ->orderBy('concept_id')
            ->orderBy('sort_order')
            ->get(['id', 'concept_id', 'front', 'back', 'sort_order']);

        // known di-key by flashcard_id. Kartu yang belum pernah ditandai tidak
        // muncul di sini, jadi UI bisa membedakan "belum ditinjau" (null) dari
        // "perlu diulang" (false).
        $reviewStates = $flashcards->isEmpty()
            ? collect()
            : FlashcardReview::query()
                ->where('user_id', $request->user()->id)
                ->whereIn('flashcard_id', $flashcards->pluck('id'))
                ->pluck('known', 'flashcard_id');

        $attempts = QuizAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('document_id', $document->id)
            ->whereNotNull('completed_at');

        $bestScore = (clone $attempts)->max('score');
        $passingScore = (int) config('sipanda.quiz.passing_score', 70);

        $levels = $this->levelsPayload(
            $document,
            $concepts,
            $questions,
            $flashcards,
            $masteryByConcept,
            $passingScore,
            $claimedLevelIds
        );

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
                'levels' => $levels,
                'xp' => $xpService->snapshot($request->user()),
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
                // Kartu belajar + status tinjauan user ini. 'known' null berarti
                // kartu belum pernah ditandai, false berarti perlu diulang.
                'flashcards' => $flashcards->map(fn ($card) => [
                    'id' => $card->id,
                    'concept_id' => $card->concept_id,
                    'concept_name' => $card->concept?->name,
                    'importance' => $card->concept?->importance,
                    'front' => $card->front,
                    'back' => $card->back,
                    'known' => $reviewStates->has($card->id) ? (bool) $reviewStates->get($card->id) : null,
                ])->values(),
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
                    'scope_note' => 'Pertanyaan dijawab hanya seputar modul ini. Pertanyaan di luar modul tidak akan dijawab.',
                    'suggested_questions' => $concepts
                        ->take(3)
                        ->map(fn ($concept) => "Jelaskan konsep \"{$concept->name}\" pada materi ini.")
                        ->values(),
                ],
            ],
        ]);
    }

    private function levelsPayload(
        Document $document,
        Collection $concepts,
        Collection $questions,
        Collection $flashcards,
        Collection $masteryByConcept,
        int $passingScore,
        Collection $claimedLevelIds
    ): array {
        $progress = app(LevelProgress::class);
        $rawLevels = $progress->levelRows($document, $concepts);
        $questionConcepts = $questions->pluck('concept_id')->unique();
        $previousCompleted = true;
        $targetIndex = count($rawLevels) - 1;
        $allCompleted = $rawLevels->every(function (array $row) use ($progress, $masteryByConcept, $passingScore): bool {
            return $progress->evaluate(collect($row['concepts']), $masteryByConcept, $passingScore)['completed'];
        });
        $payload = [];

        foreach ($rawLevels as $index => $level) {
            $levelConcepts = collect($level['concepts']);
            $ids = $levelConcepts->pluck('id');

            $conceptRows = $levelConcepts->map(function ($concept) use ($masteryByConcept) {
                $bucket = $masteryByConcept->get($concept['id']);

                return [
                    'id' => $concept['id'],
                    'name' => $concept['name'],
                    'description' => $concept['description'],
                    'importance' => $concept['importance'],
                    'mastery' => $bucket === null
                        ? null
                        : (int) round($bucket['correct'] / $bucket['answered'] * 100),
                ];
            })->values();

            $result = $progress->evaluate($levelConcepts, $masteryByConcept, $passingScore);
            $mastery = $result['mastery'];
            $completed = $result['completed'];
            $locked = $index > 0 && ! $previousCompleted;

            $levelId = $level['id'];
            $isReward = $index === $targetIndex && is_numeric($levelId);
            $canClaim = $isReward && $allCompleted;
            $claimed = $isReward && $claimedLevelIds->contains((int) $levelId);
            $xpPoints = (int) config('sipanda.xp.per_claim', 50);

            $payload[] = [
                'id' => $levelId,
                'number' => $index + 1,
                'title' => $level['title'],
                'summary' => $level['summary'],
                'key_points' => $level['key_points'],
                'concepts' => $conceptRows,
                'concept_ids' => $ids->values()->all(),
                'flashcards' => $flashcards->filter(fn ($card) => $ids->contains($card->concept_id))->count(),
                'covered_concepts' => $ids->filter(fn ($id) => $questionConcepts->contains($id))->count(),
                'mastery' => $mastery,
                'tested' => $result['tested'],
                'completed' => $completed,
                'locked' => $locked,
                'xp_points' => $isReward ? $xpPoints : 0,
                'xp_unlocked' => $canClaim && $completed,
                'xp_claimed' => $claimed,
                'xp_claim_url' => $canClaim ? route('xp.claims.store', (int) $levelId) : null,
            ];

            $previousCompleted = $completed;
        }

        return $payload;
    }

    /**
     * concept_id => ['answered' => int, 'correct' => int] untuk attempt milik
     * user ini pada dokumen ini.
     *
     * @return Collection<int, array{answered: int, correct: int}>
     */
    private function masteryByConcept(Request $request, Document $document): Collection
    {
        return app(LevelProgress::class)->masteryByConcept($request->user(), $document);
    }

    private function authorizeOwnership(Request $request, Document $document): void
    {
        abort_unless(
            $document->course && $document->course->user_id === $request->user()->id,
            403
        );
    }
}
