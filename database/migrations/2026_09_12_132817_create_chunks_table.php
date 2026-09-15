<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->string('source_location')->nullable(); // misal "Slide 4" atau "Halaman 3"
            $table->unsignedInteger('chunk_index');
            $table->timestamps();

            $table->fullText('content'); // buat retrieval nanti (Step 3)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chunks');
    }
};