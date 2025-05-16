<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use App\Models\LabResult;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
                // Check if this patient has lab results
                $hasLabResults = LabResult::where('patient_id', $appointment->patient_id)->exists();
                
                // Parse details
                $detailsArray = [];
                if ($appointment->details) {
                    if (is_string($appointment->details)) {
                        try {
                            $detailsArray = json_decode($appointment->details, true) ?: [];
                        } catch (\Exception $e) {
                            $detailsArray = [];
                            Log::error('Error parsing appointment details: ' . $e->getMessage());
                        }
                    } else {
                        $detailsArray = (array) $appointment->details;
                    }
                }
                
                return [
                    'id' => $appointment->id,
                    'reference_number' => $appointment->reference_number ?? ('APP-' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT)),
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
                    'reason' => $appointment->reason ?? ($detailsArray['reason'] ?? 'Not specified'),
                    'details' => $detailsArray,
                    'has_lab_results' => $hasLabResults,
                    'record_type' => $appointment->record_type ?? 'doctor_appointment',
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
