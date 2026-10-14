<?php

/*
|--------------------------------------------------------------------------
| Model Gemini + fallback
|--------------------------------------------------------------------------
|
| Satu API key Gemini bisa dipakai beberapa model sekaligus. Kalau model
| utama balas 503 (high demand) / 429, LlmManager akan mencoba model berikut
| dalam daftar GEMINI_LLM_MODEL_FALLBACKS secara berurutan sebelum menyerah.
| Daftar ini diubah jadi provider terpisah (gemini_model_1, gemini_model_2,
| ...) supaya mekanisme fallback provider yang sudah ada tetap dipakai.
|
*/

$geminiApiKey = env('GEMINI_API_KEY');
$geminiModel = (string) env('GEMINI_LLM_MODEL', 'gemini-3.5-flash-lite');

$geminiFallbackModels = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('GEMINI_LLM_MODEL_FALLBACKS', 'gemini-flash-lite-latest,gemini-3.8-flash,gemini-flash-latest'))
)));

$providers = [
    'gemini' => [
        'driver' => 'gemini',
        'api_key' => $geminiApiKey,
        'model' => $geminiModel,
    ],
];

$modelFallbackNames = [];

foreach ($geminiFallbackModels as $index => $model) {
    if ($model === '' || $model === $geminiModel) {
        continue;
    }

    $name = 'gemini_model_' . ($index + 1);

    $providers[$name] = [
        'driver' => 'gemini',
        'api_key' => $geminiApiKey,
        'model' => $model,
    ];

    $modelFallbackNames[] = $name;
}

$envFallbacks = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('LLM_FALLBACKS', ''))
)));

return [

    /*
    |--------------------------------------------------------------------------
    | LLM Provider
    |--------------------------------------------------------------------------
    |
    | SiPanda memakai satu interface App\Contracts\LlmClient untuk semua
    | pemanggilan teks ke model bahasa. Provider default dipilih di sini dan
    | boleh punya daftar fallback yang dicoba berurutan saat provider utama
    | gagal (mis. rate limit / downtime).
    |
    */

    'default' => env('LLM_PROVIDER', 'gemini'),

    'fallbacks' => array_values(array_unique(array_merge($modelFallbackNames, $envFallbacks))),

    'providers' => $providers,

    /*
    |--------------------------------------------------------------------------
    | Retry per model
    |--------------------------------------------------------------------------
    |
    | Sebelum pindah ke model fallback, satu model dicoba ulang untuk error
    | transien (503/429/5xx). Setel LLM_RETRY_SLEEP_MS=0 di test agar cepat.
    |
    */

    'retry' => [
        'attempts' => (int) env('LLM_RETRY_ATTEMPTS', 2),
        'sleep_ms' => (int) env('LLM_RETRY_SLEEP_MS', 1500),
    ],

];
