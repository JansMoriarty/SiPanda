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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Alur Quiz end-to-end lewat HTTP + Inertia. Menegaskan attempt dibuat saat
 * start, skor dihitung di server saat submit, dan akses selalu di-scope ke
 * pemilik (document lewat course.user_id, attempt lewat user_id).
 */
class QuizFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Document, 2: Concept}
     */
    private function material(int $questionCount = 3): array
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#0c9c8f',
        ]);

        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_test.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ]);

        $concept = Concept::create([
            'document_id' => $document->id,
            'name' => 'Limit',
            'sort_order' => 0,
        ]);

        for ($i = 0; $i < $questionCount; $i++) {
            Question::create([
                'document_id' => $document->id,
                'concept_id' => $concept->id,
                'question' => "Soal {$i}",
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => $i % 4,
                'explanation' => 'Pembahasan',
                'source_label' => 'Slide 1',
            ]);
        }

        return [$user, $document, $concept];
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/documents/1/quiz')->assertRedirect(route('login'));
    }

    public function test_start_membuat_attempt_dan_mengirim_session(): void
    {
        [$user, $document] = $this->material(3);

        $this->actingAs($user)
            ->get(route('materials.quiz', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Quiz/Index')
                ->has('session.questions', 3)
                ->where('session.total_questions', 3)
                ->where('session.passing_score', 70)
                ->where('session.time_limit_minutes', config('sipanda.quiz.time_limit_minutes'))
                ->where('session.started_at', fn ($value) => is_string($value)));

        $this->assertDatabaseCount('quiz_attempts', 1);

        $attempt = QuizAttempt::first();
        $this->assertSame($user->id, $attempt->user_id);
        $this->assertSame($document->id, $attempt->document_id);
        $this->assertNotNull($attempt->started_at);
    }

    public function test_halaman_quiz_memiliki_peringatan_keluar_dan_countdown(): void
    {
        $quizPage = file_get_contents(resource_path('js/Pages/Quiz/Index.jsx'));
        $runner = file_get_contents(resource_path('js/Components/QuizRunner.jsx'));

        $this->assertStringContainsString('Perubahan anda tidak akan tersimpan', $quizPage);
        $this->assertStringContainsString('inertia:before', $quizPage);
        $this->assertStringContainsString('beforeunload', $quizPage);
        $this->assertStringContainsString('popstate', $quizPage);
        $this->assertStringContainsString('Sisa {formatClock(seconds)}', $runner);
        $this->assertStringContainsString('setInterval', $runner);
    }

    public function test_start_dengan_level_hanya_memilih_soal_level_tersebut(): void
    {
        [$user, $document, $concept] = $this->material(0);

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

        Question::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'level_id' => $first->id,
            'question' => 'Soal level 1',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
        ]);

        Question::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'level_id' => $second->id,
            'question' => 'Soal level 2',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 1,
        ]);

        $this->actingAs($user)
            ->get(route('materials.quiz', $document).'?level=2')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Quiz/Index')
                ->has('session.questions', 1)
                ->where('session.questions.0.question', 'Soal level 2')
                ->where('session.level_number', 2));

        $this->assertSame($second->id, QuizAttempt::first()->level_id);
    }

    public function test_start_tanpa_soal_diarahkan_ke_study_pack(): void
    {
        [$user, $document] = $this->material(0);

        $this->actingAs($user)
            ->get(route('materials.quiz', $document))
            ->assertRedirect(route('materials.study-pack', $document));

        $this->assertDatabaseCount('quiz_attempts', 0);
    }

    public function test_tidak_bisa_start_document_orang_lain(): void
    {
        [, $document] = $this->material(2);
        $other = User::factory()->create();

        $this->actingAs($other)
            ->get(route('materials.quiz', $document))
            ->assertForbidden();
    }

    public function test_submit_menghitung_skor_dan_menyimpan_jawaban(): void
    {
        [$user, $document] = $this->material(2);

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 2,
            'started_at' => now(),
        ]);

        $questions = $document->questions()->orderBy('id')->get();

        $answers = [
            ['question_id' => $questions[0]->id, 'chosen' => $questions[0]->correct_index],
            ['question_id' => $questions[1]->id, 'chosen' => ($questions[1]->correct_index + 1) % 4],
        ];

        $this->actingAs($user)
            ->post(route('materials.quiz.submit', $attempt), ['answers' => $answers])
            ->assertRedirect(route('quiz.results', $attempt));

        $attempt->refresh();
        $this->assertSame(50, $attempt->score);
        $this->assertSame(1, $attempt->correct_answers);
        $this->assertNotNull($attempt->completed_at);
        $this->assertDatabaseCount('attempt_answers', 2);
    }

    public function test_submit_memberi_10_xp_satu_kali_per_attempt(): void
    {
        [$user, $document] = $this->material(2);

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 2,
            'started_at' => now(),
        ]);

        $questions = $document->questions()->orderBy('id')->get();
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

        $this->assertSame(10, $user->xp);

        $this->actingAs($user)
            ->get(route('quiz.results', $attempt))
            ->assertInertia(fn (Assert $page) => $page->where('result.xp_awarded', 10));

        $this->actingAs($user)
            ->post(route('materials.quiz.submit', $attempt), ['answers' => $answers])
            ->assertRedirect(route('quiz.results', $attempt));

        $user->refresh();

        $this->assertSame(10, $user->xp);
    }

    public function test_tidak_bisa_submit_attempt_orang_lain(): void
    {
        [$owner, $document] = $this->material(1);
        $other = User::factory()->create();

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $owner->id,
            'total_questions' => 1,
            'started_at' => now(),
        ]);

        $this->actingAs($other)
            ->post(route('materials.quiz.submit', $attempt), ['answers' => []])
            ->assertForbidden();
    }

    public function test_results_menampilkan_breakdown_per_konsep(): void
    {
        [$user, $document, $concept] = $this->material(2);

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 2,
            'correct_answers' => 1,
            'score' => 50,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $questions = $document->questions()->orderBy('id')->get();

        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $questions[0]->id,
            'selected_index' => $questions[0]->correct_index,
            'is_correct' => true,
        ]);
        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $questions[1]->id,
            'selected_index' => 3,
            'is_correct' => false,
        ]);

        $this->actingAs($user)
            ->get(route('quiz.results', $attempt))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Quiz/Results')
                ->where('result.score', 50)
                ->where('result.total', 2)
                ->where('result.correct', 1)
                ->has('result.breakdown', 1)
                ->where('result.breakdown.0.name', $concept->name)
                ->where('result.breakdown.0.score', 50));
    }

    public function test_tidak_bisa_lihat_results_orang_lain(): void
    {
        [$owner, $document] = $this->material(1);
        $other = User::factory()->create();

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $owner->id,
            'total_questions' => 1,
            'started_at' => now(),
        ]);

        $this->actingAs($other)
            ->get(route('quiz.results', $attempt))
            ->assertForbidden();
    }
}
