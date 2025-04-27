<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PatientDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get upcoming appointments
        $upcomingAppointments = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('appointment_date', '>=', now())
            ->where('status', 'pending')
            ->orderBy('appointment_date', 'asc')
            ->take(5)
            ->get();

        // Get lab results
        $labResults = PatientRecord::where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->whereNotNull('lab_results')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        // Get medical records
        $medicalRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('record_type', 'medical_checkup')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Patient/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'upcomingAppointments' => $upcomingAppointments,
            'labResults' => $labResults,
            'medicalRecords' => $medicalRecords,
        ]);
    }
}
