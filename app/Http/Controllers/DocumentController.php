<?php

namespace App\Http\Controllers;

use App\Models\Course;
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
    ) {}

    public function index(Request $request)
    {
        $documents = Document::whereHas('course', fn($q) => $q->where('user_id', $request->user()->id))
            ->with('course')
            ->latest()
            ->get();

        $courses = $request->user()->courses()->orderBy('name')->get();

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'courses' => $courses,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,pptx|max:20480',
            'course_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) use ($request) {
                    $owned = Course::where('id', $value)
                        ->where('user_id', $request->user()->id)
                        ->exists();

                    if (! $owned) {
                        $fail('Mata kuliah tidak valid.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $storedFilename = uniqid('doc_') . '.' . $extension;

        $file->storeAs('documents', $storedFilename);

        $document = Document::create([
            'course_id' => $request->input('course_id'),
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'file_type' => $extension,
            'file_size' => $file->getSize(),
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

            $document->update(['status' => 'processed', 'processed_at' => now()]);
        } catch (\Throwable $e) {
            $document->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    public function download(Request $request, Document $document)
    {
        $this->authorizeOwnership($request, $document);

        $path = 'documents/' . $document->stored_filename;

        if (! Storage::exists($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return Storage::download($path, $document->original_filename);
    }

    public function destroy(Request $request, Document $document)
    {
        $this->authorizeOwnership($request, $document);

        Storage::delete('documents/' . $document->stored_filename);
        $document->delete(); // chunks ikut kehapus otomatis (cascadeOnDelete)

        return redirect()->back();
    }

    protected function authorizeOwnership(Request $request, Document $document): void
    {
        abort_unless(
            $document->course && $document->course->user_id === $request->user()->id,
            403
        );
    }
}
