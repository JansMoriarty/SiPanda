<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Chunk;
use App\Services\DocumentExtractor;
use App\Services\GeminiClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentExtractor $extractor,
        protected GeminiClient $gemini
    ) {
    }

    public function index()
    {
        $documents = Document::latest()->get();

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,pptx|max:20480',
            'subject' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $storedFilename = uniqid('doc_') . '.' . $extension;

        $file->storeAs('documents', $storedFilename);

        $document = Document::create([
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'file_type' => $extension,
            'file_size' => $file->getSize(),
            'subject' => $request->input('subject'),
            'status' => 'uploaded',
        ]);

        $this->processDocument($document);

        return redirect()->back();
    }

    protected function processDocument(Document $document): void
    {
        $document->update(['status' => 'processing']);

        try {
            $path = Storage::path('documents/' . $document->stored_filename);

            $text = $document->file_type === 'pdf'
                ? $this->extractor->extractPdf($path)
                : $this->extractor->extractPptx($path);

            $chunks = $this->extractor->chunkText($text);

            foreach ($chunks as $index => $chunk) {
                $embedding = $this->gemini->embed($chunk['content'], 'RETRIEVAL_DOCUMENT');

                Chunk::create([
                    'document_id' => $document->id,
                    'content' => $chunk['content'],
                    'embedding' => $embedding,
                    'source_location' => $chunk['source_location'],
                    'chunk_index' => $index,
                ]);
            }

            $document->update(['status' => 'processed']);
        } catch (\Throwable $e) {
            $document->update(['status' => 'failed']);
        }
    }

    public function download(Document $document)
    {
        $path = 'documents/' . $document->stored_filename;

        if (! Storage::exists($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::download($path, $document->original_filename);
    }

    public function destroy(Document $document)
    {
        Storage::delete('documents/' . $document->stored_filename);
        $document->delete(); // chunks ikut kehapus otomatis (cascadeOnDelete)

        return redirect()->back();
    }
}