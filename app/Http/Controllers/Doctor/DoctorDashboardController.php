<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
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

        // Get count of upcoming appointments
        $upcomingAppointmentsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->where('status', PatientRecord::STATUS_PENDING)
            ->where('appointment_date', '>=', now())
            ->count();

        // Get count of completed appointments
        $completedAppointmentsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->where('status', PatientRecord::STATUS_COMPLETED)
            ->count();

        // Get all upcoming appointments for the calendar
        $upcomingAppointments = PatientRecord::with('patient')
            ->where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->where('appointment_date', '>=', now()->subDays(30))
            ->where('appointment_date', '<=', now()->addDays(60))
            ->orderBy('appointment_date', 'asc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'patient' => [
                        'id' => $appointment->patient->id,
                        'name' => $appointment->patient->name,
                    ],
                    'appointment_date' => $appointment->appointment_date,
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                ];
            });

        // Get doctor's schedule
        $schedule = DoctorSchedule::where('doctor_id', $user->id)
            ->orderBy('day_of_week')
            ->get()
            ->map(function ($scheduleItem) {
                return [
                    'id' => $scheduleItem->id,
                    'day_of_week' => $scheduleItem->day_of_week,
                    'start_time' => $scheduleItem->start_time,
                    'end_time' => $scheduleItem->end_time,
                    'is_available' => $scheduleItem->is_available,
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
            'schedule' => $schedule,
        ]);
    }
}
