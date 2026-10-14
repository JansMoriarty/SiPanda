<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Study Pack
    |--------------------------------------------------------------------------
    |
    | Batas-batas untuk generator Study Pack (summary, key points, konsep,
    | soal). Semua bisa di-override lewat .env tanpa ubah kode. max_input_chars
    | membatasi teks dokumen yang dikirim ke LLM agar tidak melebihi konteks
    | dan mengontrol biaya token.
    |
    */

    'study_pack' => [
        'max_input_chars' => (int) env('STUDY_PACK_MAX_INPUT_CHARS', 20000),
        'max_concepts' => (int) env('STUDY_PACK_MAX_CONCEPTS', 8),
        'questions_per_concept' => (int) env('STUDY_PACK_QUESTIONS_PER_CONCEPT', 2),
        'options_count' => (int) env('STUDY_PACK_OPTIONS_COUNT', 4),
    ],

    'quiz' => [
        'passing_score' => (int) env('QUIZ_PASSING_SCORE', 70),
        'questions_per_session' => (int) env('QUIZ_QUESTIONS_PER_SESSION', 10),
        'time_limit_minutes' => (int) env('QUIZ_TIME_LIMIT_MINUTES', 10),
    ],

];
