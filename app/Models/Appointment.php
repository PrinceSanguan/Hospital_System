<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'assigned_doctor_id',
        'appointment_date',
        'status',
        'reason',
        'notes',
        'fee',
        'details',
        'record_type',
        'reference_number'
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'fee' => 'decimal:2',
        'details' => 'array'
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }

    public function assignedDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_doctor_id');
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }
}
