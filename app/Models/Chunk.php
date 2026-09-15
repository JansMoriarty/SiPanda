<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chunk extends Model
{
    protected $fillable = [
        'document_id',
        'content',
        'embedding',
        'source_location',
        'chunk_index',
    ];

    protected $casts = [
        'embedding' => 'array',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}