<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateStudyPackJob;
use App\Models\Document;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Daftar & detail materi V2 (Materials/Index, Materials/Show).
 *
 * Semua akses di-scope lewat course.user_id: documents tidak punya user_id
 * sendiri. Jangan pakai Document::find() polos untuk halaman user.
 */
class MaterialsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $documents = Document::query()
            ->whereHas('course', fn ($query) => $query->where('user_id', $user->id))
            ->with('course:id,user_id,name,color')
            ->latest()
            ->get();

        // Skor quiz terakhir per dokumen. Satu query, bukan N+1.
        $lastScores = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->orderBy('completed_at')
            ->get(['document_id', 'score'])
            ->groupBy('document_id')
            ->map(fn ($rows) => $rows->last()->score);

        $courses = $user->courses()
            ->withCount('documents')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return Inertia::render('Materials/Index', [
            'materials' => $documents
                ->map(fn (Document $document) => $this->toMaterial($document, $lastScores[$document->id] ?? null))
                ->values(),
            'courses' => $courses->map(fn ($course) => [
                'id' => $course->id,
                'name' => $course->name,
                'color' => $course->color,
                'documents_count' => $course->documents_count,
            ])->values(),
        ]);
    }

    public function show(Request $request, Document $document)
    {
        $this->authorizeOwnership($request, $document);

        $document->load('course:id,user_id,name,color');

        $lastScore = QuizAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('document_id', $document->id)
            ->whereNotNull('completed_at')
            ->orderBy('completed_at')
            ->value('score');

        return Inertia::render('Materials/Show', [
            'document' => $this->toMaterial($document, $lastScore),
        ]);
    }

    /**
     * Buat ulang Study Pack (dipakai tombol "Buat ulang" saat status gagal
     * atau saat belum pernah dibuat). Memakai job yang sama dengan alur
     * lain, jadi tidak ada pipeline kedua yang bisa berbeda.
     */
    public function generateStudyPack(Request $request, Document $document)
    {
        $this->authorizeOwnership($request, $document);

        // Set 'queued' langsung supaya halaman detail ikut ter-polling begitu
        // diarahkan balik, tanpa menunggu worker mengambil job.
        $document->update(['study_pack_status' => 'queued']);

        GenerateStudyPackJob::dispatch($document);

        return redirect()->back();
    }

    /**
     * Bentuk data yang dipakai halaman V2. Sengaja tidak mengirim model
     * mentah agar nama field tidak ikut berubah kalau skema internal berubah.
     */
    private function toMaterial(Document $document, ?int $lastScore): array
    {
        return [
            'id' => $document->id,
            'title' => $document->original_filename,
            'course' => [
                'id' => $document->course?->id,
                'name' => $document->course?->name,
                'color' => $document->course?->color,
            ],
            'file_type' => $document->file_type,
            'file_size' => (int) $document->file_size,
            'page_count' => $document->page_count,
            'status' => $document->status,
            'uploaded_at' => $document->created_at?->toISOString(),
            'processed_at' => $document->processed_at?->toISOString(),
            'error_message' => $document->error_message,
            'last_quiz_score' => $lastScore,
            'study_pack' => [
                'status' => $document->study_pack_status,
                'generated_at' => $document->study_pack_generated_at?->toISOString(),
                // Tidak ada kolom persen di DB. 'generating' dikirim null
                // supaya UI menampilkan proses tanpa mengarang angka.
                'progress' => match ($document->study_pack_status) {
                    'ready' => 100,
                    'generating' => null,
                    default => 0,
                },
            ],
        ];
    }

    private function authorizeOwnership(Request $request, Document $document): void
    {
        abort_unless(
            $document->course && $document->course->user_id === $request->user()->id,
            403
        );
    }
}
