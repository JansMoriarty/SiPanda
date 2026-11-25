<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Study Pack
    |--------------------------------------------------------------------------
    |
    | Batas-batas untuk generator Study Pack (summary, level, konsep, soal,
    | flashcard). Semua bisa di-override lewat .env tanpa ubah kode. max_input_chars
    | membatasi teks dokumen yang dikirim ke LLM agar tidak melebihi konteks
    | dan mengontrol biaya token.
    |
    */

    'study_pack' => [
        'max_input_chars' => (int) env('STUDY_PACK_MAX_INPUT_CHARS', 20000),
        'max_concepts' => (int) env('STUDY_PACK_MAX_CONCEPTS', 8),
        'max_levels' => (int) env('STUDY_PACK_MAX_LEVELS', 3),
        'concepts_per_level' => (int) env('STUDY_PACK_CONCEPTS_PER_LEVEL', 3),
        'questions_per_concept' => (int) env('STUDY_PACK_QUESTIONS_PER_CONCEPT', 2),
        'options_count' => (int) env('STUDY_PACK_OPTIONS_COUNT', 4),
        'flashcards_per_concept' => (int) env('STUDY_PACK_FLASHCARDS_PER_CONCEPT', 3),
    ],

    'quiz' => [
        'passing_score' => (int) env('QUIZ_PASSING_SCORE', 70),
        'questions_per_session' => (int) env('QUIZ_QUESTIONS_PER_SESSION', 10),
        'time_limit_minutes' => (int) env('QUIZ_TIME_LIMIT_MINUTES', 10),
    ],

    'xp' => [
        'per_quiz' => (int) env('XP_PER_QUIZ', 10),
        'per_level' => (int) env('XP_PER_LEVEL', 5),
        'per_claim' => (int) env('XP_PER_CLAIM', 50),
        'tiers' => [
            ['id' => 'pemula', 'label' => 'Pemula', 'min' => 0, 'color' => '#94A3B8', 'reward' => 'Paket Avatar Notionists (4)', 'avatar_pack' => 'pemula'],
            ['id' => 'ambisius', 'label' => 'Ambisius', 'min' => 100, 'color' => '#465FFF', 'reward' => 'Paket Avatar Critters (6)', 'avatar_pack' => 'ambisius'],
            ['id' => 'pakar', 'label' => 'Pakar', 'min' => 300, 'color' => '#F5A524', 'reward' => 'Paket Avatar Personas (8)', 'avatar_pack' => 'pakar'],
            ['id' => 'maestro', 'label' => 'Maestro', 'min' => 600, 'color' => '#8B5CF6', 'reward' => 'Paket Avatar Pixel Art (8)', 'avatar_pack' => 'maestro'],
            ['id' => 'legenda', 'label' => 'Legenda', 'min' => 1000, 'color' => '#EF4444', 'reward' => 'Paket Avatar Adventurer (12)', 'avatar_pack' => 'legenda'],
        ],
    ],

    'avatar_packs' => [
        'api_base' => env('DICEBEAR_API_BASE', 'https://api.dicebear.com/10.x'),
        'packs' => [
            'pemula' => [
                'id' => 'pemula',
                'label' => 'Pack Notionists',
                'style' => 'notionists',
                'count' => 4,
                'backgrounds' => ['b6e3f4', 'fcd0a1', 'd1f4c9', 'e9d5ff'],
            ],
            'ambisius' => [
                'id' => 'ambisius',
                'label' => 'Pack Hewan Critters',
                'style' => 'critters',
                'count' => 6,
                'backgrounds' => ['b6e3f4', 'fcd0a1', 'd1f4c9', 'e9d5ff', 'ffd6e0', 'c7d2fe'],
            ],
            'pakar' => [
                'id' => 'pakar',
                'label' => 'Pack Flat Design Personas',
                'style' => 'personas',
                'count' => 8,
                'backgrounds' => ['b6e3f4', 'fcd0a1', 'd1f4c9', 'e9d5ff', 'ffd6e0', 'c7d2fe', 'fef3c7', 'dbeafe'],
            ],
            'maestro' => [
                'id' => 'maestro',
                'label' => 'Pack Pixel Art',
                'style' => 'pixel-art',
                'count' => 8,
                'backgrounds' => ['b6e3f4', 'fcd0a1', 'd1f4c9', 'e9d5ff', 'ffd6e0', 'c7d2fe', 'fef3c7', 'dbeafe'],
            ],
            'legenda' => [
                'id' => 'legenda',
                'label' => 'Pack Petualang',
                'style' => 'adventurer',
                'count' => 12,
                'backgrounds' => ['b6e3f4', 'fcd0a1', 'd1f4c9', 'e9d5ff', 'ffd6e0', 'c7d2fe', 'fef3c7', 'dbeafe', 'fce7f3', 'ccfbf1', 'ede9fe', 'e2e8f0'],
            ],
        ],
    ],

];
