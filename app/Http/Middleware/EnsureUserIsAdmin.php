<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gerbang area admin.
 *
 * Halaman/route di bawah middleware ini sengaja membaca data lintas user
 * (semua course/dokumen, bukan hanya milik user login). Karena itu, JANGAN
 * pernah memasang middleware ini pada route student biasa, dan JANGAN
 * melonggarkan scoping `course.user_id` di controller student.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isAdmin(), 403);

        return $next($request);
    }
}
