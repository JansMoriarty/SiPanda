<?php

namespace App\Services\StudyPack;

use App\Contracts\LlmClient;
use App\Models\Concept;
use App\Models\Document;
use App\Models\LlmUsage;
use App\Models\Question;
use App\Services\Llm\LlmUsageRecorder;
use Illuminate\Support\Collection;

/**
 * Menghasilkan Study Pack sebuah dokumen dengan memanggil LLM secara bertahap:
 * 1) summary + key points, 2) daftar konsep, 3) soal per konsep.
 *
 * Idempoten & bisa lanjut: tahap yang datanya sudah ada dilewati, dan soal
 * hanya dibuat untuk konsep yang belum punya soal. Jadi retry tidak
 * menggandakan data dan tidak membuang token untuk yang sudah selesai.
 */
class StudyPackGenerator
{
    public function __construct(protected LlmClient $llm, protected LlmUsageRecorder $usage) {}

    public function generate(Document $document): void
    {
        // Kepemilikan dokumen lewat course (documents tidak punya user_id),
        // supaya pemakaian token bisa diatribusikan ke mahasiswa pemiliknya.
        $ownerId = $document->course()->value('user_id');

        $this->usage->run(
            is_numeric($ownerId) ? (int) $ownerId : null,
            LlmUsage::FEATURE_STUDY_PACK,
            fn () => $this->generateWithLlm($document),
            $document->id,
        );
    }

    protected function generateWithLlm(Document $document): void
    {
        $document->update(['study_pack_status' => 'generating', 'error_message' => null]);

        try {
            $text = $this->sourceText($document);

            $this->generateSummaryAndKeyPoints($document, $text);
            $concepts = $this->generateConcepts($document, $text);
            $this->generateQuestions($document, $concepts, $text);

            $document->update([
                'study_pack_status' => 'ready',
                'study_pack_generated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $document->update([
                'study_pack_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function sourceText(Document $document): string
    {
        $text = $document->chunks()
            ->orderBy('chunk_index')
            ->pluck('content')
            ->implode("\n\n");

        if (trim($text) === '') {
            throw new \RuntimeException('Dokumen belum memiliki teks (chunk). Jalankan ingest dulu.');
        }

        return mb_substr($text, 0, (int) config('sipanda.study_pack.max_input_chars', 20000));
    }

    protected function generateSummaryAndKeyPoints(Document $document, string $text): void
    {
        if (! empty($document->summary) && ! empty($document->key_points)) {
            return;
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'summary' => ['type' => 'STRING'],
                'key_points' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
            ],
            'required' => ['summary', 'key_points'],
        ];

        $result = $this->llm->generateJson(
            $this->summaryPrompt($text),
            $schema,
            $this->systemInstruction()
        );

        $summary = trim((string) ($result['summary'] ?? ''));
        $keyPoints = $this->cleanStringList((array) ($result['key_points'] ?? []));

        $document->update([
            'summary' => $summary !== '' ? $summary : $document->summary,
            'key_points' => $keyPoints !== [] ? $keyPoints : $document->key_points,
        ]);
    }

    /**
     * @return Collection<int, Concept>
     */
    protected function generateConcepts(Document $document, string $text): Collection
    {
        if ($document->concepts()->exists()) {
            return $document->concepts()->get();
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'concepts' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'name' => ['type' => 'STRING'],
                            'description' => ['type' => 'STRING'],
                            'importance' => ['type' => 'STRING', 'enum' => ['high', 'medium', 'low']],
                        ],
                        'required' => ['name', 'description', 'importance'],
                    ],
                ],
            ],
            'required' => ['concepts'],
        ];

        $result = $this->llm->generateJson(
            $this->conceptsPrompt($text, (int) config('sipanda.study_pack.max_concepts', 8)),
            $schema,
            $this->systemInstruction()
        );

        $max = (int) config('sipanda.study_pack.max_concepts', 8);
        $rows = array_slice((array) ($result['concepts'] ?? []), 0, $max);

