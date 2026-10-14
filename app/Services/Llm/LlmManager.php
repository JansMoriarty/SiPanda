<?php

namespace App\Services\Llm;

use App\Contracts\LlmClient;
use Illuminate\Support\Facades\Log;

/**
 * Titik masuk tunggal ke LLM. Memilih provider dari config (default + daftar
 * fallback) dan mencoba berurutan sampai ada yang berhasil. Embedding TIDAK
 * lewat sini — itu tetap di GeminiClient agar perilaku RAG lama tidak berubah.
 */
class LlmManager implements LlmClient
{
    /**
     * @var array<string, class-string<LlmClient>>
     */
    protected array $drivers = [
        'gemini' => GeminiLlmClient::class,
    ];

    public function generateAnswer(string $question, array $chunks, array $history = []): array
    {
        $errors = [];

        foreach ($this->providerNames() as $name) {
            try {
                return $this->client($name)->generateAnswer($question, $chunks, $history);
            } catch (\Throwable $e) {
                $errors[$name] = $e->getMessage();
                Log::warning("LLM provider [{$name}] gagal generateAnswer", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        throw new \RuntimeException('Semua provider LLM gagal: ' . json_encode($errors));
    }

    public function generateStreamAnswer(string $question, array $chunks, array $history, callable $onChunk): void
    {
        $errors = [];

        foreach ($this->providerNames() as $name) {
            try {
                $this->client($name)->generateStreamAnswer($question, $chunks, $history, $onChunk);

                return;
            } catch (\Throwable $e) {
                $errors[$name] = $e->getMessage();
                Log::warning("LLM provider [{$name}] gagal generateStreamAnswer", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        throw new \RuntimeException('Semua provider LLM gagal: ' . json_encode($errors));
    }

    public function generateJson(string $prompt, array $schema, string $systemInstruction = ''): array
    {
        $errors = [];

        foreach ($this->providerNames() as $name) {
            try {
                return $this->client($name)->generateJson($prompt, $schema, $systemInstruction);
            } catch (\Throwable $e) {
                $errors[$name] = $e->getMessage();
                Log::warning("LLM provider [{$name}] gagal generateJson", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        throw new \RuntimeException('Semua provider LLM gagal: ' . json_encode($errors));
    }

    public function name(): string
    {
        return (string) config('llm.default');
    }

    /**
     * @return array<int, string>
     */
    protected function providerNames(): array
    {
        $names = array_merge(
            [(string) config('llm.default')],
            (array) config('llm.fallbacks', [])
        );

        return array_values(array_unique(array_filter($names)));
    }

    protected function client(string $name): LlmClient
    {
        $config = config("llm.providers.{$name}");

        if (! is_array($config) || empty($config['driver'])) {
            throw new \InvalidArgumentException("Provider LLM [{$name}] tidak dikonfigurasi.");
        }

        $class = $this->drivers[$config['driver']] ?? null;

        if (! $class) {
            throw new \InvalidArgumentException("Driver LLM [{$config['driver']}] tidak dikenal.");
        }

        return new $class($config['api_key'] ?? null, $config['model'] ?? null);
    }
}
