<?php

namespace App\Services;

use App\Models\Chunk;

class RetrievalService
{
    public function __construct(protected GeminiClient $gemini) {}

    /**
     * Cari top-N chunks paling relevan dengan pertanyaan.
     */
    public function search(string $question, int $topN = 3, float $minScore = 0.65): array
    {
        $questionEmbedding = $this->gemini->embed($question, 'RETRIEVAL_QUERY');

        $chunks = Chunk::whereNotNull('embedding')->get();

        $scored = $chunks->map(function (Chunk $chunk) use ($questionEmbedding) {
            return [
                'chunk' => $chunk,
                'score' => GeminiClient::cosineSimilarity($questionEmbedding, $chunk->embedding),
            ];
        });

        $topChunks = $scored
            ->filter(fn($item) => $item['score'] >= $minScore) // 1. Filter skor minimal dulu
            ->sortByDesc('score')                              // 2. Urutkan dari yang paling relevan
            ->take($topN)                                       // 3. Batasi maksimal 3 chunk terbaik
            ->values();

        return $topChunks->all();
    }
}
