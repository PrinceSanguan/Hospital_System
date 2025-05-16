<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prescription extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'record_id',
        'doctor_id',
        'medication',
        'dosage',
        'frequency',
        'duration',
        'instructions',
        'prescription_date',
        'reference_number',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'prescription_date' => 'date',
    ];

    /**
     * Get the patient that owns the prescription.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor that issued the prescription.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the medical record associated with the prescription.
     */
    public function record(): BelongsTo
    {
        return $this->belongsTo(PatientRecord::class, 'record_id');
    }

    /**
     * Generate a unique reference number for the prescription.
     */
    public static function generateReferenceNumber(): string
    {
        $prefix = 'RX';
        $year = date('y');
        $month = date('m');
        $day = date('d');
        $random = mt_rand(1000, 9999);

        return "{$prefix}-{$year}{$month}{$day}-{$random}";
    }
}
