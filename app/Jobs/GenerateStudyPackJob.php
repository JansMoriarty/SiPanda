<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\StudyPack\StudyPackGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Menjalankan generator Study Pack di queue. Idempoten: kalau status sudah
 * "ready" dan konsep sudah ada, job keluar tanpa memanggil LLM lagi.
 */
class GenerateStudyPackJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 900;

    /**
     * @var array<int, int>
     */
    public array $backoff = [30, 120];

    public function __construct(public Document $document) {}

    public function handle(StudyPackGenerator $generator): void
    {
        $document = $this->document->fresh();

        if (! $document) {
            return;
        }

        if ($document->study_pack_status === 'ready' && $document->concepts()->exists()) {
            return;
        }

        $document->update(['study_pack_status' => 'queued']);

        $generator->generate($document);
    }

    public function failed(?\Throwable $e): void
    {
        $this->document->fresh()?->update([
            'study_pack_status' => 'failed',
            'error_message' => $e?->getMessage(),
        ]);
    }
}
