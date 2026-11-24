<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AvatarPackTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_tidak_bisa_memilih_avatar_pack(): void
    {
        $this->post(route('profile.avatar.pack'), [
            'pack' => 'pemula',
            'index' => 1,
        ])->assertRedirect(route('login'));
    }

    public function test_pack_yang_sudah_terbuka_bisa_dipakai(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 100])->save();

        $this->actingAs($user)
            ->post(route('profile.avatar.pack'), [
                'pack' => 'ambisius',
                'index' => 2,
            ])
            ->assertRedirect();

        $raw = $user->refresh()->getRawOriginal('avatar');

        $this->assertSame(
            "https://api.dicebear.com/10.x/critters/svg?seed=sipanda-{$user->id}-ambisius-02&backgroundColor=fcd0a1",
            $raw
        );
        $this->assertSame($raw, $user->avatar);
        $this->assertDatabaseHas('avatar_pack_claims', [
            'user_id' => $user->id,
            'pack_id' => 'ambisius',
        ]);

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->where('avatarPacks.1.claimed', true));
    }

    public function test_pack_terkunci_tidak_bisa_dipakai(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 120])->save();

        $this->actingAs($user)
            ->post(route('profile.avatar.pack'), [
                'pack' => 'pakar',
                'index' => 1,
            ])
            ->assertForbidden();

        $this->assertNull($user->refresh()->getRawOriginal('avatar'));
    }

    public function test_pack_dan_index_tidak_valid_ditolak(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['xp' => 1000])->save();

        $this->actingAs($user)
            ->post(route('profile.avatar.pack'), [
                'pack' => 'tidak-ada',
                'index' => 1,
            ])
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('profile.avatar.pack'), [
                'pack' => 'ambisius',
                'index' => 7,
            ])
            ->assertForbidden();

        $this->assertNull($user->refresh()->getRawOriginal('avatar'));
    }

    public function test_klaim_pack_tetap_tercatat_saat_ganti_ke_foto_upload(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $user->forceFill(['xp' => 100])->save();

        $this->actingAs($user)
            ->post(route('profile.avatar.pack'), [
                'pack' => 'ambisius',
                'index' => 1,
            ])
            ->assertRedirect();

        $this->actingAs($user)
            ->post(route('profile.avatar.store'), [
                'avatar' => UploadedFile::fake()->image('foto.png', 200, 200),
            ])
            ->assertRedirect();

        $this->assertStringContainsString(
            '/storage/avatars/',
            $user->refresh()->avatar
        );

        $this->actingAs($user)
            ->get('/profile')
            ->assertInertia(fn (Assert $page) => $page
                ->where('avatarPacks.1.claimed', true));
    }

    public function test_memilih_pack_menghapus_foto_yang_diunggah(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $user->forceFill(['xp' => 100])->save();

        $this->actingAs($user)
            ->post(route('profile.avatar.store'), [
                'avatar' => UploadedFile::fake()->image('foto.png', 200, 200),
            ])
            ->assertRedirect();

        $path = $user->refresh()->getRawOriginal('avatar');
        Storage::disk('public')->assertExists($path);

        $this->actingAs($user)
            ->post(route('profile.avatar.pack'), [
                'pack' => 'ambisius',
                'index' => 1,
            ])
            ->assertRedirect();

        Storage::disk('public')->assertMissing($path);
        $this->assertStringStartsWith('https://api.dicebear.com/', $user->refresh()->getRawOriginal('avatar'));
    }
}
