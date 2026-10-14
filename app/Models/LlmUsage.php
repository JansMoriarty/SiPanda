<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LlmUsage extends Model
{
    public const FEATURE_STUDY_PACK = 'study_pack';

    public const FEATURE_ASK_PANDA = 'ask_panda';

    protected $fillable = [
        'user_id',
        'document_id',
        'feature',
        'provider',
        'model',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'successful',
        'error',
    ];

    protected $casts = [
        'prompt_tokens' => 'integer',
        'completion_tokens' => 'integer',
        'total_tokens' => 'integer',
        'successful' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
