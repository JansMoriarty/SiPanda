<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Progres nyata dari dua pipeline yang berjalan di queue. Sebelumnya
        // UI hanya tahu status kasar ('processing'/'generating'), sehingga
        // persen tidak pernah bergerak. Kolom ini diisi bertahap oleh
        // ProcessDocumentJob dan StudyPackGenerator.
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedTinyInteger('process_progress')->nullable()->default(0)->after('processed_at');
            $table->string('process_step', 24)->nullable()->after('process_progress');
            $table->unsignedTinyInteger('study_pack_progress')->nullable()->default(0)->after('study_pack_status');
            $table->string('study_pack_step', 24)->nullable()->after('study_pack_progress');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['process_progress', 'process_step', 'study_pack_progress', 'study_pack_step']);
        });
    }
};
