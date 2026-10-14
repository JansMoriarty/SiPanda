<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
        });

        // FULLTEXT cuma ada di MySQL/MariaDB asli, bukan sqlite maupun TiDB
        if ($this->supportsFullText()) {
            Schema::table('chunks', function (Blueprint $table) {
                $table->fullText('content');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chunks');
    }

    private function supportsFullText(): bool
    {
        $conn = Schema::getConnection();

        if (! in_array($conn->getDriverName(), ['mysql', 'mariadb'], true)) {
            return false;
        }

        $version = (string) ($conn->selectOne('select version() as v')->v ?? '');

        return ! str_contains(strtolower($version), 'tidb');
    }
};