<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Penjaga batas data halaman /profile.
 *
 * Halaman ini sengaja campur dua sumber data: identitas yang nyata dan
 * statistik yang masih mock. Yang berbahaya bukan mock-nya, tapi kalau
 * elemen mock suatu saat diam-diam disambungkan ke route sungguhan.
 *
 * Contoh bahayanya: /quiz/{attempt}/results dan /practice/{course} sudah
 * ada sebagai closure yang mengabaikan parameternya, dan /documents/{id}
 * milik user lain hanya menolak di level controller. Menaruh <Link> ke sana
 * dari halaman yang datanya mock akan terlihat "jalan" padahal membuka
 * halaman yang salah.
 *
 * Tes ini membaca berkas sumber, jadi tidak butuh browser. Yang diperiksa
 * adalah kawat statis: seluruh panggilan route() di halaman Profile hanya
 * boleh menunjuk dua route avatar, dan tidak boleh ada tautan sama sekali
 * karena halaman ini tidak berpindah halaman.
 */
class ProfilePageBoundariesTest extends TestCase
{
    private function source(): string
    {
        $path = resource_path('js/Pages/Profile/Index.jsx');
        $this->assertFileExists($path);

        return $this->withoutComments(file_get_contents($path));
    }

    /**
     * Buang komentar blok sebelum diperiksa.
     *
     * Tanpa ini pemeriksaannya salah: berkas ini sendiri menyebut `<Link>`
     * di dalam docblock untuk menjelaskan kenapa baris mock sengaja bukan
     * tautan, sehingga kemunculan pertama `<Link` yang ditemukan berasal
     * dari kalimat penjelasan itu, bukan dari markup.
     */
    private function withoutComments(string $source): string
    {
        return (string) preg_replace('#/\*.*?\*/#s', '', $source);
    }

    /**
     * Ambil isi satu komponen: dari `function Name(` sampai fungsi
     * top-level berikutnya (atau `export default`). Tanpa batas bawah ini,
     * jendela pemeriksaan satu komponen ikut menelan docblock komponen
     * berikutnya.
     */
    private function componentBody(string $source, string $name): string
    {
        $start = strpos($source, "function {$name}(");
        $this->assertNotFalse($start, "komponen {$name} tidak ditemukan");

        $tail = substr($source, $start + 1);
        $next = null;
        if (preg_match('/^\n(function |export default )/m', $tail, $m, PREG_OFFSET_CAPTURE)) {
            $next = $m[0][1];
        }

        return $next === null ? $tail : substr($tail, 0, $next);
    }

    public function test_seluruh_panggilan_route_hanya_ke_avatar(): void
    {
        preg_match_all('/route\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $this->source(), $m);

        $this->assertNotEmpty($m[1], 'halaman Profile seharusnya memanggil route avatar');

        $allowed = ['profile.avatar.store', 'profile.avatar.destroy'];
        $this->assertSame(
            $allowed,
            array_values(array_unique($m[1])),
            'ada route selain avatar yang dipanggil dari halaman Profile; bagian mock jangan disambungkan ke route nyata'
        );
    }

    public function test_tidak_ada_navigasi_di_halaman_profile(): void
    {
        $source = $this->source();

        // Halaman Profile tidak berpindah ke halaman lain, jadi tidak
        // boleh ada tautan, dan POST/DELETE hanya boleh untuk avatar.
        $this->assertDoesNotMatchRegularExpression('/<Link\b/', $source, 'halaman Profile tidak boleh punya <Link>');
        $this->assertDoesNotMatchRegularExpression('/<a\s+href=/', $source, 'halaman Profile tidak boleh punya <a href>');
        $this->assertDoesNotMatchRegularExpression('/router\.(get|put|patch)\b/', $source);
        $this->assertSame(
            2,
            preg_match_all('/router\.(post|delete)\b/', $source),
            'hanya dua aksi yang boleh terhubung ke server: unggah dan hapus avatar'
        );
    }

    public function test_komponen_mock_tidak_punya_aksi(): void
    {
        $source = $this->source();

        foreach (['StudyStats', 'CourseMastery', 'QuizHistory'] as $component) {
            $body = $this->componentBody($source, $component);

            foreach (['onClick', 'onChange', 'href', 'router.', '<Link', '<button', 'role="button"'] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $body,
                    "komponen mock {$component} memuat \"{$forbidden}\"; bagian mock harus non-interaktif"
                );
            }
        }
    }

    public function test_bagian_mock_ditandai_terlihat(): void
    {
        $source = $this->source();

        // Penanda amber harus ada, dan teksnya harus menyebut MOCK supaya
        // tidak disalahartikan sebagai angka sungguhan.
        $this->assertStringContainsString('MockBadge', $source);
        $this->assertMatchesRegularExpression('/MOCK/', $source);
        $this->assertStringContainsString('border-amber-200/80', $source);

        // Penjelasan batas data harus menyebut dua sumber secara eksplisit.
        $this->assertStringContainsString('masih data contoh', $source);
    }

    public function test_angka_statistik_dihitung_bukan_ditulis_tangan(): void
    {
        $source = $this->source();

        // Rata-rata skor dan jumlah quiz harus berasal dari agregasi
        // mockQuizAttempts, bukan angka hardcode, supaya tidak bisa berbeda
        // dari halaman Progress.
        $this->assertStringContainsString('buildProfileStats', $source);
        $this->assertStringContainsString('masteryOf', $source);
        $this->assertStringContainsString('buildCourseGapSummaries', $source);
    }
}
