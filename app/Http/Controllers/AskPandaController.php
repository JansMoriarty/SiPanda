<?php

namespace App\Http\Controllers;

use App\Services\GeminiClient;
use App\Services\RetrievalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AskPandaController extends Controller
{
    public function index()
    {
        return Inertia::render('AskPanda/Index');
    }

    public function ask(Request $request, RetrievalService $retrieval, GeminiClient $gemini)
    {
        $request->validate([
            'question' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $question = $request->input('question');
        $history = $request->input('history', []);

        $chunks = $retrieval->search($question, $request->user()->id);

        $grouped = collect($chunks)->groupBy(fn($item) => $item['chunk']->document_id);
        $sources = $grouped->map(function ($items) {
            $firstChunk = $items->first()['chunk'];
            return [
                'document_id' => $firstChunk->document_id,
                'document' => $firstChunk->document->original_filename,
                'locations' => $items->pluck('chunk.source_location')->filter()->unique()->values()->all(),
            ];
        })->values();

        return response()->stream(function () use ($gemini, $question, $chunks, $history, $sources) {
            echo "data: " . json_encode(['type' => 'sources', 'data' => $sources]) . "\n\n";
            ob_flush();
            flush();

            try {
                $gemini->generateStreamAnswer($question, $chunks, $history, function ($chunkText) {
                    echo "data: " . json_encode(['type' => 'text', 'data' => $chunkText]) . "\n\n";
                    ob_flush();
                    flush();
                });
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