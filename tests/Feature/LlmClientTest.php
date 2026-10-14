<?php

namespace Tests\Feature;

use App\Contracts\LlmClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Kontrak provider LLM: resolusi lewat container, provider default dari config,
 * fallback berurutan saat provider utama gagal, dan fallback antar model Gemini.
 */
class LlmClientTest extends TestCase
{
    public function test_container_mengembalikan_provider_default(): void
    {
        $this->assertSame('gemini', config('llm.default'));
        $this->assertInstanceOf(LlmClient::class, app(LlmClient::class));
        $this->assertSame('gemini', app(LlmClient::class)->name());
    }

    public function test_config_membangun_provider_fallback_model(): void
    {
        $this->assertArrayHasKey('gemini', config('llm.providers'));
        $this->assertArrayHasKey('gemini_model_1', config('llm.providers'));
        $this->assertContains('gemini_model_1', config('llm.fallbacks'));
    }

    public function test_fallback_dipakai_saat_provider_utama_gagal(): void
    {
        config([
            'llm.default' => 'broken',
            'llm.fallbacks' => ['gemini'],
            'llm.providers.broken' => ['driver' => 'tidak-ada', 'api_key' => 'x', 'model' => 'y'],
        ]);

        Http::fake([
            '*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => '{"answer":"oke","grounded":true}']]],
                ]],
            ], 200),
        ]);

        $result = app(LlmClient::class)->generateAnswer('apa itu limit?', []);

        $this->assertSame('oke', $result['answer']);
        $this->assertTrue($result['grounded']);
    }

    public function test_fallback_model_dipakai_saat_model_utama_503(): void
    {
        config([
            'llm.default' => 'gemini',
            'llm.fallbacks' => ['gemini_model_1'],
            'llm.providers.gemini' => ['driver' => 'gemini', 'api_key' => 'x', 'model' => 'model-utama'],
            'llm.providers.gemini_model_1' => ['driver' => 'gemini', 'api_key' => 'x', 'model' => 'model-cadangan'],
        ]);

        Http::fake([
            '*model-utama:generateContent*' => Http::response(['error' => ['code' => 503]], 503),
            '*model-cadangan:generateContent*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => '{"answer":"oke","grounded":true}']]],
                ]],
            ], 200),
        ]);

        $result = app(LlmClient::class)->generateAnswer('apa itu limit?', []);

        $this->assertSame('oke', $result['answer']);
    }

    public function test_semua_provider_gagal_melempar_runtime_exception(): void
    {
        config([
            'llm.default' => 'broken',
            'llm.fallbacks' => [],
            'llm.providers.broken' => ['driver' => 'tidak-ada', 'api_key' => 'x', 'model' => 'y'],
        ]);

        $this->expectException(\RuntimeException::class);

        app(LlmClient::class)->generateAnswer('halo', []);
    }
}
