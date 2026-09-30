<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Membuktikan bagian REAL dari halaman /profile benar-benar nyambung ke
 * backend, bukan cuma kelihatanNyambung.
 *
 * Latar: ProfileAvatarController sudah ada sejak lama, tapi kolom `avatar`
 * tidak pernah dibuat dan `avatar` tidak ada di #[Fillable], sehingga
 * $user->update(['avatar' => ...]) dibuang fill() tanpa error. Tes ini
 * mengunci perilakunya supaya tidak kembali diam-diam tidak bisa dipakai.
 */
class ProfileAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_tidak_bisa_menyentuh_avatar(): void
    {
        $this->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->image('a.png'),
        ])->assertRedirect(route('login'));

        $this->delete(route('profile.avatar.destroy'))->assertRedirect(route('login'));
    }

    public function test_upload_disimpan_di_disk_public_dan_tidak_tertimpa_file_lama(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('profile.avatar.store'), [
                'avatar' => UploadedFile::fake()->image('foto.png', 200, 200),
            ])
            ->assertRedirect();

        $user->refresh();
        $path = $user->getRawOriginal('avatar');

        $this->assertNotNull($path, 'avatar tidak tersimpan: atribut dibuang fill()');
        Storage::disk('public')->assertExists($path);

        // Unggah kedua: file lama harus dihapus, bukan menumpuk.
        $this->actingAs($user)
            ->post(route('profile.avatar.store'), [
                'avatar' => UploadedFile::fake()->image('foto2.png', 200, 200),
            ])
            ->assertRedirect();

        $newPath = $user->refresh()->getRawOriginal('avatar');
        $this->assertNotSame($path, $newPath);
        Storage::disk('public')->assertMissing($path);
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_hapus_mengosongkan_kolom_dan_menghapus_file(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $this->actingAs($user)->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->image('foto.png'),
        ]);
        $path = $user->refresh()->getRawOriginal('avatar');
        $this->assertNotNull($path);

        $this->actingAs($user)->delete(route('profile.avatar.destroy'))->assertRedirect();

        $this->assertNull($user->refresh()->getRawOriginal('avatar'));
        Storage::disk('public')->assertMissing($path);
        $this->assertNull($user->avatar, 'accessor harus mengembalikan null setelah dihapus');
    }

    public function test_berkas_tidak_gambar_ditolak(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('profile.avatar.store'), [
                'avatar' => UploadedFile::fake()->create('virus.php', 10, 'application/x-php'),
            ])
            ->assertSessionHasErrors('avatar');

        $this->assertNull($user->refresh()->getRawOriginal('avatar'));
    }

    public function test_avatar_bukan_fillable_lagi(): void
    {
        // Regresi: kalau 'avatar' dibuang dari #[Fillable] lagi, upload
        // akan kembali "sukses" tanpa menyimpan apa pun.
        $this->assertContains('avatar', (new User)->getFillable());
    }

    public function test_avatar_dibagikan_lewat_shared_props(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['name' => 'Dimas', 'email' => 'dimas@example.com']);

        $response = $this->actingAs($user)->get(route('profile.index'));
        $response->assertOk();

        $shared = \Inertia\Inertia::getShared('auth.user');
        $this->assertSame('Dimas', $shared['name']);
        $this->assertSame('dimas@example.com', $shared['email']);
        $this->assertArrayHasKey('avatar', $shared, 'frontend butuh key avatar supaya sidebar & Profile bisa menampilkan foto');
        $this->assertNull($shared['avatar']);

        // Kalau key avatar tidak ada di respons, frontend akan selalu
        // jatuh ke inisial dan uploads terasa sia-sia.
        $this->assertStringContainsString('"avatar"', $response->getContent());

        $this->actingAs($user)->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->image('foto.png'),
        ]);

        $response = $this->actingAs($user)->get(route('profile.index'));
        $response->assertOk();

        // Accessor harus mengembalikan URL disk public, bukan path mentah.
        // Storage::fake() membuat URL relatif, jadi yang diuji kontraknya
        // accessor -> disk, bukan hostnya.
        $raw = $user->refresh()->getRawOriginal('avatar');
        $this->assertNotNull($raw);
        $this->assertSame(Storage::disk('public')->url($raw), \Inertia\Inertia::getShared('auth.user.avatar'));

        // Terakhir: prop-nya harus benar-benar sampai ke browser, bukan
        // cuma ada di shared prop sisi server.
        $this->assertStringContainsString('/storage/avatars/', $this->pageAvatar($response));
    }

    public function test_halaman_profile_butuh_auth(): void
    {
        $this->get(route('profile.index'))->assertRedirect(route('login'));
    }

    /**
     * Ambil auth.user.avatar dari payload `data-page` milik Inertia.
     * JSON di dalam HTML meng-escape garis miring (a\/b), jadi nilainya
     * harus di-decode dulu; mencari string mentah tidak akan cocok.
     */
    private function pageAvatar($response): ?string
    {
        preg_match('/<script data-page="app" type="application\/json">(.*?)<\/script>/s', $response->getContent(), $m);
        $this->assertNotEmpty($m, 'payload data-page Inertia tidak ditemukan');

        $page = json_decode(html_entity_decode($m[1], ENT_QUOTES), true);
        $this->assertIsArray($page, 'payload data-page bukan JSON yang valid');
        $this->assertArrayHasKey('avatar', $page['props']['auth']['user'], 'frontend butuh key avatar');

        return $page['props']['auth']['user']['avatar'];
    }
}
