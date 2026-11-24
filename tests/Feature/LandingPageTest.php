<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Landing page publik dan pemisahan rute rumah per peran.
 *
 * Aturannya: tamu melihat landing di '/', student yang sudah login diarahkan
 * ke dashboard, dan admin diarahkan ke '/admin'. '/student' hanya alias lama
 * yang ikut mengarah ke dashboard. Halaman student tetap dilindungi middleware auth.
 */
class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    private function student(): User
    {
        return User::factory()->create();
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => User::ROLE_ADMIN])->save();

        return $user;
    }

    public function test_tamu_melihat_landing_page(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Landing/Index'));
    }

    public function test_route_home_masih_menjadi_alias_student(): void
    {
        $this->assertSame(url('/student'), route('home'));
    }

    public function test_student_yang_login_dialihkan_dari_landing_ke_dashboard(): void
    {
        $this->actingAs($this->student())
            ->get('/')
            ->assertRedirect(route('dashboard'));
    }

    public function test_admin_yang_login_dialihkan_dari_landing_ke_admin(): void
    {
        $this->actingAs($this->admin())
            ->get('/')
            ->assertRedirect(route('admin.dashboard'));
    }

    public function test_tamu_tidak_bisa_membuka_halaman_student(): void
    {
        $this->get('/student')->assertRedirect(route('login'));
    }

    public function test_alias_student_mengarah_ke_dashboard(): void
    {
        $this->actingAs($this->student())
            ->get('/student')
            ->assertRedirect(route('dashboard'));
    }
}
