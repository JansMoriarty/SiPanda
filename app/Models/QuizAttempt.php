<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    protected $fillable = [
        'document_id',
        'user_id',
        'total_questions',
        'correct_answers',
        'score',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'total_questions' => 'integer',
        'correct_answers' => 'integer',
        'score' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AttemptAnswer::class);
    }
}
