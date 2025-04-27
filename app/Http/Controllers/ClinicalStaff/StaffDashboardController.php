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

        // Get today's appointments
        $todayAppointments = PatientRecord::with(['patient', 'assignedDoctor'])
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_date', 'asc')
            ->take(10)
            ->get();

        return Inertia::render('ClinicalStaff/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'stats' => [
                'patients' => $patientsCount,
                'todayAppointments' => $todayAppointmentsCount,
                'pendingLabResults' => $pendingLabResultsCount,
            ],
            'todayAppointments' => $todayAppointments,
        ]);
    }
}
