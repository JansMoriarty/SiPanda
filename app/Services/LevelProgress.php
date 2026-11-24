<?php

namespace App\Services;

use App\Models\AttemptAnswer;
use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Collection;

class LevelProgress
{
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
