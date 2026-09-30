<?php

namespace App\Http\Middleware;

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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    // Sudah lewat accessor User::avatar(), jadi frontend
                    // menerima URL siap pakai (atau null). ShellSidebar
                    // memakainya supaya foto ikut berubah begitu di-upload.
                    'avatar' => $request->user()->avatar,
                    'created_at' => $request->user()->created_at?->toDateTimeString(),
                ] : null,
            ],
        ];
    }
}