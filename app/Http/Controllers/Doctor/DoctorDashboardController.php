<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DoctorDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get count of patients assigned to this doctor
        $patientsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->distinct('patient_id')
            ->count('patient_id');

        // Get count of appointments
        $appointmentsCount = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('status', 'pending')
            ->count();

        // Get upcoming appointments
        $upcomingAppointments = PatientRecord::with('patient')
            ->where('assigned_doctor_id', $user->id)
            ->where('status', 'pending')
            ->where('appointment_date', '>=', now())
            ->orderBy('appointment_date', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('Doctor/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'stats' => [
                'patients' => $patientsCount,
                'appointments' => $appointmentsCount,
            ],
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }
}
