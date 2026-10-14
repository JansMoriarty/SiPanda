<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catatan pemakaian token LLM (dari usageMetadata Gemini).
 *
 * Terpisah dari domain belajar: hanya untuk observability admin. user_id dan
 * document_id nullable karena panggilan bisa datang dari queue (study pack)
 * atau tanpa dokumen (Ask PANDA). Keduanya nullOnDelete supaya riwayat
 * pemakaian tetap ada walau user/dokumen dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('llm_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('document_id')->nullable()->constrained()->nullOnDelete();
            $table->string('feature', 50)->default('unknown');
            $table->string('provider', 30);
            $table->string('model', 80);
            $table->unsignedInteger('prompt_tokens')->default(0);
            $table->unsignedInteger('completion_tokens')->default(0);
            $table->unsignedInteger('total_tokens')->default(0);
            $table->boolean('successful')->default(true);
            $table->string('error')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index(['feature', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('llm_usages');
    }
};
