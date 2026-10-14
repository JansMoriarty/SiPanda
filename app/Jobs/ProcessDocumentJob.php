<?php

namespace App\Jobs;

use App\Models\Chunk;
use App\Models\Document;
use App\Services\DocumentExtractor;
use App\Services\GeminiClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * Ingest dokumen (extract -> chunk -> embedding) secara asinkron.
 *
 * Dua sifat penting:
 * - Idempoten: kalau dokumen sudah selesai (processed + ada chunk), job keluar
 *   tanpa mengerjakan apa pun, jadi re-dispatch tidak menggandakan chunk.
 * - Bisa lanjut (resume): percobaan berikutnya mulai dari chunk_index setelah
 *   chunk terakhir yang sudah tersimpan, jadi kegagalan embed di tengah tidak
 *   mengulang embedding yang sudah ada.
 *
 * Setelah ingest sukses, GenerateStudyPackJob otomatis di-dispatch supaya
 * Study Pack dibuat tanpa aksi manual. Job itu idempoten, jadi aman meski
 * dokumen sudah punya study pack.
 */
class ProcessDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 600;

    /**
     * Jeda antar percobaan (detik). Cukup longgar untuk melewati rate limit 429.
     *
     * @var array<int, int>
     */
    public array $backoff = [10, 30, 60];

    public function __construct(public Document $document) {}

    public function handle(DocumentExtractor $extractor, GeminiClient $gemini): void
    {
        $document = $this->document->fresh();

        if (! $document) {
            return;
        }

        if ($document->status === 'processed' && $document->chunks()->exists()) {
            return;
        }

        $document->update(['status' => 'processing', 'error_message' => null]);

        try {
            $max = $document->chunks()->max('chunk_index');
            $startIndex = $max === null ? 0 : ((int) $max + 1);

            $path = Storage::path('documents/' . $document->stored_filename);

            $text = $document->file_type === 'pdf'
                ? $extractor->extractPdf($path)
                : $extractor->extractPptx($path);

            $chunks = $extractor->chunkText($text);

            foreach ($chunks as $index => $chunk) {
                if ($index < $startIndex) {
                    continue;
                }

                $embedding = $gemini->embed($chunk['content'], 'RETRIEVAL_DOCUMENT');

                Chunk::create([
                    'document_id' => $document->id,
                    'content' => $chunk['content'],
                    'embedding' => $embedding,
                    'source_location' => $chunk['source_location'],
                    'chunk_index' => $index,
                ]);
            }

            $document->update(['status' => 'processed', 'processed_at' => now(), 'study_pack_status' => 'queued']);

            GenerateStudyPackJob::dispatch($document);
        } catch (\Throwable $e) {
            $document->update(['status' => 'failed', 'error_message' => $e->getMessage()]);

            throw $e;
        }
    }

    public function failed(?\Throwable $e): void
    {
        $this->document->fresh()?->update([
            'status' => 'failed',
            'error_message' => $e?->getMessage(),
        ]);
    }
}
