<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Fondasi admin: otorisasi role, command promote, dan pencatatan last_login_at.
 *
 * Yang dijaga: area /admin HANYA untuk role admin (guest -> login, student ->
 * 403), role tidak bisa di-mass-assign, dan last_login_at terisi saat login.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        // 'role' tidak fillable, jadi di-set lewat forceFill seperti command.
        $user = User::factory()->create();
        $user->forceFill(['role' => User::ROLE_ADMIN])->save();

        return $user;
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/admin')->assertRedirect(route('login'));
    }

    public function test_user_biasa_mendapat_403(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_admin_bisa_membuka_dashboard(): void
    {
        $this->actingAs($this->admin())
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));
    }

    public function test_share_inertia_menandai_admin(): void
    {
        $this->actingAs($this->admin())
            ->get('/admin')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.role', 'admin')
                ->where('auth.user.is_admin', true));
    }

    public function test_command_promote_mengubah_role(): void
    {
        $user = User::factory()->create(['email' => 'dosen@kampus.ac.id']);

        $this->artisan('user:promote', ['email' => 'dosen@kampus.ac.id'])->assertSuccessful();

        $this->assertTrue($user->fresh()->isAdmin());
    }

    public function test_command_promote_gagal_kalau_email_tidak_ada(): void
    {
        $this->artisan('user:promote', ['email' => 'tidak-ada@kampus.ac.id'])->assertFailed();
    }

    public function test_role_tidak_bisa_di_mass_assign(): void
    {
        $user = User::create([
            'name' => 'Nakal',
            'email' => 'nakal@kampus.ac.id',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $this->assertSame(User::ROLE_STUDENT, $user->fresh()->role);
        $this->assertFalse($user->fresh()->isAdmin());
    }

    public function test_login_mencatat_last_login_at(): void
    {
        $user = User::factory()->create(['password' => 'secret123']);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }
}
