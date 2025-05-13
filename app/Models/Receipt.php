<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_number',
        'patient_id',
        'appointment_id',
        'amount',
        'payment_method',
        'payment_date',
        'description',
        'status',
        'created_by',
        'items'
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'amount' => 'decimal:2'
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateReceiptNumber(): string
    {
        $prefix = 'RCPT-';
        $uniqueId = strtoupper(Str::random(8));
        $date = now()->format('Ymd');

        return $prefix . $date . '-' . $uniqueId;
    }
}
