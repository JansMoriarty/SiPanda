<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudyLevel extends Model
{
    protected $fillable = [
        'document_id',
        'level_number',
        'title',
        'summary',
        'key_points',
        'sort_order',
    ];

    protected $casts = [
        'level_number' => 'integer',
        'key_points' => 'array',
        'sort_order' => 'integer',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function concepts(): HasMany
    {
        return $this->hasMany(Concept::class, 'level_id')->orderBy('sort_order');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'level_id');
    }

    public function flashcards(): HasMany
    {
        return $this->hasMany(Flashcard::class, 'level_id')->orderBy('sort_order');
    }

    public function xpClaims(): HasMany
    {
        return $this->hasMany(XpClaim::class, 'level_id');
    }
}
