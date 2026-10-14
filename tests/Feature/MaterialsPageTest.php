<?php

namespace Tests\Feature;

use App\Jobs\GenerateStudyPackJob;
use App\Models\Course;
use App\Models\Document;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Materials/Index dan Materials/Show sekarang membaca DB. Yang dijaga:
 * hanya materi milik user yang login (lewat course.user_id) yang boleh
 * muncul, dan aksi buat-ulang study pack di-scope lewat pemeriksaan sama.
 */
class MaterialsPageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Course, 2: Document}
     */
    private function material(string $label = 'a', array $overrides = []): array
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => "Kalkulus {$label}",
            'color' => '#465FFF',
        ]);

        $document = Document::create(array_merge([
            'course_id' => $course->id,
            'original_filename' => "bab-{$label}.pdf",
            'stored_filename' => "doc-{$label}.pdf",
            'file_type' => 'pdf',
            'file_size' => 2048,
            'page_count' => 12,
            'status' => 'processed',
            'study_pack_status' => 'ready',
        ], $overrides));

        return [$user, $course, $document];
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/materials')->assertRedirect(route('login'));
    }

    public function test_index_mengirim_materi_dan_course_milik_user(): void
    {
        [$user, $course, $document] = $this->material('a');

        // Materi user lain tidak boleh ikut.
        $this->material('b');

        $this->actingAs($user)
            ->get('/materials')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Materials/Index')
                ->has('materials', 1)
                ->where('materials.0.title', 'bab-a.pdf')
                ->where('materials.0.course.name', $course->name)
                ->where('materials.0.study_pack.status', 'ready')
                ->where('materials.0.study_pack.progress', 100)
                ->has('courses', 1)
                ->where('courses.0.name', $course->name)
                ->where('courses.0.documents_count', 1));
    }

    public function test_index_menyertakan_skor_quiz_terakhir_milik_user(): void
    {
        [$user, , $document] = $this->material('a');

        QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 4,
            'correct_answers' => 3,
            'score' => 75,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/materials')
            ->assertInertia(fn (Assert $page) => $page
                ->where('materials.0.last_quiz_score', 75));
    }

    public function test_show_mengirim_detail_materi_milik_user(): void
    {
        [$user, , $document] = $this->material('a');

        $this->actingAs($user)
            ->get(route('materials.show', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Materials/Show')
                ->where('document.id', $document->id)
                ->where('document.title', 'bab-a.pdf'));
    }

    public function test_show_menolak_dokumen_orang_lain(): void
    {
        [, , $document] = $this->material('a');
        $other = User::factory()->create();

        $this->actingAs($other)
            ->get(route('materials.show', $document))
            ->assertForbidden();
    }

    public function test_buat_ulang_study_pack_mendispatch_job(): void
    {
        Bus::fake();

        [$user, , $document] = $this->material('a');

        $this->actingAs($user)
            ->post(route('materials.study-pack.generate', $document))
            ->assertRedirect();

        Bus::assertDispatched(GenerateStudyPackJob::class, fn ($job) => $job->document->is($document));
    }

    public function test_buat_ulang_study_pack_menolak_dokumen_orang_lain(): void
    {
        Bus::fake();

        [, , $document] = $this->material('a');
        $other = User::factory()->create();

        $this->actingAs($other)
            ->post(route('materials.study-pack.generate', $document))
            ->assertForbidden();

        Bus::assertNotDispatched(GenerateStudyPackJob::class);
    }

    public function test_dokumen_tanpa_study_pack_tidak_ditandai_ready(): void
    {
        [$user] = $this->material('a', ['study_pack_status' => null]);

        $this->actingAs($user)
            ->get('/materials')
            ->assertInertia(fn (Assert $page) => $page
                ->where('materials.0.study_pack.status', null)
                ->where('materials.0.study_pack.progress', 0));
    }
}
