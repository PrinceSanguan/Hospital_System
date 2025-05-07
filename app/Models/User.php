<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    // User role constants
    const ROLE_PATIENT = 'patient';
    const ROLE_CLINICAL_STAFF = 'clinical_staff';
    const ROLE_DOCTOR = 'doctor';
    const ROLE_ADMIN = 'admin';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'user_role',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if the user is an admin
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->user_role === self::ROLE_ADMIN;
    }

    /**
     * Check if the user is a doctor
     *
     * @return bool
     */
    public function isDoctor(): bool
    {
        return $this->user_role === self::ROLE_DOCTOR;
    }

    /**
     * Check if the user is a clinical staff
     *
     * @return bool
     */
    public function isClinicalStaff(): bool
    {
        return $this->user_role === self::ROLE_CLINICAL_STAFF;
    }

    /**
     * Check if the user is a patient
     *
     * @return bool
     */
    public function isPatient(): bool
    {
        return $this->user_role === self::ROLE_PATIENT;
    }

    /**
     * Get the patient records associated with this user.
     */
    public function patientRecords(): HasMany
    {
        return $this->hasMany(PatientRecord::class, 'patient_id');
    }

    /**
     * Get records where this user is the assigned doctor.
     */
    public function assignedPatientRecords(): HasMany
    {
        return $this->hasMany(PatientRecord::class, 'assigned_doctor_id');
    }

    /**
     * Get the doctor schedules associated with this user.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_id');
    }

    /**
     * Get the doctor services associated with this user.
     */
    public function services(): HasMany
    {
        return $this->hasMany(DoctorService::class, 'doctor_id');
    }

    /**
     * Get the record requests made by this patient.
     */
    public function recordRequests(): HasMany
    {
        return $this->hasMany(RecordRequest::class, 'patient_id');
    }

    /**
     * Get the record requests approved by this staff.
     */
    public function approvedRequests(): HasMany
    {
        return $this->hasMany(RecordRequest::class, 'approved_by');
    }

    /**
     * Get the doctor profile associated with this user.
     */
    public function doctorProfile(): HasOne
    {
        return $this->hasOne(DoctorProfile::class, 'doctor_id');
    }
}
