<?php

namespace App\Contracts;

use App\Models\Chunk;

interface LlmClient
{
    /**
     * Jawab pertanyaan berbasis konteks materi (non-streaming).
     *
     * $scopeInstruction opsional: instruksi tambahan untuk mengunci jawaban
     * ke satu modul (dipakai Ask PANDA dari Study Pack).
     *
     * @param  array<int, array{chunk: Chunk}>  $chunks
     * @param  array<int, array{role: string, text: string}>  $history
     * @return array{answer: string, grounded: bool}
     */
    public function generateAnswer(string $question, array $chunks, array $history = [], ?string $scopeInstruction = null): array;

    /**
     * Jawab pertanyaan berbasis konteks materi sambil mengalirkan potongan teks.
     *
     * @param  array<int, array{chunk: Chunk}>  $chunks
     * @param  array<int, array{role: string, text: string}>  $history
     */
    public function generateStreamAnswer(string $question, array $chunks, array $history, callable $onChunk, ?string $scopeInstruction = null): void;

    /**
     * Minta keluaran JSON terstruktur (untuk generator Study Pack/quiz).
     *
     * @param  array<string, mixed>  $schema  JSON schema keluaran
     * @return array<string, mixed>
     */
    public function generateJson(string $prompt, array $schema, string $systemInstruction = ''): array;

    /**
     * Nama provider yang sedang dipakai (untuk logging/observability).
     */
    public function name(): string;
}
