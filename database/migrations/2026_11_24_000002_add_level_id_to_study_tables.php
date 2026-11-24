<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['concepts', 'questions', 'flashcards', 'quiz_attempts'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('level_id')
                    ->nullable()
                    ->after('document_id')
                    ->constrained('study_levels')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['quiz_attempts', 'flashcards', 'questions', 'concepts'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('level_id');
            });
        }
    }
};