        foreach ($rows as $index => $row) {
            $name = trim((string) ($row['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            $importance = in_array($row['importance'] ?? 'medium', ['high', 'medium', 'low'], true)
                ? $row['importance']
                : 'medium';

            Concept::updateOrCreate(
                ['document_id' => $document->id, 'name' => $name],
                [
                    'description' => trim((string) ($row['description'] ?? '')) ?: null,
                    'importance' => $importance,
                    'sort_order' => $index,
                ]
            );
        }

        return $document->concepts()->get();
    }

    /**
     * @param  Collection<int, Concept>  $concepts
     */
    protected function generateQuestions(Document $document, Collection $concepts, string $text): void
    {
        $perConcept = (int) config('sipanda.study_pack.questions_per_concept', 2);
        $optionsCount = (int) config('sipanda.study_pack.options_count', 4);

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'questions' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'question' => ['type' => 'STRING'],
                            'options' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                            'correct_index' => ['type' => 'INTEGER'],
                            'explanation' => ['type' => 'STRING'],
                            'source_label' => ['type' => 'STRING'],
                        ],
                        'required' => ['question', 'options', 'correct_index', 'explanation'],
                    ],
                ],
            ],
            'required' => ['questions'],
        ];

        foreach ($concepts as $concept) {
            if ($concept->questions()->exists()) {
                continue;
            }

            $result = $this->llm->generateJson(
                $this->questionsPrompt($concept->name, $perConcept, $optionsCount, $text),
                $schema,
                $this->systemInstruction()
            );

            $rows = array_slice((array) ($result['questions'] ?? []), 0, $perConcept);

            foreach ($rows as $row) {
                $question = trim((string) ($row['question'] ?? ''));
                $options = $this->cleanStringList((array) ($row['options'] ?? []));
                $correctIndex = (int) ($row['correct_index'] ?? 0);

                if ($question === '' || count($options) < 2) {
                    continue;
                }

                if ($correctIndex < 0 || $correctIndex >= count($options)) {
                    continue;
                }

                Question::create([
                    'document_id' => $document->id,
                    'concept_id' => $concept->id,
                    'question' => $question,
                    'options' => $options,
                    'correct_index' => $correctIndex,
                    'explanation' => trim((string) ($row['explanation'] ?? '')) ?: null,
                    'source_label' => trim((string) ($row['source_label'] ?? '')) ?: null,
                ]);
            }
        }
    }

    /**
     * @param  array<int, mixed>  $values
     * @return array<int, string>
     */
    protected function cleanStringList(array $values): array
    {
        return array_values(array_filter(
            array_map(fn ($value) => trim((string) $value), $values),
            fn ($value) => $value !== ''
        ));
    }

    protected function systemInstruction(): string
    {
        return 'Kamu membantu mahasiswa belajar. Balas HANYA JSON valid sesuai skema, '
            . 'tanpa penjelasan tambahan, dan jangan mengarang di luar materi yang diberikan.';
    }

    protected function summaryPrompt(string $text): string
    {
        return "TUGAS_RINGKASAN\nBuat ringkasan singkat (2-4 paragraf) dan 3-6 key points dari materi berikut.\n\nMATERI:\n{$text}";
    }

    protected function conceptsPrompt(string $text, int $max): string
    {
        return "TUGAS_KONSEP\nAmbil maksimal {$max} konsep penting dari materi berikut. "
            . "Untuk setiap konsep isi name, description singkat, dan importance (high/medium/low).\n\nMATERI:\n{$text}";
    }

    protected function questionsPrompt(string $concept, int $count, int $optionsCount, string $text): string
    {
        return "TUGAS_SOAL\nBuat {$count} soal pilihan ganda tentang konsep \"{$concept}\" "
            . "berdasarkan materi. Setiap soal punya {$optionsCount} opsi, correct_index (0-based), "
            . "explanation, dan source_label bila ada.\n\nMATERI:\n{$text}";
    }
}
