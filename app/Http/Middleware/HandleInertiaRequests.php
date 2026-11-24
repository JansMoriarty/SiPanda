<?php

namespace App\Http\Middleware;

use App\Services\XpService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    // Sudah lewat accessor User::avatar(), jadi frontend
                    // menerima URL siap pakai (atau null). ShellSidebar
                    // memakainya supaya foto ikut berubah begitu di-upload.
                    'avatar' => $user->avatar,
                    'created_at' => $user->created_at?->toDateTimeString(),
                    // Dipakai ShellSidebar untuk menampilkan menu ADMIN hanya
                    // bagi admin. Ini hanya untuk UI; otorisasi tetap di
                    // middleware `admin`.
                    'role' => $user->role,
                    'is_admin' => $user->isAdmin(),
                    'xp' => app(XpService::class)->snapshot($user),
                ] : null,
            ],
        ];
    }
}
