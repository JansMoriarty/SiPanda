<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Services\DocumentExtractor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestExtractPdf extends Command
{
    protected $signature = 'test:extract-pdf {document_id}';
    protected $description = 'Test extract text dari PDF document';

    public function handle(DocumentExtractor $extractor)
    {
        $document = Document::findOrFail($this->argument('document_id'));
        $path = Storage::path('documents/' . $document->stored_filename);

        $text = $extractor->extractPdf($path);

        $this->info('--- HASIL EXTRACTION ---');
        $this->line(substr($text, 0, 1000)); // tampilkan 1000 karakter pertama dulu
        $this->info('--- TOTAL KARAKTER: ' . strlen($text) . ' ---');
    }
}