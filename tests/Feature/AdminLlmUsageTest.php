<?php

namespace Tests\Feature;

use App\Contracts\LlmClient;
use App\Models\Chunk;
use App\Models\Course;
use App\Models\Document;
use App\Models\LlmUsage;
use App\Models\User;
use App\Services\Llm\LlmUsageRecorder;
use App\Services\StudyPack\StudyPackGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Monitoring pemakaian AI: recorder menangkap usageMetadata Gemini, atribusi
 * fitur/dokumen benar, dan halaman admin terkunci untuk non-admin.
 */
class AdminLlmUsageTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['role' => User::ROLE_ADMIN])->save();

        return $user;
    }

    private function document(User $owner): Document
    {
        $course = Course::create([
            'user_id' => $owner->id,
            'name' => 'Kalkulus',
            'color' => '#465FFF',
        ]);

        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_llm.pdf',
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

    private function gemini(array $payload, int $tokens = 100): array
    {
        return [
            'candidates' => [[
                'content' => ['parts' => [['text' => json_encode($payload)]]],
            ]],
            'usageMetadata' => [
                'promptTokenCount' => $tokens - 20,
                'candidatesTokenCount' => 20,
                'totalTokenCount' => $tokens,
            ],
        ];
    }

    public function test_recorder_menyimpan_pemakaian_dengan_konteks(): void
    {
        $user = User::factory()->create();
        $recorder = app(LlmUsageRecorder::class);

        $recorder->run($user->id, LlmUsage::FEATURE_ASK_PANDA, function () use ($recorder) {
            $recorder->record('gemini', 'model-x', [
                'promptTokenCount' => 10,
                'candidatesTokenCount' => 5,
                'totalTokenCount' => 15,
            ]);
        });

        $row = LlmUsage::first();
        $this->assertNotNull($row);
        $this->assertSame($user->id, $row->user_id);
        $this->assertSame(LlmUsage::FEATURE_ASK_PANDA, $row->feature);
        $this->assertSame(10, $row->prompt_tokens);
        $this->assertSame(5, $row->completion_tokens);
        $this->assertSame(15, $row->total_tokens);
        $this->assertTrue($row->successful);
        $this->assertSame('unknown', $recorder->feature());
    }

    public function test_gemini_client_mencatat_usage_dari_response(): void
    {
        config([
            'llm.default' => 'gemini',
            'llm.fallbacks' => [],
            'llm.providers.gemini' => ['driver' => 'gemini', 'api_key' => 'x', 'model' => 'model-uji'],
        ]);

        Http::fake([
            '*' => Http::response($this->gemini(['answer' => 'oke', 'grounded' => true], 150)),
        ]);

        app(LlmClient::class)->generateAnswer('apa itu limit?', []);

        $row = LlmUsage::latest('id')->first();
        $this->assertNotNull($row);
        $this->assertSame('gemini', $row->provider);
        $this->assertSame('model-uji', $row->model);
        $this->assertSame(130, $row->prompt_tokens);
        $this->assertSame(20, $row->completion_tokens);
        $this->assertSame(150, $row->total_tokens);
        $this->assertTrue($row->successful);
    }

    public function test_study_pack_diatribusikan_ke_pemilik_dokumen(): void
    {
        Http::fake(function ($request) {
            $body = $request->body();

            if (str_contains($body, 'TUGAS_RINGKASAN')) {
                return Http::response($this->gemini(['summary' => 'R', 'key_points' => ['Limit']]));
            }
            if (str_contains($body, 'TUGAS_KONSEP')) {
                return Http::response($this->gemini(['concepts' => [['name' => 'Limit', 'description' => 'd', 'importance' => 'high']]]));
            }
            if (str_contains($body, 'TUGAS_SOAL')) {
                return Http::response($this->gemini(['questions' => [['question' => 'q', 'options' => ['a', 'b'], 'correct_index' => 0, 'explanation' => 'e']]]));
            }

            return Http::response('unexpected', 500);
        });

        $owner = User::factory()->create();
        $document = $this->document($owner);

        app(StudyPackGenerator::class)->generate($document);

        $rows = LlmUsage::where('feature', LlmUsage::FEATURE_STUDY_PACK)->get();

        $this->assertCount(3, $rows);
        $this->assertTrue($rows->every(fn ($row) => $row->user_id === $owner->id));
        $this->assertTrue($rows->every(fn ($row) => $row->document_id === $document->id));
        $this->assertSame(300, (int) $rows->sum('total_tokens'));
    }

    public function test_admin_melihat_halaman_pemakaian_ai(): void
    {
        LlmUsage::create([
            'user_id' => User::factory()->create()->id,
            'feature' => LlmUsage::FEATURE_ASK_PANDA,
            'provider' => 'gemini',
            'model' => 'model-x',
            'prompt_tokens' => 100,
            'completion_tokens' => 50,
            'total_tokens' => 150,
        ]);

        $this->actingAs($this->admin())
            ->get('/admin/llm-usage')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/LlmUsage/Index')
                ->where('stats.calls', 1)
                ->where('stats.total_tokens', 150)
                ->has('by_feature', 1)
                ->has('daily', 14)
                ->has('recent.data', 1)
            );
    }

    public function test_student_tidak_bisa_membuka_halaman_pemakaian_ai(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin/llm-usage')
            ->assertForbidden();
    }
}
