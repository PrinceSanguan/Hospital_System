<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reference_number',
        'name',
        'date_of_birth',
        'gender',
        'contact_number',
        'address',
        'profile_image'
    ];

    protected $casts = [
        'date_of_birth' => 'date'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function labResults(): HasMany
    {
        return $this->hasMany(LabResult::class);
    }
}
