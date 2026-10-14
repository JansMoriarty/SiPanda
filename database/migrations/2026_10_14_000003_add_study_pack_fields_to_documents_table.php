<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Catatan: kolom `summary` sudah ada (longText nullable) dari migration
        // 2026_09_29_165106, jadi tidak ditambahkan lagi di sini. `error_message`
        // juga sudah ada dan dipakai ulang untuk menyimpan error study pack.
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedInteger('page_count')->nullable()->after('processed_at');
            $table->json('key_points')->nullable()->after('summary');
            $table->enum('study_pack_status', ['queued', 'generating', 'ready', 'failed'])
                ->nullable()->after('key_points');
            $table->timestamp('study_pack_generated_at')->nullable()->after('study_pack_status');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['page_count', 'key_points', 'study_pack_status', 'study_pack_generated_at']);
        });
    }
};
