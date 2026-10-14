<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Klien embedding + utilitas vektor Gemini. Pemanggilan teks/chat dipindah ke
 * App\Contracts\LlmClient (lihat App\Services\Llm\GeminiLlmClient) agar provider
 * bisa diganti. Embedding sengaja tetap di sini karena index vektor 768-dimensi
 * sudah dibangun dengan model ini.
 */
class GeminiClient
{
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    public function embed(string $text, string $taskType = 'RETRIEVAL_DOCUMENT'): array
    {
        $response = Http::post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={$this->apiKey}",
            [
                'model' => 'models/gemini-embedding-001',
                'content' => [
                    'parts' => [
                        ['text' => $text],
                    ],
                ],
                'taskType' => $taskType,
                'outputDimensionality' => 768,
            ]
        );

        if ($response->failed()) {
            throw new \RuntimeException('Gemini Embedding API error: ' . $response->body());
        }

        return $response->json('embedding.values');
    }

    public static function cosineSimilarity(array $vecA, array $vecB): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($vecA as $i => $value) {
            $dotProduct += $value * $vecB[$i];
            $normA += $value ** 2;
            $normB += $vecB[$i] ** 2;
        }

        if ($normA == 0 || $normB == 0) {
            return 0.0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }
}
