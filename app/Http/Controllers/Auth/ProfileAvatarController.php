<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AvatarStorage;
use Illuminate\Http\Request;

class ProfileAvatarController extends Controller
{
    public function store(Request $request, AvatarStorage $avatars)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $avatars->deletePrevious($user);

        $user->update([
            'avatar' => $request->file('avatar')->store('avatars', 'public'),
        ]);

        return back();
    }

    public function destroy(Request $request, AvatarStorage $avatars)
    {
        $user = $request->user();
        $avatars->deletePrevious($user);
        $user->update(['avatar' => null]);

        return back();
    }
}
