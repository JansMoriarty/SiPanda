<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Halaman publik sebelum login.
     *
     * Tamu melihat landing page. Pengguna yang sudah login tidak perlu
     * melihatnya lagi, jadi langsung diarahkan ke "rumah" sesuai perannya:
     * student -> /student (home), admin -> /admin.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if ($user = $request->user()) {
            return redirect()->route($user->isAdmin() ? 'admin.dashboard' : 'home');
        }

        return Inertia::render('Landing/Index');
    }
}
