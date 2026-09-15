<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiClient
{
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    public function embed(string $text, string $taskType = 'RETRIEVAL_DOCUMENT'): array
    {
        $response = Http::post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={$this->apiKey}",
            [
                'model' => 'models/gemini-embedding-001',
                'content' => [
                    'parts' => [
                        ['text' => $text],
                    ],
                ],
                'taskType' => $taskType,
                'outputDimensionality' => 768,
            ]
        );

        if ($response->failed()) {
            throw new \RuntimeException('Gemini Embedding API error: ' . $response->body());
        }

        return $response->json('embedding.values');
    }

    public static function cosineSimilarity(array $vecA, array $vecB): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($vecA as $i => $value) {
            $dotProduct += $value * $vecB[$i];
            $normA += $value ** 2;
            $normB += $vecB[$i] ** 2;
        }

        if ($normA == 0 || $normB == 0) {
            return 0.0;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }

    public function generateAnswer(string $question, array $chunks, array $history = []): array
    {
        $hasContext = !empty($chunks);

        $context = $hasContext
            ? collect($chunks)->map(function ($item) {
                $chunk = $item['chunk'];
                return "[{$chunk->source_location}]\n{$chunk->content}";
            })->implode("\n\n---\n\n")
            : '(Tidak ada materi yang relevan ditemukan untuk pertanyaan ini)';

        $systemPrompt = <<<PROMPT
Kamu adalah "Ask PANDA", asisten belajar yang ramah, santun, dan komunikatif untuk mahasiswa. Kamu membantu mahasiswa memahami materi kuliah yang sudah mereka upload.

CARA MERESPON & FORMAT TEKS:
1. Struktur teks jawaban HARUS rapi dan mudah dibaca:
   - Gunakan pemisah antar paragraf yang jelas (beri jarak/newline).
   - Gunakan format poin-poin (bullet points atau angka) saat menjelaskan rinci materi/beberapa opsi.
   - Gunakan penekanan cetak tebal (**teks**) pada istilah penting, kata kunci, atau inti penjelasan.
2. Kalau pesan mahasiswa cuma sapaan/basa-basi atau obrolan ringan yang tidak butuh materi kuliah — balas dengan ramah dan natural, sebutkan sekilas kamu siap membantu belajar dari materi mereka. Set "grounded": false.
3. Kalau pesannya pertanyaan tentang materi kuliah, TAPI informasinya TIDAK ada di context yang diberikan — jelaskan dengan ramah dan kata-katamu sendiri bahwa informasi tersebut belum ada di materi. Set "grounded": false.
4. Kalau pertanyaannya BISA dijawab dari context yang diberikan — jawab dengan jelas dan ramah, HANYA berdasarkan context tersebut. Set "grounded": true.
5. Gunakan riwayat percakapan sebelumnya (jika ada) untuk memahami konteks obrolan.
6. Kamu boleh proaktif: memberi semangat, menawarkan penjelasan lebih lanjut, atau bertanya balik topik apa yang ingin dibahas.

ATURAN PENTING: Untuk kasus 4, jawaban HARUS 100% berdasarkan context, tidak boleh mengarang.

Balas HANYA dalam format JSON valid seperti ini:
{"answer": "isi jawaban di sini", "grounded": true}
PROMPT;

        $contents = [];
        $lastRole = null;
        foreach (array_slice($history, -6) as $turn) {
            $role = ($turn['role'] === 'user') ? 'user' : 'model';
            $text = trim($turn['text'] ?? '');

            if ($text !== '' && $role !== $lastRole) {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $text]],
                ];
                $lastRole = $role;
            }
        }

        // Hapus elemen terakhir jika bernilai 'user' agar tidak bentrok dengan pertanyaan baru
        if ($lastRole === 'user') {
            array_pop($contents);
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [[
                'text' => "CONTEXT MATERI:\n{$context}\n\nPESAN MAHASISWA:\n{$question}",
            ]],
        ];

        $response = Http::timeout(60)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$this->apiKey}",
            [
                'systemInstruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseSchema' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'answer' => ['type' => 'STRING'],
                            'grounded' => ['type' => 'BOOLEAN'],
                        ],
                        'required' => ['answer', 'grounded'],
                    ],
                ],
            ]
        );

        if ($response->failed()) {
            throw new \RuntimeException('Gemini Generate API error: ' . $response->body());
        }

        $rawText = $response->json('candidates.0.content.parts.0.text') ?? '';

        Log::debug('Gemini raw response', [
            'rawText' => $rawText,
            'fullResponse' => $response->json(),
        ]);

        $decoded = json_decode($rawText, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $cleanText = preg_replace('/[\x00-\x1F\x7F]/u', '', $rawText);
            $decoded = json_decode($cleanText, true);
        }

        if (!is_array($decoded) || !isset($decoded['answer'])) {
            return [
                'answer' => !empty($rawText) ? trim($rawText) : 'Terjadi kesalahan saat memproses jawaban. Coba tanya ulang dengan kalimat lain.',
                'grounded' => false,
            ];
        }

        return [
            'answer' => $decoded['answer'],
            'grounded' => $decoded['grounded'] ?? false,
        ];
    }

    public function generateStreamAnswer(string $question, array $chunks, array $history, callable $onChunk): void
    {
        $hasContext = !empty($chunks);

        $context = $hasContext
            ? collect($chunks)->map(function ($item) {
                $chunk = $item['chunk'];
                return "[{$chunk->source_location}]\n{$chunk->content}";
            })->implode("\n\n---\n\n")
            : '(Tidak ada materi yang relevan ditemukan untuk pertanyaan ini)';

        $systemPrompt = <<<PROMPT
Kamu adalah "Ask PANDA", asisten belajar yang ramah, santun, dan komunikatif untuk mahasiswa. Kamu membantu mahasiswa memahami materi kuliah yang sudah mereka upload.

CARA MERESPON & FORMAT TEKS:
1. Struktur teks jawaban HARUS rapi dan mudah dibaca (gunakan paragraf & bold **teks** untuk poin penting).
2. Jawab secara langsung, jelas, dan santun berdasarkan konteks materi kuliah.
PROMPT;

        $contents = [];
        $lastRole = null;
        foreach (array_slice($history, -6) as $turn) {
            $role = ($turn['role'] === 'user') ? 'user' : 'model';
            $text = trim($turn['text'] ?? '');

            if ($text !== '' && $role !== $lastRole) {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $text]],
                ];
                $lastRole = $role;
            }
        }

        // Hapus elemen terakhir jika bernilai 'user' agar tidak bentrok dengan pertanyaan baru
        if ($lastRole === 'user') {
            array_pop($contents);
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [[
                'text' => "CONTEXT MATERI:\n{$context}\n\nPESAN MAHASISWA:\n{$question}",
            ]],
        ];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key={$this->apiKey}";

        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
        ];

        $buffer = '';
        $hasReceivedText = false;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_WRITEFUNCTION => function ($ch, $data) use ($onChunk, &$buffer, &$hasReceivedText) {
                $buffer .= $data;
                $lines = explode("\n", $buffer);
                $buffer = array_pop($lines);

                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line)) continue;

                    if (str_starts_with($line, 'data: ')) {
                        $jsonStr = substr($line, 6);
                        $json = json_decode($jsonStr, true);

                        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                        if ($text !== null && $text !== '') {
                            $hasReceivedText = true;
                            $onChunk($text);
                        }
                    } else {
                        $json = json_decode($line, true);
                        if (isset($json['error']['message'])) {
                            $hasReceivedText = true;
                            $onChunk("⚠️ Error Gemini API: " . $json['error']['message']);
                        }
                    }
                }
                return strlen($data);
            },
        ]);

        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if (!$hasReceivedText) {
            if ($curlErr) {
                throw new \RuntimeException('Kesalahan koneksi ke Gemini: ' . $curlErr, 500);
            } elseif ($httpCode === 429) {
                throw new \RuntimeException('Rate limit tercapai', 429);
            } elseif ($httpCode !== 200) {
                throw new \RuntimeException('Server Gemini merespon status HTTP ' . $httpCode, $httpCode);
            } else {
                throw new \RuntimeException('Tidak ada respons teks dari Gemini', 500);
            }
        }
    }
}
