<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kartu belajar (flashcard) per dokumen.
 *
 * Satu konsep bisa punya beberapa kartu, jadi concept_id dipertahankan supaya
 * kartu bisa dihubungkan kembali ke Knowledge Gap tanpa tabel penghubung baru.
 * document_id juga disimpan agar kartu bisa diambil tanpa join ke concepts.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flashcards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('concept_id')->constrained()->cascadeOnDelete();
            $table->text('front');
            $table->text('back');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['document_id', 'concept_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flashcards');
    }
};
