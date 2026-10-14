<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

// 'avatar' wajib fillable: ProfileAvatarController memakai $user->update(),
// dan fill() membuang atribut yang tidak fillable tanpa melempar error.
// 'google_id' & 'email_verified_at' juga fillable karena GoogleController
// memakai User::create([...]) saat signup OAuth.
//
// 'role' SENGAJA tidak fillable: mencegah privilege escalation lewat mass
// assignment. Ubah role hanya lewat forceFill (command user:promote / UI admin).
#[Fillable(['name', 'email', 'password', 'avatar', 'google_id', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_STUDENT = 'student';

    public const ROLE_ADMIN = 'admin';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function courses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function quizAttempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    protected function avatar(): Attribute
    {
        return Attribute::get(function (?string $value) {
            if (! $value) return null;
            if (str_starts_with($value, 'http')) return $value;   // dari Google
            return Storage::disk('public')->url($value);           // hasil upload
        });
    }
}
