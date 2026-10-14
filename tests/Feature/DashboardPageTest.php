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
 * Dashboard sekarang membaca DB. Yang dijaga: angka ringkasan hanya dari data
 * milik user yang login (lewat course.user_id), aktivitas mingguan memakai
 * soal dijawab (bukan menit yang tidak dilacak), dan streak dihitung dari
 * attempt selesai.
 */
class DashboardPageTest extends TestCase
{
    use RefreshDatabase;

    private function course(User $user, string $name = 'Kalkulus'): Course
    {
        return Course::create([
            'user_id' => $user->id,
            'name' => $name,
            'color' => '#465FFF',
        ]);
    }

    private function document(Course $course, string $label = 'a', array $overrides = []): Document
    {
        return Document::create(array_merge([
            'course_id' => $course->id,
            'original_filename' => "bab-{$label}.pdf",
            'stored_filename' => "doc-{$label}.pdf",
            'file_type' => 'pdf',
            'file_size' => 2048,
            'page_count' => 12,
            'status' => 'processed',
            'study_pack_status' => 'ready',
        ], $overrides));
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_index_mengirim_ringkasan_nyata(): void
    {
        $user = User::factory()->create(['name' => 'Budi Santoso']);
        $course = $this->course($user);
        $this->document($course, 'a');
        $this->document($course, 'b', ['study_pack_status' => null]);

        QuizAttempt::create([
            'document_id' => $course->documents()->first()->id,
            'user_id' => $user->id,
            'total_questions' => 4,
            'correct_answers' => 3,
            'score' => 75,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('greeting_name', 'Budi')
                ->where('stats.total_materials', 2)
                ->where('stats.study_packs_ready', 1)
                ->where('stats.quizzes_taken', 1)
                ->where('stats.average_score', 75)
                ->has('weekly_activity', 7)
                ->where('weekly_activity.6.is_today', true));
    }

    public function test_aktivitas_mingguan_menghitung_soal_dijawab(): void
    {
        $user = User::factory()->create();
        $course = $this->course($user);
        $document = $this->document($course, 'a');
        $concept = Concept::create([
            'document_id' => $document->id,
            'name' => 'Limit',
            'description' => 'Limit fungsi',
            'importance' => 'high',
            'sort_order' => 1,
        ]);
        $question = Question::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'question' => 'Limit?',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
            'explanation' => 'A.',
        ]);

        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 1,
            'correct_answers' => 0,
            'score' => 0,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_index' => 1,
            'is_correct' => false,
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.questions_this_week', 1)
                ->where('stats.average_score', 0)
                ->where('weekly_activity.6.questions', 1)
                ->has('recent_quizzes', 1)
                ->where('recent_quizzes.0.material_title', 'bab-a.pdf')
                ->where('recent_quizzes.0.score', 0)
                ->where('recent_quizzes.0.weak_concepts.0', 'Limit'));
    }

    public function test_streak_dihitung_dari_attempt_selesai(): void
    {
        $user = User::factory()->create();
        $course = $this->course($user);
        $document = $this->document($course, 'a');

        foreach ([0, 1, 2] as $daysAgo) {
            QuizAttempt::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'total_questions' => 3,
                'correct_answers' => 3,
                'score' => 100,
                'started_at' => now()->subDays($daysAgo),
                'completed_at' => now()->subDays($daysAgo),
            ]);
        }

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('study_streak_days', 3));
    }

    public function test_data_user_lain_tidak_ikut_terhitung(): void
    {
        $user = User::factory()->create();
        $this->course($user);

        // User lain punya materi + quiz, tidak boleh muncul di dashboard user.
        $other = User::factory()->create();
        $otherCourse = $this->course($other, 'Aljabar');
        $otherDocument = $this->document($otherCourse, 'z');

        QuizAttempt::create([
            'document_id' => $otherDocument->id,
            'user_id' => $other->id,
            'total_questions' => 5,
            'correct_answers' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.total_materials', 0)
                ->where('stats.quizzes_taken', 0)
                ->where('stats.average_score', null)
                ->where('study_streak_days', 0)
                ->has('recent_quizzes', 0));
    }
}
