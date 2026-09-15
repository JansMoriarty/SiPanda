<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Services\DocumentExtractor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestExtractPptx extends Command
{
    protected $signature = 'test:extract-pptx {document_id}';
    protected $description = 'Test extract text dari PPTX document';

    public function handle(DocumentExtractor $extractor)
    {
        $document = Document::findOrFail($this->argument('document_id'));
        $path = Storage::path('documents/' . $document->stored_filename);

        $text = $extractor->extractPptx($path);

        $this->info('--- HASIL EXTRACTION ---');
        $this->line($text);
        $this->info('--- TOTAL KARAKTER: ' . strlen($text) . ' ---');
    }
}