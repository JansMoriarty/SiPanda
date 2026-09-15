<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Services\GeminiClient;
use Illuminate\Console\Command;

class TestEmbedChunks extends Command
{
    protected $signature = 'test:embed-chunks {document_id}';
    protected $description = 'Generate embedding untuk semua chunk milik sebuah document';

    public function handle(GeminiClient $gemini)
    {
        $document = Document::findOrFail($this->argument('document_id'));
        $chunks = $document->chunks;

        $this->info("Generating embedding untuk {$chunks->count()} chunks...");

        foreach ($chunks as $chunk) {
            $embedding = $gemini->embed($chunk->content, 'RETRIEVAL_DOCUMENT');
            $chunk->update(['embedding' => $embedding]);

            $this->line("Chunk {$chunk->id} ({$chunk->source_location}) → embedding dim: " . count($embedding));
        }

        $this->info('Selesai.');
    }
}