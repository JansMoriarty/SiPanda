<?php

namespace Tests\Feature;

use App\Jobs\GenerateStudyPackJob;
use App\Models\Chunk;
use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Flashcard;
use App\Models\Question;
use App\Models\User;
use App\Services\Llm\LlmRateLimit;
use App\Services\StudyPack\StudyPackGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

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

    private function defaultLevels(): array
    {
        return [
            [
                'title' => 'Dasar Limit',
                'summary' => 'Level dasar membahas limit.',
                'key_points' => ['Paham limit'],
                'concepts' => [
                    ['name' => 'Limit', 'description' => 'Dasar limit', 'importance' => 'high'],
                ],
            ],
            [
                'title' => 'Turunan',
                'summary' => 'Level lanjutan membahas turunan.',
                'key_points' => ['Paham turunan'],
                'concepts' => [
                    ['name' => 'Turunan', 'description' => 'Dasar turunan', 'importance' => 'medium'],
                ],
            ],
        ];
    }

    private function fakeLlm(?array $levels = null): void
    {
        $levels = $levels ?? $this->defaultLevels();

        Http::fake(function ($request) use ($levels) {
            $body = $request->body();

            if (str_contains($body, 'TUGAS_OUTLINE_LEVEL')) {
                return Http::response($this->gemini([
                    'summary' => 'Ringkasan materi.',
                    'key_points' => ['Limit', 'Turunan'],
                    'levels' => $levels,
                ]));
            }

            if (str_contains($body, 'TUGAS_SOAL_LEVEL')) {
                return Http::response($this->gemini([
                    'questions' => [
                        ['level' => 1, 'concept' => 'Limit', 'question' => 'q1-limit', 'options' => ['a', 'b', 'c', 'd'], 'correct_index' => 1, 'explanation' => 'e', 'source_label' => 'Slide 1'],
                        ['level' => 1, 'concept' => 'Limit', 'question' => 'q2-limit', 'options' => ['a', 'b', 'c', 'd'], 'correct_index' => 0, 'explanation' => 'e2'],
                        ['level' => 2, 'concept' => 'Turunan', 'question' => 'q1-turunan', 'options' => ['a', 'b', 'c', 'd'], 'correct_index' => 2, 'explanation' => 'e3'],
                        ['level' => 2, 'concept' => 'Turunan', 'question' => 'q2-turunan', 'options' => ['a', 'b', 'c', 'd'], 'correct_index' => 3, 'explanation' => 'e4'],
                    ],
                ]));
            }

            if (str_contains($body, 'TUGAS_FLASHCARD_LEVEL')) {
                return Http::response($this->gemini([
                    'flashcards' => [
                        ['level' => 1, 'concept' => 'Limit', 'front' => 'f1-limit', 'back' => 'b1'],
                        ['level' => 1, 'concept' => 'Limit', 'front' => 'f2-limit', 'back' => 'b2'],
                        ['level' => 2, 'concept' => 'Turunan', 'front' => 'f1-turunan', 'back' => 'b3'],
                        ['level' => 2, 'concept' => 'Turunan', 'front' => 'f2-turunan', 'back' => 'b4'],
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
        $this->assertSame(2, $document->studyLevels()->count());
        $this->assertSame(['Dasar Limit', 'Turunan'], $document->studyLevels()->orderBy('level_number')->pluck('title')->all());
        $this->assertSame(['Limit', 'Turunan'], $document->concepts()->orderBy('sort_order')->pluck('name')->all());
        $this->assertSame(4, $document->questions()->count());
        $this->assertTrue($document->questions()->whereNotNull('level_id')->exists());
        $this->assertTrue($document->concepts->every(fn ($concept) => $concept->questions()->count() === 2));
        $this->assertSame(['a', 'b', 'c', 'd'], $document->questions()->first()->options);
        $this->assertSame(4, $document->flashcards()->count());
        $this->assertTrue($document->flashcards()->whereNotNull('level_id')->exists());
        $this->assertTrue($document->concepts->every(fn ($concept) => $concept->flashcards()->count() === 2));
        Http::assertSentCount(3);
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

    public function test_dokumen_legacy_dapat_peta_level_tanpa_menggandakan_data(): void
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
        Flashcard::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'front' => 'f',
            'back' => 'b',
            'sort_order' => 0,
        ]);

        $this->fakeLlm([
            [
                'title' => 'Dasar Limit',
                'summary' => 'Level dasar.',
                'key_points' => ['Limit'],
                'concepts' => [
                    ['name' => 'Limit', 'description' => 'Dasar limit', 'importance' => 'high'],
                ],
            ],
        ]);

        app(StudyPackGenerator::class)->generate($document);

        $document->refresh();
        $this->assertSame('ready', $document->study_pack_status);
        $this->assertSame(1, $document->studyLevels()->count());
        $this->assertSame(1, $document->concepts()->count());
        $this->assertSame(1, $document->questions()->count());
        $this->assertSame(1, $document->flashcards()->count());
        Http::assertSentCount(1);
    }

    public function test_tahap_flashcard_melengkapi_konsep_yang_belum_punya_kartu(): void
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

        $this->fakeLlm([
            [
                'title' => 'Dasar Limit',
                'summary' => 'Level dasar.',
                'key_points' => ['Limit'],
                'concepts' => [
                    ['name' => 'Limit', 'description' => 'Dasar limit', 'importance' => 'high'],
                ],
            ],
        ]);

        app(StudyPackGenerator::class)->generate($document);

        $document->refresh();
        $this->assertSame('ready', $document->study_pack_status);
        $this->assertSame(1, $document->questions()->count());
        $this->assertSame(2, $document->flashcards()->count());
        Http::assertSentCount(2);
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

    public function test_rate_limit_harian_menyimpan_pesan_yang_jelas(): void
    {
        Http::fake([
            '*' => Http::response(['error' => ['message' => 'Resource has been exhausted']], 429),
        ]);
        $document = $this->document();

        try {
            app(StudyPackGenerator::class)->generate($document);
            $this->fail('Rate limit seharusnya melempar exception.');
        } catch (\Throwable $e) {
            $this->assertSame(LlmRateLimit::CODE, $e->getCode());
        }

        $document->refresh();
        $this->assertSame('failed', $document->study_pack_status);
        $this->assertSame(LlmRateLimit::MESSAGE, $document->error_message);
    }
}
