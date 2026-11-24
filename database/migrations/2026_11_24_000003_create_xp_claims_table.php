<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('xp')->default(0)->after('role');
        });

        Schema::create('xp_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained('study_levels')->cascadeOnDelete();
            $table->unsignedInteger('points');
            $table->timestamp('claimed_at');
            $table->timestamps();

            $table->unique(['user_id', 'level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('xp_claims');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('xp');
        });
    }
};
