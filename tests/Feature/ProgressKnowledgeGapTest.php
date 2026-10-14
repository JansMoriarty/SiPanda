<?php

namespace Tests\Feature;

use App\Models\AttemptAnswer;
use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Progress/Knowledge Gap dan Personalized Practice.
 *
 * Dua hal yang dijaga:
 * 1. Data yang dikirim ke halaman hanya milik user yang login. documents dan
 *    concepts tidak punya user_id sendiri, jadi scope-nya lewat course.user_id.
 * 2. Attempt yang belum selesai tidak ikut dihitung, karena belum punya
 *    jawaban apa pun dan cuma menggelembungkan jumlah percobaan.
 */
class ProgressKnowledgeGapTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Course, 2: Document, 3: Concept}
     */
    private function userWithData(string $label = 'a', bool $completed = true): array
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => "Kalkulus {$label}",
            'color' => '#465FFF',
        ]);

        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => "bab-{$label}.pdf",
            'stored_filename' => "doc-{$label}.pdf",
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ]);

        $concept = Concept::create([
            'document_id' => $document->id,
            'name' => "Limit {$label}",
            'description' => 'Deskripsi konsep',
            'importance' => 'high',
            'sort_order' => 0,
        ]);

        $questions = collect();
        for ($i = 0; $i < 2; $i++) {
            $questions->push(Question::create([
                'document_id' => $document->id,
                'concept_id' => $concept->id,
                'question' => "Soal {$label} {$i}",
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => 0,
                'explanation' => 'Pembahasan',
                'source_label' => 'Slide 1',
            ]));
        }

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 2,
            'correct_answers' => 1,
            'score' => 50,
            'started_at' => now(),
            'completed_at' => $completed ? now() : null,
        ]);

        if ($completed) {
            AttemptAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $questions[0]->id,
                'selected_index' => 0,
                'is_correct' => true,
            ]);
            AttemptAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $questions[1]->id,
                'selected_index' => 1,
                'is_correct' => false,
            ]);
        }

        return [$user, $course, $document, $concept];
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/progress')->assertRedirect(route('login'));
    }

    public function test_progress_mengirim_data_milik_user_saja(): void
    {
        [$user, $course, , $concept] = $this->userWithData('a');

        // Data user lain tidak boleh ikut terbawa.
        $this->userWithData('b');

        $this->actingAs($user)
            ->get('/progress')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Progress/Index')
                ->has('courses', 1)
                ->where('courses.0.name', $course->name)
                ->has('concepts', 1)
                ->where('concepts.0.name', $concept->name)
                ->where('concepts.0.course_id', $course->id)
                ->has('questions', 2)
                ->has('attempts', 1)
                ->where('attempts.0.document_title', 'bab-a.pdf')
                ->where('attempts.0.course_id', $course->id)
                ->has('attempts.0.answers', 2)
                ->where('attempts.0.answers.0.correct', true)
                ->where('attempts.0.answers.1.correct', false));
    }

    public function test_progress_tidak_menghitung_attempt_belum_selesai(): void
    {
        [$user] = $this->userWithData('a', completed: false);

        $this->actingAs($user)
            ->get('/progress')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Progress/Index')
                ->has('attempts', 0));
    }

    public function test_practice_course_milik_user_dapat_dibuka(): void
    {
        [$user, $course] = $this->userWithData('a');

        $this->actingAs($user)
            ->get(route('practice.show', $course))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Practice/Index')
                ->where('courseId', $course->id)
                ->has('questions', 2)
                ->has('concepts', 1));
    }

    public function test_practice_course_orang_lain_ditolak(): void
    {
        [, $course] = $this->userWithData('a');
        $other = User::factory()->create();

        $this->actingAs($other)
            ->get(route('practice.show', $course))
            ->assertForbidden();
    }

    public function test_practice_guest_diarahkan_ke_login(): void
    {
        [, $course] = $this->userWithData('a');

        $this->get(route('practice.show', $course))->assertRedirect(route('login'));
    }
}
