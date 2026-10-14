<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'original_filename',
        'stored_filename',
        'file_type',
        'file_size',
        'subject',
        'status',
        'summary',
        'key_points',
        'page_count',
        'error_message',
        'processed_at',
        'study_pack_status',
        'study_pack_generated_at',
    ];

    protected $casts = [
        'key_points' => 'array',
        'processed_at' => 'datetime',
        'study_pack_generated_at' => 'datetime',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(Chunk::class);
    }

    public function concepts(): HasMany
    {
        return $this->hasMany(Concept::class)->orderBy('sort_order');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}