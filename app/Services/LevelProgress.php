<?php

namespace App\Services;

use App\Models\AttemptAnswer;
use App\Models\Concept;
use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Collection;

class LevelProgress
{
    /**
     * Level untuk satu dokumen. Sumbernya tabel study_levels; kalau belum ada
     * (study pack lama), level dibentuk dari concept yang tersedia. Dipakai
     * bersama StudyPackController dan ringkasan progress Dashboard supaya
     * definisi "level selesai" tidak berbeda antarhalaman.
     *
     * @param  Collection<int, Concept>  $concepts
     * @return Collection<int, array<string, mixed>>
     */
    public function levelRows(Document $document, Collection $concepts): Collection
    {
        $rawLevels = $document->studyLevels()->with('concepts')->get();

        if ($rawLevels->isNotEmpty()) {
            return $rawLevels->map(fn ($level) => [
                'id' => $level->id,
                'title' => $level->title,
                'summary' => $level->summary,
                'key_points' => $level->key_points ?? [],
                'concepts' => $level->concepts->map(fn ($concept) => [
                    'id' => $concept->id,
                    'name' => $concept->name,
                    'description' => $concept->description,
                    'importance' => $concept->importance,
                ])->values()->all(),
            ]);
        }

        if ($concepts->isEmpty()) {
            return collect();
        }

        $target = $concepts->count() <= 3 ? 1 : (int) ceil($concepts->count() / 3);
        $size = (int) ceil($concepts->count() / $target);
        $titles = ['Fondasi', 'Penguatan', 'Pendalaman', 'Penguasaan'];

        return $concepts->chunk($size)->map(function ($group, $index) use ($titles) {
            return [
                'id' => 'legacy-'.($index + 1),
                'title' => $titles[$index] ?? 'Level '.($index + 1),
                'summary' => $group->pluck('description')->filter()->implode(' '),
                'key_points' => $group->pluck('name')->values()->all(),
                'concepts' => $group->map(fn ($concept) => [
                    'id' => $concept->id,
                    'name' => $concept->name,
                    'description' => $concept->description,
                    'importance' => $concept->importance,
                ])->values()->all(),
            ];
        })->values();
    }

    /**
     * Ringkasan level selesai untuk semua dokumen milik user. Persentase ini
     * berasal dari jumlah level yang lolos, bukan rata-rata skor quiz.
     *
     * @param  Collection<int, Document>  $documents
     * @return array{total: int, completed: int, percent: int|null}
     */
    public function completionSummary(User $user, Collection $documents, int $passingScore): array
    {
        $total = 0;
        $completed = 0;

        foreach ($documents as $document) {
            $levels = $this->levelRows($document, $document->concepts()->get(['id', 'name', 'description', 'importance']));

            if ($levels->isEmpty()) {
                continue;
            }

            $masteryByConcept = $this->masteryByConcept($user, $document);

            foreach ($levels as $level) {
                $total++;

                if ($this->evaluate(collect($level['concepts']), $masteryByConcept, $passingScore)['completed']) {
                    $completed++;
                }
            }
        }

        return [
            'total' => $total,
            'completed' => $completed,
            'percent' => $total > 0 ? (int) round($completed / $total * 100) : null,
        ];
    }

    public function masteryByConcept(User $user, Document $document): Collection
    {
        return AttemptAnswer::query()
            ->join('questions', 'questions.id', '=', 'attempt_answers.question_id')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'attempt_answers.quiz_attempt_id')
            ->where('quiz_attempts.user_id', $user->id)
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

    public function evaluate(Collection $concepts, Collection $masteryByConcept, int $passingScore): array
    {
        $tested = 0;
        $totalMastery = 0;

        foreach ($concepts as $concept) {
            $bucket = $masteryByConcept->get($concept['id']);

            if ($bucket === null) {
                continue;
            }

            $tested++;
            $totalMastery += (int) round($bucket['correct'] / $bucket['answered'] * 100);
        }

        $mastery = $tested > 0 ? (int) round($totalMastery / $tested) : null;

        return [
            'tested' => $tested,
            'mastery' => $mastery,
            'completed' => $tested === $concepts->count()
                && $mastery !== null
                && $mastery >= $passingScore,
        ];
    }
}
