<?php

namespace Tests\Feature;

use App\Jobs\GenerateStudyPackJob;
use App\Models\Chunk;
use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Question;
use App\Models\User;
use App\Services\StudyPack\StudyPackGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Generator Study Pack: mengisi summary, key_points, concepts, dan questions
 * dari materi dokumen lewat LlmClient. Yang dikunci: hasil tahapan lengkap,
 * idempoten saat di-dispatch ulang, bisa lanjut kalau data sudah ada sebagian,
 * dan menandai failed saat LLM gagal.
 */
class StudyPackGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private function document(): Document
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#0c9c8f',
        ]);

        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_test.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ]);

        Chunk::create([
            'document_id' => $document->id,
            'content' => 'Materi tentang limit dan turunan.',
            'source_location' => 'Slide 1',
            'chunk_index' => 0,
            'embedding' => [0.1, 0.2],
        ]);

        return $document;
    }

    private function gemini(array $payload): array
    {
        return ['candidates' => [[
            'content' => ['parts' => [['text' => json_encode($payload)]]],
        ]]];
    }

    private function fakeLlm(): void
    {
        Http::fake(function ($request) {
            $body = $request->body();

            if (str_contains($body, 'TUGAS_RINGKASAN')) {
                return Http::response($this->gemini([
                    'summary' => 'Ringkasan materi.',
                    'key_points' => ['Limit', 'Turunan'],
                ]));
            }

            if (str_contains($body, 'TUGAS_KONSEP')) {
                return Http::response($this->gemini([
                    'concepts' => [
                        ['name' => 'Limit', 'description' => 'Dasar limit', 'importance' => 'high'],
                        ['name' => 'Turunan', 'description' => 'Dasar turunan', 'importance' => 'medium'],
                    ],
                ]));
            }

            if (str_contains($body, 'TUGAS_SOAL')) {
                return Http::response($this->gemini([
                    'questions' => [
                        ['question' => 'q1', 'options' => ['a', 'b', 'c', 'd'], 'correct_index' => 1, 'explanation' => 'e', 'source_label' => 'Slide 1'],
                        ['question' => 'q2', 'options' => ['a', 'b', 'c', 'd'], 'correct_index' => 0, 'explanation' => 'e2'],
                    ],
                ]));
            }

            return Http::response('unexpected', 500);
        });
    }

    public function test_generate_mengisi_seluruh_tahapan(): void
    {
        $this->fakeLlm();
        $document = $this->document();

        app(StudyPackGenerator::class)->generate($document);

        $document->refresh();
        $this->assertSame('ready', $document->study_pack_status);
        $this->assertNotNull($document->study_pack_generated_at);
        $this->assertSame('Ringkasan materi.', $document->summary);
        $this->assertSame(['Limit', 'Turunan'], $document->key_points);
        $this->assertSame(['Limit', 'Turunan'], $document->concepts()->orderBy('sort_order')->pluck('name')->all());
        $this->assertSame(4, $document->questions()->count());
        $this->assertTrue($document->concepts->every(fn ($concept) => $concept->questions()->count() === 2));
        $this->assertSame(['a', 'b', 'c', 'd'], $document->questions()->first()->options);
    }

    public function test_dispatch_ulang_tidak_memanggil_llm_lagi(): void
    {
        $this->fakeLlm();
        $document = $this->document();

        GenerateStudyPackJob::dispatchSync($document);

        Http::fake();

        GenerateStudyPackJob::dispatchSync($document->fresh());

        Http::assertNothingSent();
        $this->assertSame(4, $document->questions()->count());
    }

    public function test_data_yang_sudah_ada_dilewati(): void
    {
        $document = $this->document();
        $document->update(['summary' => 'Sudah ada', 'key_points' => ['K1']]);

        $concept = Concept::create(['document_id' => $document->id, 'name' => 'Limit', 'sort_order' => 0]);
        Question::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'question' => 'q',
            'options' => ['a', 'b'],
            'correct_index' => 0,
        ]);

        Http::fake();

        app(StudyPackGenerator::class)->generate($document);

        $document->refresh();
        $this->assertSame('ready', $document->study_pack_status);
        $this->assertSame(1, $document->concepts()->count());
        $this->assertSame(1, $document->questions()->count());
        Http::assertNothingSent();
    }

    public function test_kegagalan_llm_menandai_failed(): void
    {
        Http::fake([
            '*' => Http::response('boom', 500),
        ]);
        $document = $this->document();

        $threw = false;

        try {
            app(StudyPackGenerator::class)->generate($document);
        } catch (\Throwable $e) {
            $threw = true;
        }

        $this->assertTrue($threw);
        $document->refresh();
        $this->assertSame('failed', $document->study_pack_status);
        $this->assertNotNull($document->error_message);
    }
}
