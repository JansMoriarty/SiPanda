<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('level_number');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->json('key_points')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['document_id', 'level_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_levels');
    }
};
