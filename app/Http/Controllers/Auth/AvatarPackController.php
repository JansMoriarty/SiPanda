<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AvatarPackClaim;
use App\Services\AvatarPackService;
use App\Services\AvatarStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AvatarPackController extends Controller
{
    public function store(Request $request, AvatarPackService $packs, AvatarStorage $avatars)
    {
        $data = $request->validate([
            'pack' => ['required', 'string', 'max:64'],
            'index' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();
        $url = $packs->urlFor($user, $data['pack'], (int) $data['index']);

        abort_unless($url, 403, 'Avatar pack ini belum terbuka atau tidak valid.');

        DB::transaction(function () use ($user, $data, $url, $avatars) {
            AvatarPackClaim::firstOrCreate(
                ['user_id' => $user->id, 'pack_id' => $data['pack']],
                ['claimed_at' => now()]
            );

            $avatars->deletePrevious($user);
            $user->update(['avatar' => $url]);
        });

        return back();
    }
}
