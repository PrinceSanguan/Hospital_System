<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get user counts by role
        $userCounts = [
            'total' => User::count(),
            'patients' => User::where('user_role', User::ROLE_PATIENT)->count(),
            'doctors' => User::where('user_role', User::ROLE_DOCTOR)->count(),
            'staff' => User::where('user_role', User::ROLE_CLINICAL_STAFF)->count(),
            'admins' => User::where('user_role', User::ROLE_ADMIN)->count(),
        ];

        // Get appointment stats
        $appointmentStats = [
            'total' => PatientRecord::count(),
            'pending' => PatientRecord::where('status', 'pending')->count(),
            'completed' => PatientRecord::where('status', 'completed')->count(),
            'cancelled' => PatientRecord::where('status', 'cancelled')->count(),
            'todayTotal' => PatientRecord::whereDate('appointment_date', today())->count(),
        ];

        // Get recently registered users
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                    'created_at' => $user->created_at->format('M d, Y'),
                ];
            });

        // Get upcoming appointments
        $upcomingAppointments = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('appointment_date', '>=', now())
            ->where('status', 'pending')
            ->orderBy('appointment_date', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'stats' => [
                'users' => $userCounts,
                'appointments' => $appointmentStats,
            ],
            'recentUsers' => $recentUsers,
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }
}
