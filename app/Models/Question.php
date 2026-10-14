<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'document_id',
        'concept_id',
        'question',
        'options',
        'correct_index',
        'explanation',
        'source_label',
    ];

    protected $casts = [
        'options' => 'array',
        'correct_index' => 'integer',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function concept(): BelongsTo
    {
        return $this->belongsTo(Concept::class);
    }

    public function attemptAnswers(): HasMany
    {
        return $this->hasMany(AttemptAnswer::class);
    }

    public function isCorrect(int $index): bool
    {
        return $index === $this->correct_index;
    }
}
