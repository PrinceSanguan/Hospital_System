<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorSchedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'doctor_id',
        'staff_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_available',
        'max_appointments',
        'specific_date',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_available' => 'boolean',
        'specific_date' => 'date',
    ];

    /**
     * Get the doctor that owns the schedule.
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the staff member associated with this schedule.
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
    
    /**
     * Get the appointments for this schedule time slot.
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'schedule_id');
    }

    /**
     * Scope a query to only include schedules for a specific day of the week.
     */
    public function scopeDayOfWeek($query, $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    /**
     * Scope a query to only include available schedules.
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Check if the schedule is fully booked.
     *
     * @return bool
     */
    public function isFullyBooked()
    {
        return $this->appointments()->count() >= $this->max_appointments;
    }

    /**
     * Get the number of available slots in this schedule.
     *
     * @return int
     */
    public function getAvailableSlotsCount()
    {
        if (!$this->is_available) {
            return 0;
        }
        
        $bookedAppointments = $this->appointments()->count();
        return max(0, $this->max_appointments - $bookedAppointments);
    }
}
