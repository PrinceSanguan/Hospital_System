<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DoctorDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get count of patients assigned to this doctor
        $patientsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->distinct('patient_id')
            ->count('patient_id');

        // Get count of upcoming appointments - count both pending and confirmed
        $upcomingAppointmentsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->whereIn('status', [PatientRecord::STATUS_PENDING, 'confirmed'])
            ->where('appointment_date', '>=', now())
            ->count();

        // Get count of completed appointments
        $completedAppointmentsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->where('status', PatientRecord::STATUS_COMPLETED)
            ->count();

        // Get all upcoming appointments for the calendar - include both pending and confirmed
        $upcomingAppointments = PatientRecord::with('patient')
            ->where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->whereIn('status', [PatientRecord::STATUS_PENDING, 'confirmed'])
            ->where('appointment_date', '>=', now()->subDays(30))
            ->where('appointment_date', '<=', now()->addDays(60))
            ->orderBy('appointment_date', 'asc')
            ->get()
            ->map(function ($appointment) {
                // Extract appointment details from JSON field
                $details = [];
                if ($appointment->details) {
                    $details = is_string($appointment->details) ? json_decode($appointment->details, true) : $appointment->details;
                }

                return [
                    'id' => $appointment->id,
                    'patient' => [
                        'id' => $appointment->patient->id,
                        'name' => $appointment->patient->name,
                    ],
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $details['appointment_time'] ?? null,
                    'reason' => $details['reason'] ?? null,
                    'status' => $appointment->status,
                    'notes' => $details['notes'] ?? null,
                ];
            });

        return Inertia::render('Doctor/Dashboard', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'stats' => [
                'total_patients' => $patientsCount,
                'upcoming_appointments' => $upcomingAppointmentsCount,
                'completed_appointments' => $completedAppointmentsCount,
            ],
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }
}
