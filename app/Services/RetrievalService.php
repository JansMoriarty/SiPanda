<?php

namespace App\Services;

use App\Models\Chunk;

class RetrievalService
{
    public function __construct(protected GeminiClient $gemini) {}

    /**
     * Cari top-N chunks paling relevan dengan pertanyaan,
     * dibatasi hanya ke dokumen milik $userId.
     *
     * Kalau $documentId diisi, pencarian dikunci ke satu dokumen saja
     * (dipakai Ask PANDA dari Study Pack agar jawaban hanya soal bab itu).
     * Scope kepemilikan course.user_id tetap wajib di kedua mode.
     */
    public function search(string $question, int $userId, int $topN = 3, float $minScore = 0.65, ?int $documentId = null): array
    {
        $questionEmbedding = $this->gemini->embed($question, 'RETRIEVAL_QUERY');

        $chunks = Chunk::whereNotNull('embedding')
            ->whereHas('document.course', fn ($q) => $q->where('user_id', $userId))
            ->when($documentId !== null, fn ($q) => $q->where('document_id', $documentId))
            ->get();

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