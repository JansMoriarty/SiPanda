<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('total_questions')->default(0);
            $table->unsignedSmallInteger('correct_answers')->default(0);
            // 0-100; null selama attempt belum disubmit.
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};
