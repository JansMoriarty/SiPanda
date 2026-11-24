<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Concept extends Model
{
    protected $fillable = [
        'document_id',
        'level_id',
        'name',
        'description',
        'importance',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(StudyLevel::class, 'level_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function flashcards(): HasMany
    {
        return $this->hasMany(Flashcard::class)->orderBy('sort_order');
    }
}
