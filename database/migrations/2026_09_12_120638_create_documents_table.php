<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('original_filename');
            $table->string('stored_filename');
            $table->enum('file_type', ['pdf', 'pptx']);
            $table->unsignedBigInteger('file_size');
            $table->string('subject')->nullable();
            $table->enum('status', ['uploaded', 'processing', 'processed', 'failed'])->default('uploaded');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};