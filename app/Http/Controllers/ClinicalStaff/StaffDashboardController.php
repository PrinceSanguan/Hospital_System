<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class StaffDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get total patients
        $patientsCount = User::where('user_role', User::ROLE_PATIENT)->count();

        // Get total appointments for today
        $todayAppointmentsCount = PatientRecord::whereDate('appointment_date', today())
            ->count();

        // Get pending lab results count
        $pendingLabResultsCount = PatientRecord::where('record_type', 'laboratory')
            ->where('status', 'pending')
            ->count();

        // Get all appointments instead of just today's
        $allAppointments = PatientRecord::with(['patient:id,name', 'assignedDoctor:id,name'])
            ->orderBy('appointment_date', 'desc')
            ->take(15)
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
                    'doctor' => $appointment->assignedDoctor ? [
                        'id' => $appointment->assignedDoctor->id,
                        'name' => $appointment->assignedDoctor->name,
                    ] : null,
                    'reason' => json_decode($appointment->details)?->reason ?? null,
                ];
            });

        return Inertia::render('ClinicalStaff/Dashboard', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'stats' => [
                'totalPatients' => $patientsCount,
                'todayAppointments' => $todayAppointmentsCount,
                'pendingLabResults' => $pendingLabResultsCount,
            ],
            'appointments' => $allAppointments,
        ]);
    }
}
