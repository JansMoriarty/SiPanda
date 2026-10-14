<?php

namespace Tests\Feature;

use App\Contracts\LlmClient;
use App\Models\Chunk;
use App\Models\Course;
use App\Models\Document;
use App\Models\User;
use App\Services\RetrievalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Ask PANDA dari Study Pack terkunci ke satu modul: retrieval dibatasi ke
 * dokumen itu (tetap lewat course.user_id), dokumen milik orang lain ditolak,
 * dan instruksi scope dikirim ke LLM.
 */
class AskPandaScopeTest extends TestCase
{
    use RefreshDatabase;

    private function course(User $user): Course
    {
        return Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#465FFF',
        ]);
    }

    private function document(Course $course, string $label): Document
    {
        return Document::create([
            'course_id' => $course->id,
            'original_filename' => "bab-{$label}.pdf",
            'stored_filename' => "doc-{$label}.pdf",
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ]);
    }

    private function chunk(Document $document, array $embedding): Chunk
    {
        return Chunk::create([
            'document_id' => $document->id,
            'content' => "Isi {$document->original_filename}",
            'source_location' => 'Slide 1',
            'chunk_index' => 0,
            'embedding' => $embedding,
        ]);
    }

    private function fakeEmbedding(array $vector): void
    {
        Http::fake([
            '*embedContent*' => Http::response(['embedding' => ['values' => $vector]]),
        ]);
    }

    public function test_retrieval_tanpa_scope_mengembalikan_dokumen_paling_mirip(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $course = $this->course($user);
        $docA = $this->document($course, 'a');
        $docB = $this->document($course, 'b');

        $this->chunk($docA, [0.8, 0.2]);
        $this->chunk($docB, [1, 0]);

        $results = app(RetrievalService::class)->search('limit', $user->id);

        $this->assertCount(2, $results);
        $this->assertSame($docB->id, $results[0]['chunk']->document_id);
    }

    public function test_retrieval_dengan_scope_hanya_mengembalikan_dokumen_itu(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $course = $this->course($user);
        $docA = $this->document($course, 'a');
        $docB = $this->document($course, 'b');

        $this->chunk($docA, [0.8, 0.2]);
        $this->chunk($docB, [1, 0]);

        $results = app(RetrievalService::class)->search('limit', $user->id, 3, 0.65, $docA->id);

        $this->assertCount(1, $results);
        $this->assertSame($docA->id, $results[0]['chunk']->document_id);
    }

    public function test_scope_tidak_bisa_menembus_dokumen_orang_lain(): void
    {
        $this->fakeEmbedding([1, 0]);

        $me = User::factory()->create();
        $this->course($me);

        $other = User::factory()->create();
        $otherDoc = $this->document($this->course($other), 'rahasia');
        $this->chunk($otherDoc, [1, 0]);

        $results = app(RetrievalService::class)->search('limit', $me->id, 3, 0.65, $otherDoc->id);

        $this->assertCount(0, $results);
    }

    public function test_ask_menolak_dokumen_milik_orang_lain(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $otherDoc = $this->document($this->course($other), 'rahasia');

        $this->actingAs($me)
            ->post('/ask-panda', ['question' => 'apa isinya?', 'document_id' => $otherDoc->id])
            ->assertForbidden();
    }

    public function test_ask_menolak_dokumen_tidak_dikenal(): void
    {
        $me = User::factory()->create();
        $this->course($me);

        $this->actingAs($me)
            ->post('/ask-panda', ['question' => 'apa isinya?', 'document_id' => 999999])
            ->assertForbidden();
    }

    public function test_ask_dari_study_pack_mengirim_scope_dan_konteks_terbatas(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $course = $this->course($user);
        $docA = $this->document($course, 'a');
        $docB = $this->document($course, 'b');

        $this->chunk($docA, [0.8, 0.2]);
        $this->chunk($docB, [1, 0]);

        $fake = new class implements LlmClient {
            public array $calls = [];

            public function generateAnswer(string $question, array $chunks, array $history = [], ?string $scopeInstruction = null): array
            {
                $this->calls[] = compact('question', 'chunks', 'history', 'scopeInstruction');

                return ['answer' => 'ok', 'grounded' => true];
            }

            public function generateStreamAnswer(string $question, array $chunks, array $history, callable $onChunk, ?string $scopeInstruction = null): void
            {
                $this->calls[] = compact('question', 'chunks', 'history', 'scopeInstruction');
                $onChunk('Jawaban terkunci.');
            }

            public function generateJson(string $prompt, array $schema, string $systemInstruction = ''): array
            {
                return [];
            }

            public function name(): string
            {
                return 'fake';
            }
        };

        $this->app->instance(LlmClient::class, $fake);

        $response = $this->actingAs($user)->post('/ask-panda', [
            'question' => 'jelaskan limit',
            'document_id' => $docA->id,
        ]);

        $response->assertOk();

        $body = $response->streamedContent();
        $this->assertStringContainsString('"type":"scope"', $body);
        $this->assertStringContainsString('bab-a.pdf', $body);

        $this->assertCount(1, $fake->calls);
        $this->assertCount(1, $fake->calls[0]['chunks']);
        $this->assertSame($docA->id, $fake->calls[0]['chunks'][0]['chunk']->document_id);
        $this->assertStringContainsString('bab-a.pdf', $fake->calls[0]['scopeInstruction']);
    }

    public function test_ask_bebas_tanpa_scope_tidak_mengirim_instruksi_scope(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $course = $this->course($user);
        $this->chunk($this->document($course, 'a'), [1, 0]);

        $fake = new class implements LlmClient {
            public array $calls = [];

            public function generateAnswer(string $question, array $chunks, array $history = [], ?string $scopeInstruction = null): array
            {
                $this->calls[] = compact('question', 'chunks', 'history', 'scopeInstruction');

                return ['answer' => 'ok', 'grounded' => true];
            }

            public function generateStreamAnswer(string $question, array $chunks, array $history, callable $onChunk, ?string $scopeInstruction = null): void
            {
                $this->calls[] = compact('question', 'chunks', 'history', 'scopeInstruction');
                $onChunk('Jawaban bebas.');
            }

            public function generateJson(string $prompt, array $schema, string $systemInstruction = ''): array
            {
                return [];
            }

            public function name(): string
            {
                return 'fake';
            }
        };

        $this->app->instance(LlmClient::class, $fake);

        $response = $this->actingAs($user)->post('/ask-panda', [
            'question' => 'apa itu donat?',
        ]);

        $response->assertOk();

        $body = $response->streamedContent();
        $this->assertStringNotContainsString('"type":"scope"', $body);
        $this->assertNull($fake->calls[0]['scopeInstruction']);
    }

    public function test_index_mengirim_daftar_materi_milik_user(): void
    {
        $me = User::factory()->create();
        $mine = $this->document($this->course($me), 'milik');

        $other = User::factory()->create();
        $this->document($this->course($other), 'orang-lain');

        $this->actingAs($me)
            ->get('/ask-panda')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('AskPanda/Index')
                ->has('materials', 1)
                ->where('materials.0.id', $mine->id)
                ->where('materials.0.title', 'bab-milik.pdf')
                ->where('materials.0.course.name', 'Kalkulus'));
    }

    public function test_ask_bebas_tanpa_konteks_menawarkan_opsi_pengetahuan_umum(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $this->course($user);

        $fake = new RecordingLlm();
        $this->app->instance(LlmClient::class, $fake);

        $response = $this->actingAs($user)->post('/ask-panda', [
            'question' => 'cara membuat donat gula?',
        ]);

        $response->assertOk();

        $body = $response->streamedContent();
        $this->assertStringContainsString('"type":"no_context"', $body);
        $this->assertCount(0, $fake->calls);
    }

    public function test_ask_bebas_dengan_allow_general_meneruskan_ke_llm(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $this->course($user);

        $fake = new RecordingLlm();
        $this->app->instance(LlmClient::class, $fake);

        $response = $this->actingAs($user)->post('/ask-panda', [
            'question' => 'cara membuat donat gula?',
            'allow_general' => true,
        ]);

        $response->assertOk();

        $body = $response->streamedContent();
        $this->assertStringNotContainsString('"type":"no_context"', $body);
        $this->assertCount(1, $fake->calls);
        $this->assertStringContainsString('pengetahuan umum', $fake->calls[0]['scopeInstruction']);
    }

    public function test_ask_scope_modul_tidak_menawarkan_opsi_pengetahuan_umum(): void
    {
        $this->fakeEmbedding([1, 0]);

        $user = User::factory()->create();
        $doc = $this->document($this->course($user), 'a');

        $fake = new RecordingLlm();
        $this->app->instance(LlmClient::class, $fake);

        $response = $this->actingAs($user)->post('/ask-panda', [
            'question' => 'cara membuat donat gula?',
            'document_id' => $doc->id,
        ]);

        $response->assertOk();

        $body = $response->streamedContent();
        $this->assertStringNotContainsString('"type":"no_context"', $body);
        $this->assertCount(1, $fake->calls);
    }
}

class RecordingLlm implements LlmClient
{
    public array $calls = [];

    public function generateAnswer(string $question, array $chunks, array $history = [], ?string $scopeInstruction = null): array
    {
        $this->calls[] = compact('question', 'chunks', 'history', 'scopeInstruction');

        return ['answer' => 'ok', 'grounded' => true];
    }

    public function generateStreamAnswer(string $question, array $chunks, array $history, callable $onChunk, ?string $scopeInstruction = null): void
    {
        $this->calls[] = compact('question', 'chunks', 'history', 'scopeInstruction');
        $onChunk('Jawaban.');
    }

    public function generateJson(string $prompt, array $schema, string $systemInstruction = ''): array
    {
        return [];
    }

    public function name(): string
    {
        return 'recording';
    }
}
