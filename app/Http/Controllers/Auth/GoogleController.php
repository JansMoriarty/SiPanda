<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $google = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Gagal masuk dengan Google. Coba lagi.']);
        }

        // 1) Sudah pernah login pakai Google
        $user = User::where('google_id', $google->getId())->first();

        if (! $user) {
            // 2) Email sudah terdaftar manual -> sambungkan ke akun itu
            $user = User::where('email', $google->getEmail())->first();

            if ($user) {
                $user->update(['google_id' => $google->getId()]);
            } else {
                // 3) User baru -> register otomatis
                $user = User::create([
                    'name' => $google->getName(),
                    'email' => $google->getEmail(),
                    'google_id' => $google->getId(),
                    'password' => null,
                    'email_verified_at' => now(), // email sudah diverifikasi Google
                ]);
            }
        }

        Auth::login($user, remember: true);

        return redirect()->intended('/'); // sesuaikan nama route-mu
    }
}