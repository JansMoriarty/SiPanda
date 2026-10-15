<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Status "sudah dikuasai / perlu diulang" per kartu per user.
 *
 * Ini state per-user (bukan bagian dari Study Pack dokumen), jadi terpisah dari
 * tabel flashcards. Satu baris unik per (user, kartu): menandai ulang cukup
 * meng-update baris yang sama. onDelete cascade agar riwayat bersih saat user
 * atau kartu dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flashcard_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('flashcard_id')->constrained()->cascadeOnDelete();
            $table->boolean('known')->default(false);
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'flashcard_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flashcard_reviews');
    }
};
