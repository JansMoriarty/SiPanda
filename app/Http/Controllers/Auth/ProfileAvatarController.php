<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileAvatarController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $this->deleteOld($user->getRawOriginal('avatar'));

        $user->update([
            'avatar' => $request->file('avatar')->store('avatars', 'public'),
        ]);

        return back();
    }

    public function destroy(Request $request)
    {
        $user = $request->user();
        $this->deleteOld($user->getRawOriginal('avatar'));
        $user->update(['avatar' => null]);

        return back();
    }

    private function deleteOld(?string $path): void
    {
        // hanya hapus file lokal, bukan URL Google
        if ($path && ! str_starts_with($path, 'http')) {
            Storage::disk('public')->delete($path);
        }
    }
}