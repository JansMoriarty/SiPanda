<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * '/' merender Materials/Index dan dilindungi middleware auth, jadi
     * tamu memang harus dilempar ke halaman login (302), bukan 200.
     */
    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/')->assertRedirect(route('login'));
    }
}
