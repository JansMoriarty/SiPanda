<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->after('id')
                ->constrained()->nullOnDelete();
            $table->longText('summary')->nullable()->after('status');
            $table->text('error_message')->nullable()->after('summary');
            $table->timestamp('processed_at')->nullable()->after('error_message');
        });

        // Backfill: dokumen lama dikelompokkan dari `subject`,
        // dimiliki user pertama yang terdaftar (prototype lama single-user).
        $user = DB::table('users')->orderBy('id')->first();
        if (! $user) {
            return;
        }

        $courseIds = [];
        foreach (DB::table('documents')->whereNull('course_id')->get() as $doc) {
            $name = trim($doc->subject ?? '') ?: 'Umum';

            if (! isset($courseIds[$name])) {
                $courseIds[$name] = DB::table('courses')
                    ->where('user_id', $user->id)->where('name', $name)->value('id')
                    ?? DB::table('courses')->insertGetId([
                        'user_id' => $user->id,
                        'name' => $name,
                        'color' => '#0c9c8f',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
            }

            DB::table('documents')->where('id', $doc->id)
                ->update(['course_id' => $courseIds[$name]]);
        }
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('course_id');
            $table->dropColumn(['summary', 'error_message', 'processed_at']);
        });
    }
};