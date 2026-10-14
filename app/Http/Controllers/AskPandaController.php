<?php

namespace App\Http\Controllers;

use App\Contracts\LlmClient;
use App\Models\Document;
use App\Models\LlmUsage;
use App\Services\Llm\LlmUsageRecorder;
use App\Services\RetrievalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AskPandaController extends Controller
{
    public function index(Request $request)
    {
        // Daftar modul di sidebar Ask PANDA. Sama seperti Materials: di-scope
        // lewat course.user_id karena documents tidak punya user_id sendiri.
        $documents = Document::query()
            ->whereHas('course', fn ($query) => $query->where('user_id', $request->user()->id))
            ->with('course:id,user_id,name,color')
            ->latest()
            ->get(['id', 'course_id', 'original_filename', 'file_type']);

        return Inertia::render('AskPanda/Index', [
            'materials' => $documents->map(fn (Document $document) => [
                'id' => $document->id,
                'title' => $document->original_filename,
                'file_type' => $document->file_type,
                'course' => [
                    'id' => $document->course?->id,
                    'name' => $document->course?->name,
                    'color' => $document->course?->color,
                ],
            ])->values(),
        ]);
    }

    public function ask(Request $request, RetrievalService $retrieval, LlmClient $llm)
    {
        $request->validate([
            'question' => 'required|string|max:1000',
            'history' => 'nullable|array',
            'document_id' => 'nullable|integer',
            'allow_general' => 'nullable|boolean',
        ]);

        $question = $request->input('question');
        $history = $request->input('history', []);
        $userId = $request->user()->id;

        // Mode terkunci (dibuka dari Study Pack): pencarian dibatasi ke satu
        // dokumen dan LLM diberi instruksi menolak pertanyaan di luar modul.
        $scopeDocument = null;
        $scopeInstruction = null;

        if ($request->filled('document_id')) {
            $scopeDocument = Document::query()
                ->whereKey($request->integer('document_id'))
                ->whereHas('course', fn ($q) => $q->where('user_id', $userId))
                ->first();

            abort_if($scopeDocument === null, 403, 'Dokumen tidak ditemukan atau bukan milikmu.');

            $moduleTitle = $scopeDocument->original_filename;

            $scopeInstruction = <<<TXT
PENTING — MODE MODUL TERKUNCI:
Pertanyaan ini datang dari Study Pack modul "{$moduleTitle}".
Jawab HANYA berdasarkan materi (CONTEXT) modul tersebut di atas.
Kalau pertanyaan TIDAK berkaitan dengan modul ini atau bersifat umum (misalnya resep donat, berita, olahraga, urusan pribadi), TOLAK dengan sopan: katakan bahwa kamu sedang membahas modul ini saja, lalu ajak pengguna bertanya seputar modul tersebut. Jangan menjawab pertanyaan yang di luar modul.
TXT;
        }

        $chunks = $retrieval->search($question, $userId, 3, 0.65, $scopeDocument?->id);

        // Mode bebas: kalau tidak ada materi relevan sama sekali, tawarkan dulu
        // apakah PANDA boleh menjawab dengan pengetahuan umum (opsi gaya Claude).
        // Kalau pengguna setuju, frontend mengirim ulang dengan allow_general=true.
        $hasContext = count($chunks) > 0;
        $allowGeneral = $request->boolean('allow_general');
        $needsGeneralConfirm = $scopeDocument === null
            && ! $hasContext
            && ! $allowGeneral
            && mb_strlen(trim($question)) >= 12;

        if ($scopeDocument === null && $allowGeneral && ! $hasContext) {
            $scopeInstruction = 'Tidak ada materi kuliah yang relevan dengan pertanyaan ini. Jawab dengan pengetahuan umummu secara akurat dan ramah, serta sebutkan secukupnya bahwa jawaban ini TIDAK bersumber dari materi yang diunggah.';
        }

        $grouped = collect($chunks)->groupBy(fn($item) => $item['chunk']->document_id);
        $sources = $grouped->map(function ($items) {
            $firstChunk = $items->first()['chunk'];
            return [
                'document_id' => $firstChunk->document_id,
                'document' => $firstChunk->document->original_filename,
                'locations' => $items->pluck('chunk.source_location')->filter()->unique()->values()->all(),
            ];
        })->values();

        $scope = $scopeDocument === null ? null : [
            'document_id' => $scopeDocument->id,
            'document' => $scopeDocument->original_filename,
        ];

        return response()->stream(function () use ($llm, $question, $chunks, $history, $sources, $userId, $scope, $scopeInstruction, $needsGeneralConfirm) {
            if ($needsGeneralConfirm) {
                echo "data: " . json_encode(['type' => 'no_context', 'data' => ['question' => $question]]) . "\n\n";
                ob_flush();
                flush();

                echo "data: [DONE]\n\n";
                ob_flush();
                flush();

                return;
            }

            if ($scope !== null) {
                echo "data: " . json_encode(['type' => 'scope', 'data' => $scope]) . "\n\n";
                ob_flush();
                flush();
            }

            echo "data: " . json_encode(['type' => 'sources', 'data' => $sources]) . "\n\n";
            ob_flush();
            flush();

            try {
                app(LlmUsageRecorder::class)->run(
                    $userId,
                    LlmUsage::FEATURE_ASK_PANDA,
                    fn () => $llm->generateStreamAnswer($question, $chunks, $history, function ($chunkText) {
                        echo "data: " . json_encode(['type' => 'text', 'data' => $chunkText]) . "\n\n";
                        ob_flush();
                        flush();
                    }, $scopeInstruction),
                );
            } catch (\Throwable $e) {
                $isRateLimit = $e->getCode() === 429;

                $errorMessage = $isRateLimit
                    ? 'Kamu sudah mencapai batas pesan harian untuk Ask PANDA. Coba lagi besok, atau hubungi admin untuk menaikkan kuota.'
                    : 'Terjadi kesalahan pada server. Coba lagi dalam beberapa saat.';

                echo "data: " . json_encode([
                    'type' => 'error',
                    'rate_limited' => $isRateLimit,
                    'message' => $errorMessage,
                ]) . "\n\n";
                ob_flush();
                flush();
            }

            echo "data: [DONE]\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}