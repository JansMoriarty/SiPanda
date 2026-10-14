<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Bootstrap admin pertama (dan seterusnya) tanpa edit DB manual.
 *
 * Contoh: php artisan user:promote dosen@kampus.ac.id
 */
class PromoteUser extends Command
{
    protected $signature = 'user:promote {email : Email user yang akan dijadikan admin}';

    protected $description = 'Jadikan user sebagai admin (role=admin)';

    public function handle(): int
    {
        $email = (string) $this->argument('email');

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("User dengan email {$email} tidak ditemukan.");

            return self::FAILURE;
        }

        if ($user->isAdmin()) {
            $this->info("{$user->email} sudah admin.");

            return self::SUCCESS;
        }

        // forceFill: 'role' tidak fillable (lihat User) agar tidak bisa
        // di-mass-assign lewat input user biasa.
        $user->forceFill(['role' => User::ROLE_ADMIN])->save();

        $this->info("{$user->email} sekarang admin.");

        return self::SUCCESS;
    }
}
