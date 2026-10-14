<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Kebalikan dari EnsureUserIsAdmin: memastikan akun admin TIDAK memakai
 * fitur student.
 *
 * Admin adalah peran penuh-waktu di area /admin, jadi route student
 * (materials, ask-panda, quiz, profile, dst.) dialihkan ke dashboard admin
 * alih-alih dibiarkan mengakses halaman yang di-scope ke course miliknya
 * sendiri (admin tidak punya course).
 */
class RedirectIfAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return $next($request);
    }
}
