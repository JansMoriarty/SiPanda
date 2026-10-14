<?php

namespace App\Services\Llm;

use App\Models\LlmUsage;
use Illuminate\Support\Facades\Log;

/**
 * Pencatat pemakaian token LLM (observability admin).
 *
 * Konteks (user/feature/dokumen) di-set oleh pemanggil lewat run()/setContext()
 * karena LlmClient sengaja tidak tahu domain. Klien Gemini yang menyediakan
 * angka usageMetadata, recorder ini yang menyimpannya.
 *
 * Pencatatan TIDAK boleh menggagalkan pemanggilan LLM: semua error ditelan
 * dan cukup dicatat ke log.
 */
class LlmUsageRecorder
{
    protected ?int $userId = null;

    protected ?int $documentId = null;

    protected string $feature = 'unknown';

    /**
     * Jalankan $callback dengan konteks penggunaan; konteks lama dikembalikan
     * setelah selesai (aman untuk nesting).
     */
    public function run(?int $userId, string $feature, callable $callback, ?int $documentId = null): mixed
    {
        $previous = [$this->userId, $this->documentId, $this->feature];

        $this->userId = $userId;
        $this->documentId = $documentId;
        $this->feature = $feature !== '' ? $feature : 'unknown';

        try {
            return $callback();
        } finally {
            [$this->userId, $this->documentId, $this->feature] = $previous;
        }
    }

    /**
     * @param  array<string, mixed>|null  $usage  usageMetadata mentah dari Gemini
     */
    public function record(
        string $provider,
        string $model,
        ?array $usage,
        bool $successful = true,
        ?string $error = null,
    ): void {
        try {
            $prompt = max(0, (int) ($usage['promptTokenCount'] ?? 0));
            $completion = max(0, (int) ($usage['candidatesTokenCount'] ?? 0));
            $total = max(0, (int) ($usage['totalTokenCount'] ?? 0));

            if ($total === 0) {
                $total = $prompt + $completion;
            }

            LlmUsage::create([
                'user_id' => $this->userId,
                'document_id' => $this->documentId,
                'feature' => $this->feature,
                'provider' => $provider,
                'model' => mb_substr($model, 0, 80),
                'prompt_tokens' => $prompt,
                'completion_tokens' => $completion,
                'total_tokens' => $total,
                'successful' => $successful,
                'error' => $error !== null ? mb_substr($error, 0, 250) : null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Gagal mencatat pemakaian LLM', ['error' => $e->getMessage()]);
        }
    }

    public function feature(): string
    {
        return $this->feature;
    }

    public function userId(): ?int
    {
        return $this->userId;
    }
}
