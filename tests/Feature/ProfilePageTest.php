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
 * Halaman /profile sekarang membaca DB untuk statistik belajar, sementara
 * identitas tetap datang dari auth.user dan hanya aksi avatar yang menulis
 * ke server.
 *
 * Dua hal yang dijaga:
 *  1. statis  - satu-satunya route() yang dipanggil halaman ini tetap tiga
 *     route avatar, dan hanya ada tiga aksi server (unggah, pilih pack, hapus
 *     avatar), supaya bagian statistik tidak diam-diam menulis ke server.
 *  2. dinamis - angka statistik hanya dari attempt milik user yang login
 *     (lewat course.user_id), dan streak ikut dihitung.
 */
class ProfilePageTest extends TestCase
{
    use RefreshDatabase;

    private function source(): string
    {
        $path = resource_path('js/Pages/Profile/Index.jsx');
        $this->assertFileExists($path);

        return (string) preg_replace('#/\*.*?\*/#s', '', file_get_contents($path));
    }

    public function test_hanya_route_avatar_yang_dipanggil_dari_halaman_profile(): void
    {
        preg_match_all('/route\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $this->source(), $matches);

        $this->assertSame(
            ['profile.avatar.store', 'profile.avatar.pack', 'profile.avatar.destroy'],
            array_values(array_unique($matches[1])),
            'halaman Profile hanya boleh memanggil route avatar'
        );
    }

    public function test_hanya_dua_aksi_server_yaitu_avatar(): void
    {
        $source = $this->source();

        $this->assertDoesNotMatchRegularExpression('/router\.(get|put|patch)\b/', $source);
        $this->assertSame(
            3,
            preg_match_all('/router\.(post|delete)\b/', $source),
            'hanya aksi avatar yang boleh menghubungi server'
        );
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/profile')->assertRedirect(route('login'));
    }

    public function test_index_mengirim_gap_dan_streak(): void
    {
        $user = User::factory()->create();
        $course = Course::create(['user_id' => $user->id, 'name' => 'Kalkulus', 'color' => '#465FFF']);
        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab-a.pdf',
            'stored_filename' => 'doc-a.pdf',
            'file_type' => 'pdf',
            'file_size' => 2048,
            'page_count' => 12,
            'status' => 'processed',
        ]);
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
            'correct_answers' => 1,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_index' => 0,
            'is_correct' => true,
        ]);

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Index')
                ->where('streak.current', 1)
                ->where('streak.longest', 1)
                ->has('gap.courses', 1)
                ->where('gap.courses.0.name', 'Kalkulus')
                ->has('gap.attempts', 1)
                ->where('gap.attempts.0.quiz_id', $document->id)
                ->where('gap.attempts.0.document_title', 'bab-a.pdf'));
    }

    public function test_profil_mengirim_xp_dan_progres_tier(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 120])->save();

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Index')
                ->where('auth.user.xp.balance', 120)
                ->where('auth.user.xp.tier.id', 'ambisius')
                ->where('auth.user.xp.tier.pack', 'ambisius')
                ->where('auth.user.xp.tier.next.label', 'Pakar')
                ->where('auth.user.xp.tier.progress.percent', 10)
                ->where('auth.user.xp.tier.progress.remaining', 180)
                ->has('auth.user.xp.timeline', 5)
                ->where('auth.user.xp.timeline.0.status', 'achieved')
                ->where('auth.user.xp.timeline.1.status', 'current')
                ->where('auth.user.xp.timeline.1.reward', 'Paket Avatar Critters (6)')
                ->where('auth.user.xp.timeline.1.pack', 'ambisius')
                ->where('auth.user.xp.timeline.2.label', 'Pakar')
                ->where('auth.user.xp.timeline.2.status', 'locked')
                ->has('avatarPacks', 5)
                ->where('avatarPacks.0.unlocked', true)
                ->where('avatarPacks.0.claimed', false)
                ->where('avatarPacks.0.count', 4)
                ->where('avatarPacks.1.unlocked', true)
                ->where('avatarPacks.1.claimed', false)
                ->where('avatarPacks.1.count', 6)
                ->where('avatarPacks.1.items.0.url', fn ($url) => str_contains($url, '/critters/svg?'))
                ->where('avatarPacks.1.items.0.url', fn ($url) => str_contains($url, sprintf('seed=sipanda-%d-ambisius-01', $user->id)))
                ->where('avatarPacks.2.unlocked', false));
    }

    public function test_statistik_tidak_menyertakan_data_user_lain(): void
    {
        $user = User::factory()->create();
        Course::create(['user_id' => $user->id, 'name' => 'Kalkulus', 'color' => '#465FFF']);

        $other = User::factory()->create();
        $otherCourse = Course::create(['user_id' => $other->id, 'name' => 'Aljabar', 'color' => '#FF0000']);
        $otherDocument = Document::create([
            'course_id' => $otherCourse->id,
            'original_filename' => 'bab-z.pdf',
            'stored_filename' => 'doc-z.pdf',
            'file_type' => 'pdf',
            'file_size' => 2048,
            'page_count' => 12,
            'status' => 'processed',
        ]);
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
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->has('gap.courses', 1)
                ->where('gap.courses.0.name', 'Kalkulus')
                ->has('gap.attempts', 0)
                ->where('streak.current', 0));
    }
}
