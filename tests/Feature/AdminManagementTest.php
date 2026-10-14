<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Document;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Fase 2-4 admin: analitik dashboard, manajemen user, dan daftar user online.
 *
 * Yang dijaga: angka dashboard benar lintas-user, filter user bekerja, aksi
 * berbahaya (menurunkan/menonaktifkan/menghapus) dijaga, sesi diputus saat
 * user dinonaktifkan, dan akun nonaktif tidak bisa login.
 */
class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => User::ROLE_ADMIN])->save();

        return $user;
    }

    private function student(array $attributes = []): User
    {
        $user = User::factory()->create();

        if ($attributes !== []) {
            $user->forceFill($attributes)->save();
        }

        return $user;
    }

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

    /** Suntik baris sesi (SESSION_DRIVER=database) untuk uji status online. */
    private function insertSession(int $userId, ?int $timestamp = null): void
    {
        DB::table('sessions')->insert([
            'id' => Str::random(40),
            'user_id' => $userId,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0 Safari/537.36',
            'payload' => base64_encode(serialize([])),
            'last_activity' => $timestamp ?? now()->getTimestamp(),
        ]);
    }

    public function test_student_biasa_tidak_bisa_membuka_manajemen_user(): void
    {
        $this->actingAs($this->student())->get('/admin/users')->assertForbidden();
    }

    public function test_dashboard_menampilkan_statistik_lintas_user(): void
    {
        $admin = $this->admin();
        $other = $this->student();
        $this->student(['is_active' => false]);

        $course = $this->course($other);
        $this->document($course, 'a');
        $this->document($course, 'b', ['status' => 'failed', 'study_pack_status' => null]);

        QuizAttempt::create([
            'document_id' => $course->documents()->first()->id,
            'user_id' => $other->id,
            'total_questions' => 4,
            'correct_answers' => 3,
            'score' => 75,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->insertSession($admin->id);

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('stats.total_users', 3)
                ->where('stats.inactive_users', 1)
                ->where('stats.online_now', 1)
                ->where('stats.total_documents', 2)
                ->where('stats.documents_failed', 1)
                ->where('stats.study_packs_ready', 1)
                ->where('stats.quizzes_taken', 1)
                ->where('stats.average_score', 75)
                ->where('document_status.processed', 1)
                ->where('document_status.failed', 1)
                ->has('recent_users'));
    }

    public function test_index_memfilter_berdasarkan_cari_role_dan_status(): void
    {
        $admin = $this->admin();
        $this->student();
        $siti = $this->student();
        $siti->forceFill(['name' => 'Siti Rahma', 'email' => 'siti@kampus.ac.id'])->save();

        $this->actingAs($admin)
            ->get('/admin/users?q=Rahma')
            ->assertInertia(fn (Assert $page) => $page
                ->where('users.total', 1)
                ->where('users.data.0.email', 'siti@kampus.ac.id')
                ->where('filters.q', 'Rahma'));

        $this->actingAs($admin)
            ->get('/admin/users?status=active')
            ->assertInertia(fn (Assert $page) => $page->where('filters.status', 'active'));

        $this->actingAs($admin)
            ->get('/admin/users?role=admin')
            ->assertInertia(fn (Assert $page) => $page
                ->where('users.total', 1)
                ->where('counts.admins', 1));
    }

    public function test_index_menandai_user_yang_sedang_online(): void
    {
        $admin = $this->admin();
        $siti = $this->student();
        $siti->forceFill(['name' => 'Siti Rahma'])->save();
        $budi = $this->student();
        $budi->forceFill(['name' => 'Budi'])->save();

        $this->insertSession($siti->id);

        $this->actingAs($admin)
            ->get('/admin/users?q=Siti')
            ->assertInertia(fn (Assert $page) => $page->where('users.data.0.is_online', true));

        $this->actingAs($admin)
            ->get('/admin/users?q=Budi')
            ->assertInertia(fn (Assert $page) => $page->where('users.data.0.is_online', false));
    }

    public function test_show_menampilkan_course_dan_quiz_user(): void
    {
        $admin = $this->admin();
        $student = $this->student();
        $course = $this->course($student);
        $document = $this->document($course, 'a');
        $this->document($course, 'b', ['study_pack_status' => null]);

        QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $student->id,
            'total_questions' => 5,
            'correct_answers' => 4,
            'score' => 80,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get("/admin/users/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users/Show')
                ->where('stats.courses', 1)
                ->where('stats.documents', 2)
                ->where('stats.study_packs_ready', 1)
                ->where('stats.quizzes_taken', 1)
                ->where('stats.average_score', 80)
                ->where('courses.0.documents_count', 2)
                ->where('recent_attempts.0.score', 80)
                ->where('is_self', false));
    }

    public function test_update_mempromosikan_student_menjadi_admin(): void
    {
        $admin = $this->admin();
        $student = $this->student();

        $this->actingAs($admin)
            ->patch("/admin/users/{$student->id}", ['role' => User::ROLE_ADMIN, 'is_active' => true])
            ->assertRedirect();

        $this->assertTrue($student->fresh()->isAdmin());
    }

    public function test_update_tidak_bisa_menurunkan_atau_menonaktifkan_diri_sendiri(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->patch("/admin/users/{$admin->id}", ['role' => User::ROLE_STUDENT, 'is_active' => true])
            ->assertSessionHasErrors('role');

        $this->assertTrue($admin->fresh()->isAdmin());

        $this->actingAs($admin)
            ->patch("/admin/users/{$admin->id}", ['role' => User::ROLE_ADMIN, 'is_active' => false])
            ->assertSessionHasErrors('role');

        $this->assertTrue($admin->fresh()->is_active);
    }

    public function test_update_menonaktifkan_user_memutus_sesinya(): void
    {
        $admin = $this->admin();
        $student = $this->student();
        $this->insertSession($student->id);

        $this->assertDatabaseHas('sessions', ['user_id' => $student->id]);

        $this->actingAs($admin)
            ->patch("/admin/users/{$student->id}", ['role' => User::ROLE_STUDENT, 'is_active' => false])
            ->assertRedirect();

        $this->assertFalse($student->fresh()->is_active);
        $this->assertDatabaseMissing('sessions', ['user_id' => $student->id]);
    }

    public function test_destroy_tidak_bisa_menghapus_diri_sendiri(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->delete("/admin/users/{$admin->id}")
            ->assertSessionHasErrors('user');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_destroy_menghapus_user_dokumen_dan_file(): void
    {
        Storage::fake();
        $admin = $this->admin();
        $student = $this->student();
        $course = $this->course($student);
        $document = $this->document($course, 'a');
        Storage::put('documents/doc-a.pdf', 'isi');

        $this->actingAs($admin)
            ->delete("/admin/users/{$student->id}")
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseMissing('users', ['id' => $student->id]);
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Storage::assertMissing('documents/doc-a.pdf');
    }

    public function test_online_menampilkan_user_dan_bisa_memutus_sesi(): void
    {
        $admin = $this->admin();
        $student = $this->student();
        $this->insertSession($student->id);
        $this->insertSession($student->id);

        $this->actingAs($admin)
            ->get('/admin/online')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Online/Index')
                ->has('users', 1)
                ->where('users.0.id', $student->id)
                ->where('users.0.sessions', 2)
                ->where('window_minutes', 5));

        $this->actingAs($admin)
            ->delete("/admin/online/{$student->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('sessions', ['user_id' => $student->id]);
    }

    public function test_online_tidak_bisa_memutus_sesi_sendiri(): void
    {
        $admin = $this->admin();
        $this->insertSession($admin->id);

        $this->actingAs($admin)
            ->delete("/admin/online/{$admin->id}")
            ->assertSessionHasErrors('user');

        $this->assertDatabaseHas('sessions', ['user_id' => $admin->id]);
    }

    public function test_akun_nonaktif_tidak_bisa_login(): void
    {
        $student = $this->student(['is_active' => false]);

        $this->post('/login', [
            'email' => $student->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_admin_dialihkan_dari_halaman_student(): void
    {
        $admin = $this->admin();

        foreach (['/', '/materials', '/ask-panda', '/profile'] as $path) {
            $this->actingAs($admin)
                ->get($path)
                ->assertRedirect(route('admin.dashboard'));
        }
    }

    public function test_student_tetap_bisa_membuka_halaman_student(): void
    {
        $this->actingAs($this->student())->get('/materials')->assertOk();
    }

    public function test_login_admin_langsung_diarahkan_ke_dashboard_admin(): void
    {
        $admin = $this->admin();

        $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard'));
    }
}
