<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Kolom ini sudah dibutuhkan ProfileAvatarController (POST/DELETE
     * /profile/avatar) sejak controller itu ditulis, tapi kolomnya belum
     * pernah dibuat. Akibatnya $user->update(['avatar' => ...]) tidak
     * terlihat error apa pun, hanya tidak menyimpan apa-apa.
     *
     * Disimpan sebagai path relatif (mis. avatars/abc123.jpg), bukan URL.
     * User::avatar() yang mengubahnya jadi URL, sehingga file dari Google
     * (yang berupa URL) dan file hasil upload bisa berbagi satu kolom.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });
    }
};
