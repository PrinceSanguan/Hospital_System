<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientRecord extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Record type constants
     */
    const TYPE_MEDICAL_CHECKUP = 'medical_checkup';
    const TYPE_LABORATORY = 'laboratory';
    const TYPE_MEDICAL_RECORD = 'medical_record';

    /**
     * Status constants
     */
    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'assigned_doctor_id',
        'record_type',
        'status',
        'appointment_date',
        'details',
        'lab_results',
        'vital_signs',
        'prescriptions',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'appointment_date' => 'datetime',
        'lab_results' => 'array',
        'vital_signs' => 'array',
        'prescriptions' => 'array',
    ];

    /**
     * Get the patient associated with the record.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor associated with the record.
     */
    public function assignedDoctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_doctor_id');
    }
}
