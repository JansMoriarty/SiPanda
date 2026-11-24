<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class XpClaim extends Model
{
    protected $fillable = [
        'user_id',
        'level_id',
        'points',
        'claimed_at',
    ];

    protected $casts = [
        'points' => 'integer',
        'claimed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(StudyLevel::class, 'level_id');
    }
}
