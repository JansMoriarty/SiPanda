<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\OnlineUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * User online dari tabel sessions (bukan kolom users).
 */
class OnlineController extends Controller
{
    public function index(OnlineUsers $online)
    {
        return Inertia::render('Admin/Online/Index', [
            'users' => $online->list(),
            'window_minutes' => OnlineUsers::WINDOW_MINUTES,
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['user' => 'Kamu tidak bisa memutus sesimu sendiri dari sini.']);
        }

        DB::table('sessions')->where('user_id', $user->id)->delete();

        return back()->with('success', "Semua sesi {$user->name} diputus.");
    }
}
