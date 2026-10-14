<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Halaman student dilindungi middleware auth, jadi tamu yang mencoba
     * membukanya dilempar ke halaman login (302), bukan 200.
     */
    public function test_tamu_diarahkan_ke_login_dari_halaman_student(): void
    {
        $this->get('/materials')->assertRedirect(route('login'));
    }
}
