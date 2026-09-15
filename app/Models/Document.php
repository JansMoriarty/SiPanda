<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_filename',
        'stored_filename',
        'file_type',
        'file_size',
        'subject',
        'status',
    ];

    public function chunks()
    {
        return $this->hasMany(Chunk::class);
    }
}
