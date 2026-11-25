<?php

namespace App\Services\StudyPack;

use App\Contracts\LlmClient;
use App\Models\Concept;
use App\Models\Document;
use App\Models\Flashcard;
use App\Models\LlmUsage;
use App\Models\Question;
use App\Models\StudyLevel;
use App\Services\Llm\LlmRateLimit;
use App\Services\Llm\LlmUsageRecorder;
use Illuminate\Support\Collection;

class StudyPackGenerator
{
    public function __construct(protected LlmClient $llm, protected LlmUsageRecorder $usage) {}

    public function generate(Document $document): void
    {
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
        $document->update([
            'study_pack_status' => 'generating',
            'study_pack_progress' => 5,
            'study_pack_step' => 'outline',
            'error_message' => null,
        ]);

        try {
            $text = $this->sourceText($document);

            $outline = $this->generateOutline($document, $text);
            $this->progress($document, 'questions', 35);

            $this->generateQuestions($document, $outline, $text);
            $this->progress($document, 'flashcards', 75);

            $this->generateFlashcards($document, $outline, $text);

            $document->update([
                'study_pack_status' => 'ready',
                'study_pack_progress' => 100,
                'study_pack_step' => 'done',
                'study_pack_generated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $document->update([
                'study_pack_status' => 'failed',
                'error_message' => LlmRateLimit::is($e) ? LlmRateLimit::MESSAGE : $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function progress(Document $document, string $step, int $percent): void
    {
        $document->update([
            'study_pack_progress' => max(0, min(99, $percent)),
            'study_pack_step' => $step,
        ]);
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

    protected function outlineExists(Document $document): bool
    {
        return ! empty($document->summary)
            && ! empty($document->key_points)
            && $document->studyLevels()->exists()
            && $document->concepts()->exists();
    }

    protected function generateOutline(Document $document, string $text): Collection
    {
        if ($this->outlineExists($document)) {
            return $document->studyLevels()->with('concepts')->get()->map(fn ($level) => [
                'number' => (int) $level->level_number,
                'title' => $level->title,
                'summary' => $level->summary,
                'key_points' => $level->key_points ?? [],
                'concepts' => $level->concepts->map(fn ($concept) => [
                    'id' => $concept->id,
                    'name' => $concept->name,
                    'description' => $concept->description,
                    'importance' => $concept->importance,
                ])->values()->all(),
            ]);
        }

        $maxLevels = max(1, (int) config('sipanda.study_pack.max_levels', 3));
        $perLevel = max(1, (int) config('sipanda.study_pack.concepts_per_level', 3));
        $maxConcepts = max(1, (int) config('sipanda.study_pack.max_concepts', 8));

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'summary' => ['type' => 'STRING'],
                'key_points' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                'levels' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'title' => ['type' => 'STRING'],
                            'summary' => ['type' => 'STRING'],
                            'key_points' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
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
                        'required' => ['title', 'summary', 'key_points', 'concepts'],
                    ],
                ],
            ],
            'required' => ['summary', 'key_points', 'levels'],
        ];

        $result = $this->llm->generateJson(
            $this->outlinePrompt($text, $maxLevels, $perLevel, $maxConcepts),
            $schema,
            $this->systemInstruction()
        );

        $summary = trim((string) ($result['summary'] ?? ''));
        $keyPoints = $this->cleanStringList((array) ($result['key_points'] ?? []));

        $document->update([
            'summary' => $summary !== '' ? $summary : $document->summary,
            'key_points' => $keyPoints !== [] ? $keyPoints : $document->key_points,
        ]);

        $seen = [];
        $total = 0;
        $outline = collect();
        $rawLevels = array_slice((array) ($result['levels'] ?? []), 0, $maxLevels);

        foreach ($rawLevels as $index => $row) {
            if ($total >= $maxConcepts) {
                break;
            }

            $level = StudyLevel::updateOrCreate(
                ['document_id' => $document->id, 'level_number' => $index + 1],
                [
                    'title' => trim((string) ($row['title'] ?? '')) ?: 'Level '.($index + 1),
                    'summary' => trim((string) ($row['summary'] ?? '')) ?: null,
                    'key_points' => $this->cleanStringList((array) ($row['key_points'] ?? [])),
                    'sort_order' => $index,
                ]
            );

            $concepts = collect();

            foreach (array_slice((array) ($row['concepts'] ?? []), 0, $perLevel) as $conceptIndex => $conceptRow) {
                if ($total >= $maxConcepts) {
                    break;
                }

                $name = trim((string) ($conceptRow['name'] ?? ''));

                if ($name === '' || isset($seen[$name])) {
                    continue;
                }

                $seen[$name] = true;
                $total++;

                $importance = in_array($conceptRow['importance'] ?? 'medium', ['high', 'medium', 'low'], true)
                    ? $conceptRow['importance']
                    : 'medium';

                $concept = Concept::updateOrCreate(
                    ['document_id' => $document->id, 'name' => $name],
                    [
                        'level_id' => $level->id,
                        'description' => trim((string) ($conceptRow['description'] ?? '')) ?: null,
                        'importance' => $importance,
                        'sort_order' => $conceptIndex,
                    ]
                );

                $concepts->push([
                    'id' => $concept->id,
                    'name' => $concept->name,
                    'description' => $concept->description,
                    'importance' => $concept->importance,
                ]);
            }

            if ($concepts->isEmpty()) {
                $level->delete();

                continue;
            }

            $outline->push([
                'number' => (int) $level->level_number,
                'title' => $level->title,
                'summary' => $level->summary,
                'key_points' => $level->key_points ?? [],
                'concepts' => $concepts->all(),
            ]);
        }

        if ($outline->isEmpty()) {
            throw new \RuntimeException('LLM tidak menghasilkan level study pack yang valid.');
        }

        return $outline;
    }

    protected function generateQuestions(Document $document, Collection $outline, string $text): void
    {
        $perConcept = max(1, (int) config('sipanda.study_pack.questions_per_concept', 2));
        $optionsCount = max(2, (int) config('sipanda.study_pack.options_count', 4));

        $targets = $outline->flatMap(fn ($level) => collect($level['concepts'])->map(fn ($concept) => [
            'level' => (int) $level['number'],
            'concept' => $concept['name'],
            'id' => $concept['id'],
        ]))->filter(fn ($target) => ! Question::where('concept_id', $target['id'])->exists())->values();

        if ($targets->isEmpty()) {
            return;
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'questions' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'level' => ['type' => 'INTEGER'],
                            'concept' => ['type' => 'STRING'],
                            'question' => ['type' => 'STRING'],
                            'options' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
                            'correct_index' => ['type' => 'INTEGER'],
                            'explanation' => ['type' => 'STRING'],
                            'source_label' => ['type' => 'STRING'],
                        ],
                        'required' => ['level', 'concept', 'question', 'options', 'correct_index', 'explanation'],
                    ],
                ],
            ],
            'required' => ['questions'],
        ];

        $result = $this->llm->generateJson(
            $this->questionsPrompt($text, $targets, $perConcept, $optionsCount),
            $schema,
            $this->systemInstruction()
        );

        $levelIds = StudyLevel::where('document_id', $document->id)
            ->pluck('id', 'level_number');

        $targetByKey = $targets->keyBy(fn ($target) => $target['level'].'|'.$target['concept']);
        $counts = [];
        $limit = $targets->count() * $perConcept;

        foreach (array_slice((array) ($result['questions'] ?? []), 0, $limit) as $row) {
            $levelNumber = (int) ($row['level'] ?? 0);
            $conceptName = trim((string) ($row['concept'] ?? ''));
            $key = $levelNumber.'|'.$conceptName;
            $target = $targetByKey->get($key);

            if (! $target || ($counts[$key] ?? 0) >= $perConcept || ! $levelIds->has($levelNumber)) {
                continue;
            }

            $question = trim((string) ($row['question'] ?? ''));
            $options = $this->cleanStringList((array) ($row['options'] ?? []));
            $correctIndex = (int) ($row['correct_index'] ?? 0);

            if ($question === '' || count($options) < 2 || $correctIndex < 0 || $correctIndex >= count($options)) {
                continue;
            }

            Question::create([
                'document_id' => $document->id,
                'level_id' => $levelIds->get($levelNumber),
                'concept_id' => $target['id'],
                'question' => $question,
                'options' => $options,
                'correct_index' => $correctIndex,
                'explanation' => trim((string) ($row['explanation'] ?? '')) ?: null,
                'source_label' => trim((string) ($row['source_label'] ?? '')) ?: null,
            ]);

            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
    }

    protected function generateFlashcards(Document $document, Collection $outline, string $text): void
    {
        $perConcept = max(1, (int) config('sipanda.study_pack.flashcards_per_concept', 3));

        $targets = $outline->flatMap(fn ($level) => collect($level['concepts'])->map(fn ($concept) => [
            'level' => (int) $level['number'],
            'concept' => $concept['name'],
            'id' => $concept['id'],
        ]))->filter(fn ($target) => ! Flashcard::where('concept_id', $target['id'])->exists())->values();

        if ($targets->isEmpty()) {
            return;
        }

        $schema = [
            'type' => 'OBJECT',
            'properties' => [
                'flashcards' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'level' => ['type' => 'INTEGER'],
                            'concept' => ['type' => 'STRING'],
                            'front' => ['type' => 'STRING'],
                            'back' => ['type' => 'STRING'],
                        ],
                        'required' => ['level', 'concept', 'front', 'back'],
                    ],
                ],
            ],
            'required' => ['flashcards'],
        ];

        $result = $this->llm->generateJson(
            $this->flashcardsPrompt($text, $targets, $perConcept),
            $schema,
            $this->systemInstruction()
        );

        $levelIds = StudyLevel::where('document_id', $document->id)
            ->pluck('id', 'level_number');

        $targetByKey = $targets->keyBy(fn ($target) => $target['level'].'|'.$target['concept']);
        $counts = [];
        $limit = $targets->count() * $perConcept;

        foreach (array_slice((array) ($result['flashcards'] ?? []), 0, $limit) as $row) {
            $levelNumber = (int) ($row['level'] ?? 0);
            $conceptName = trim((string) ($row['concept'] ?? ''));
            $key = $levelNumber.'|'.$conceptName;
            $target = $targetByKey->get($key);

            if (! $target || ($counts[$key] ?? 0) >= $perConcept || ! $levelIds->has($levelNumber)) {
                continue;
            }

            $front = trim((string) ($row['front'] ?? ''));
            $back = trim((string) ($row['back'] ?? ''));

            if ($front === '' || $back === '') {
                continue;
            }

            Flashcard::create([
                'document_id' => $document->id,
                'level_id' => $levelIds->get($levelNumber),
                'concept_id' => $target['id'],
                'front' => $front,
                'back' => $back,
                'sort_order' => $counts[$key] ?? 0,
            ]);

            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
    }

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
            .'tanpa penjelasan tambahan, jangan mengarang di luar materi, '
            .'dan gunakan hanya nomor level serta nama konsep yang tercantum di prompt.';
    }

    protected function outlinePrompt(string $text, int $maxLevels, int $perLevel, int $maxConcepts): string
    {
        return "TUGAS_OUTLINE_LEVEL\nSusun study pack bertahap dari materi berikut. "
            ."Buat maksimal {$maxLevels} level, tiap level berisi {$perLevel} konsep, total maksimal {$maxConcepts} konsep. "
            .'Level harus berurutan dari yang paling dasar ke yang paling kompleks sesuai key point materi. '
            .'Tiap level wajib punya title, summary, key_points (3-5), dan concepts dengan name unik, description singkat, importance (high/medium/low). '
            ."Jangan mengulang nama konsep antar level.\n\nMATERI:\n{$text}";
    }

    protected function questionsPrompt(string $text, Collection $targets, int $perConcept, int $optionsCount): string
    {
        $lines = $targets
            ->map(fn ($target) => "Level {$target['level']} | {$target['concept']}")
            ->implode("\n");

        return "TUGAS_SOAL_LEVEL\nBuat {$perConcept} soal pilihan ganda untuk setiap target di bawah. "
            ."Setiap soal punya {$optionsCount} opsi, correct_index (0-based), explanation, dan source_label bila ada. "
            ."Pakai persis nilai level dan concept dari daftar target.\n\n"
            ."DAFTAR TARGET (level | konsep):\n{$lines}\n\nMATERI:\n{$text}";
    }

    protected function flashcardsPrompt(string $text, Collection $targets, int $perConcept): string
    {
        $lines = $targets
            ->map(fn ($target) => "Level {$target['level']} | {$target['concept']}")
            ->implode("\n");

        return "TUGAS_FLASHCARD_LEVEL\nBuat {$perConcept} kartu belajar untuk setiap target di bawah. "
            .'Setiap kartu punya front (istilah atau pertanyaan singkat) dan back (jawaban atau penjelasan singkat). '
            ."Pakai persis nilai level dan concept dari daftar target.\n\n"
            ."DAFTAR TARGET (level | konsep):\n{$lines}\n\nMATERI:\n{$text}";
    }
}
