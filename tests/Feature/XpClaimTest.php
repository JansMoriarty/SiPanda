<?php

namespace Tests\Feature;

use App\Models\AttemptAnswer;
use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\StudyLevel;
use App\Models\User;
use App\Models\XpClaim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class XpClaimTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Document, 2: StudyLevel, 3: StudyLevel}
     */
    private function completedMaterial(int $xp = 0): array
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => $xp])->save();

        $course = Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#465FFF',
        ]);

        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab.pdf',
            'stored_filename' => 'doc.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
            'study_pack_status' => 'ready',
        ]);

        $first = StudyLevel::create([
            'document_id' => $document->id,
            'level_number' => 1,
            'title' => 'Dasar',
            'sort_order' => 0,
        ]);
        $second = StudyLevel::create([
            'document_id' => $document->id,
            'level_number' => 2,
            'title' => 'Lanjutan',
            'sort_order' => 1,
        ]);

        $questions = [];

        foreach ([[$first, 'Limit'], [$second, 'Turunan']] as [$level, $name]) {
            $concept = Concept::create([
                'document_id' => $document->id,
                'level_id' => $level->id,
                'name' => $name,
                'sort_order' => $level->level_number,
            ]);

            $questions[] = Question::create([
                'document_id' => $document->id,
                'concept_id' => $concept->id,
                'level_id' => $level->id,
                'question' => "Soal {$name}?",
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => 0,
                'explanation' => 'Karena A.',
            ]);
        }

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => count($questions),
            'correct_answers' => count($questions),
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        foreach ($questions as $question) {
            AttemptAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $question->id,
                'selected_index' => $question->correct_index,
                'is_correct' => true,
            ]);
        }

        return [$user, $document, $first, $second];
    }

    public function test_klaim_level_target_menambah_xp(): void
    {
        [$user, , , $second] = $this->completedMaterial();

        $this->actingAs($user)
            ->post(route('xp.claims.store', $second))
            ->assertRedirect();

        $user->refresh();

        $this->assertSame(50, $user->xp);
        $this->assertDatabaseCount('xp_claims', 1);
        $this->assertDatabaseHas('xp_claims', [
            'user_id' => $user->id,
            'level_id' => $second->id,
            'points' => 50,
        ]);
    }

    public function test_submit_quiz_memberi_5_xp_per_level_selesai(): void
    {
        [$user, $document, $first, $second] = $this->completedMaterial();

        $questions = $document->questions()->orderBy('id')->get();
        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => $questions->count(),
            'started_at' => now(),
        ]);

        $answers = $questions
            ->map(fn ($question) => [
                'question_id' => $question->id,
                'chosen' => $question->correct_index,
            ])
            ->all();

        $this->actingAs($user)
            ->post(route('materials.quiz.submit', $attempt), ['answers' => $answers])
            ->assertRedirect(route('quiz.results', $attempt));

        $user->refresh();

        $this->assertSame(20, $user->xp);
        $this->assertDatabaseHas('xp_claims', [
            'user_id' => $user->id,
            'level_id' => $first->id,
            'points' => 5,
        ]);
        $this->assertDatabaseHas('xp_claims', [
            'user_id' => $user->id,
            'level_id' => $second->id,
            'points' => 5,
        ]);
    }

    public function test_klaim_target_setelah_dapat_5_xp_tetap_menambah_50(): void
    {
        [$user, , , $second] = $this->completedMaterial();

        XpClaim::create([
            'user_id' => $user->id,
            'level_id' => $second->id,
            'points' => 5,
            'claimed_at' => now(),
        ]);

        $this->actingAs($user)
            ->post(route('xp.claims.store', $second))
            ->assertRedirect();

        $user->refresh();

        $this->assertSame(50, $user->xp);
        $this->assertDatabaseHas('xp_claims', [
            'user_id' => $user->id,
            'level_id' => $second->id,
            'points' => 55,
        ]);
    }

    public function test_klaim_ulang_tidak_menambah_xp(): void
    {
        [$user, , , $second] = $this->completedMaterial();

        $this->actingAs($user)
            ->post(route('xp.claims.store', $second))
            ->assertRedirect();

        $this->actingAs($user)
            ->post(route('xp.claims.store', $second))
            ->assertRedirect();

        $user->refresh();

        $this->assertSame(50, $user->xp);
        $this->assertDatabaseCount('xp_claims', 1);
    }

    public function test_level_non_target_tidak_bisa_diklaim(): void
    {
        [$user, , $first] = $this->completedMaterial();

        $this->actingAs($user)
            ->post(route('xp.claims.store', $first))
            ->assertStatus(422);

        $this->assertDatabaseCount('xp_claims', 0);
    }

    public function test_level_belum_selesai_tidak_bisa_diklaim(): void
    {
        [$user, , , $second] = $this->completedMaterial();

        AttemptAnswer::query()->delete();
        $second->concepts()->first()->questions()->delete();

        $this->actingAs($user)
            ->post(route('xp.claims.store', $second))
            ->assertStatus(422);

        $this->assertDatabaseCount('xp_claims', 0);
    }

    public function test_level_sebelum_target_belum_selesai_tidak_bisa_diklaim(): void
    {
        [$user, , $first, $second] = $this->completedMaterial();

        AttemptAnswer::query()
            ->whereIn('question_id', $first->concepts()->first()->questions()->pluck('id'))
            ->delete();

        $this->actingAs($user)
            ->post(route('xp.claims.store', $second))
            ->assertStatus(422);

        $this->assertDatabaseCount('xp_claims', 0);
    }

    public function test_tidak_bisa_klaim_level_dokumen_orang_lain(): void
    {
        [, , , $second] = $this->completedMaterial();
        $other = User::factory()->create();

        $this->actingAs($other)
            ->post(route('xp.claims.store', $second))
            ->assertForbidden();

        $this->assertDatabaseCount('xp_claims', 0);
    }

    public function test_study_pack_mengirim_status_klaim_dan_navbar_mengirim_tier(): void
    {
        [$user, $document, , $second] = $this->completedMaterial(120);
        XpClaim::create([
            'user_id' => $user->id,
            'level_id' => $second->id,
            'points' => 50,
            'claimed_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pack.xp.balance', 120)
                ->where('pack.xp.per_level', 5)
                ->where('pack.xp.tier.id', 'ambisius')
                ->where('pack.xp.tier.next.id', 'pakar')
                ->where('pack.xp.tier.progress.remaining', 180)
                ->where('pack.levels.1.xp_points', 50)
                ->where('pack.levels.1.xp_unlocked', true)
                ->where('pack.levels.1.xp_claimed', true)
                ->where('auth.user.xp.balance', 120)
                ->where('auth.user.xp.tier.id', 'ambisius')
                ->where('auth.user.xp.tier.progress.percent', 10));
    }
}
