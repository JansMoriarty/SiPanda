<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class AvatarStorage
{
    public function deletePrevious(User $user): void
    {
        $path = $user->getRawOriginal('avatar');

        if ($path && ! str_starts_with($path, 'http')) {
            Storage::disk('public')->delete($path);
        }
    }
}
