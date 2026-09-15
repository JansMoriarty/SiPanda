<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Models\Chunk;
use App\Services\DocumentExtractor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestChunking extends Command
{
    protected $signature = 'test:chunking {document_id}';
    protected $description = 'Test chunking dan simpan ke tabel chunks';

    public function handle(DocumentExtractor $extractor)
    {
        $document = Document::findOrFail($this->argument('document_id'));
        $path = Storage::path('documents/' . $document->stored_filename);

        $text = $document->file_type === 'pdf'
            ? $extractor->extractPdf($path)
            : $extractor->extractPptx($path);

        $chunks = $extractor->chunkText($text);

        $this->info('Jumlah chunks: ' . count($chunks));

        // Hapus chunk lama kalau ada (biar bisa re-test tanpa duplikat)
        $document->chunks()->delete();

        foreach ($chunks as $index => $chunk) {
            Chunk::create([
                'document_id' => $document->id,
                'content' => $chunk['content'],
                'source_location' => $chunk['source_location'],
                'chunk_index' => $index,
            ]);

            $this->line("[{$index}] ({$chunk['source_location']}) " . substr($chunk['content'], 0, 80) . '...');
        }

        $document->update(['status' => 'processed']);
        $this->info('Selesai, status document diupdate jadi "processed".');
    }
}