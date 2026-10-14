<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kolom fondasi untuk peran admin SiPanda.
     *
     * - role: pembeda hak akses. Default 'student' supaya semua user lama tetap
     *   user biasa; admin diangkat lewat command `user:promote` atau UI admin.
     * - is_active: untuk menonaktifkan akun (mis. penyalahgunaan) tanpa hapus data.
     * - last_login_at: info "terakhir masuk" di manajemen user. Status online
     *   yang sebenarnya tetap dihitung dari tabel sessions (last_activity),
     *   bukan dari kolom ini.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('student');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active', 'last_login_at']);
        });
    }
};
