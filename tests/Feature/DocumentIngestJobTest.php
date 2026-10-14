<?php

namespace Tests\Feature;

use App\Jobs\GenerateStudyPackJob;
use App\Jobs\ProcessDocumentJob;
use App\Models\Chunk;
use App\Models\Course;
use App\Models\Document;
use App\Models\User;
use App\Services\DocumentExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Regresi untuk pemindahan ingest ke queue (ProcessDocumentJob). Yang dikunci:
 * hasil sama seperti ingest sinkron, re-dispatch tidak menggandakan chunk,
 * job bisa lanjut dari chunk terakhir saat di-retry, dan kegagalan embed
 * menandai dokumen failed.
 */
class DocumentIngestJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Bus::fake([GenerateStudyPackJob::class]);
    }

    private function fakeExtractor(string $text): void
    {
        $this->instance(DocumentExtractor::class, new class($text) extends DocumentExtractor
        {
            public function __construct(private string $text) {}

            public function extractPdf(string $path): string
            {
                return $this->text;
            }

            public function extractPptx(string $path): string
            {
                return $this->text;
            }
        });
    }

    private function sampleText(): string
    {
        return "\n--- Slide 1 ---\nalpha satu\n--- Slide 2 ---\nbeta dua\n--- Slide 3 ---\ngamma tiga\n";
    }

    private function document(string $status = 'uploaded'): Document
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#0c9c8f',
        ]);

        return Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_test.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => $status,
        ]);
    }

    private function fakeEmbedding(): void
    {
        Http::fake([
            '*' => Http::response(['embedding' => ['values' => [0.1, 0.2, 0.3]]], 200),
        ]);
    }

    public function test_job_mengekstrak_dan_membuat_chunk(): void
    {
        $this->fakeEmbedding();
        $this->fakeExtractor($this->sampleText());
        $document = $this->document();

        ProcessDocumentJob::dispatchSync($document);

        $document->refresh();
        $this->assertSame('processed', $document->status);
        $this->assertNotNull($document->processed_at);
        $this->assertSame(3, $document->chunks()->count());
        $this->assertSame(
            ['Slide 1', 'Slide 2', 'Slide 3'],
            $document->chunks()->orderBy('chunk_index')->pluck('source_location')->all()
        );
    }

    public function test_ingest_sukses_mendispatch_generate_study_pack(): void
    {
        $this->fakeEmbedding();
        $this->fakeExtractor($this->sampleText());
        $document = $this->document();

        ProcessDocumentJob::dispatchSync($document);

        Bus::assertDispatched(
            GenerateStudyPackJob::class,
            fn (GenerateStudyPackJob $job) => $job->document->is($document)
        );
    }

    public function test_ingest_gagal_tidak_mendispatch_generate_study_pack(): void
    {
        Http::fake(['*' => Http::response('boom', 500)]);
        $this->fakeExtractor($this->sampleText());
        $document = $this->document();

        try {
            ProcessDocumentJob::dispatchSync($document);
        } catch (\Throwable) {
        }

        Bus::assertNotDispatched(GenerateStudyPackJob::class);
    }

    public function test_redispatch_tidak_menggandakan_chunk(): void
    {
        $this->fakeEmbedding();
        $this->fakeExtractor($this->sampleText());
        $document = $this->document();

        ProcessDocumentJob::dispatchSync($document);

        Http::fake();

        ProcessDocumentJob::dispatchSync($document->fresh());

        $this->assertSame(3, $document->chunks()->count());
        Http::assertNothingSent();
    }

    public function test_job_lanjut_dari_chunk_terakhir(): void
    {
        $this->fakeEmbedding();
        $this->fakeExtractor($this->sampleText());
        $document = $this->document();

        Chunk::create([
            'document_id' => $document->id,
            'content' => 'alpha satu',
            'embedding' => [0.1],
            'source_location' => 'Slide 1',
            'chunk_index' => 0,
        ]);

        ProcessDocumentJob::dispatchSync($document);

        $document->refresh();
        $this->assertSame('processed', $document->status);
        $this->assertSame(3, $document->chunks()->count());
        $this->assertSame([0, 1, 2], $document->chunks()->orderBy('chunk_index')->pluck('chunk_index')->all());
        Http::assertSentCount(2);
    }

    public function test_kegagalan_embed_menandai_dokumen_failed(): void
    {
        Http::fake([
            '*' => Http::response('boom', 500),
        ]);
        $this->fakeExtractor($this->sampleText());
        $document = $this->document();

        $threw = false;

        try {
            ProcessDocumentJob::dispatchSync($document);
        } catch (\Throwable $e) {
            $threw = true;
        }

        $this->assertTrue($threw);
        $document->refresh();
        $this->assertSame('failed', $document->status);
        $this->assertNotNull($document->error_message);
    }
}
