<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

        // Get appointment trends for last 6 months
        $appointmentTrends = $this->getAppointmentTrends();

        // Get appointment types distribution
        $appointmentTypes = $this->getAppointmentTypes();

        // Get patient growth (new registrations vs returning patients)
        $patientGrowth = $this->getPatientGrowth();

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
            'chartData' => [
                'appointmentTrends' => $appointmentTrends,
                'appointmentTypes' => $appointmentTypes,
                'patientGrowth' => $patientGrowth,
                'userDistribution' => [
                    ['name' => 'Patients', 'value' => $userCounts['patients'], 'color' => '#3b82f6'],
                    ['name' => 'Doctors', 'value' => $userCounts['doctors'], 'color' => '#10b981'],
                    ['name' => 'Staff', 'value' => $userCounts['staff'], 'color' => '#8b5cf6'],
                    ['name' => 'Admins', 'value' => $userCounts['admins'], 'color' => '#f59e0b'],
                ],
            ],
            'recentUsers' => $recentUsers,
            'upcomingAppointments' => $upcomingAppointments,
        ]);
    }

    /**
     * Get appointment trends for the last 6 months
     *
     * @return array
     */
    private function getAppointmentTrends()
    {
        $trends = [];
        // Get last 6 months
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthName = $month->format('M'); // Short month name

            // Count appointments by status for this month
            $pending = PatientRecord::whereMonth('appointment_date', $month->month)
                ->whereYear('appointment_date', $month->year)
                ->where('status', 'pending')
                ->count();

            $completed = PatientRecord::whereMonth('appointment_date', $month->month)
                ->whereYear('appointment_date', $month->year)
                ->where('status', 'completed')
                ->count();

            $cancelled = PatientRecord::whereMonth('appointment_date', $month->month)
                ->whereYear('appointment_date', $month->year)
                ->where('status', 'cancelled')
                ->count();

            $trends[] = [
                'name' => $monthName,
                'pending' => $pending,
                'completed' => $completed,
                'cancelled' => $cancelled,
            ];
        }

        return $trends;
    }

    /**
     * Get appointment types distribution
     *
     * @return array
     */
    private function getAppointmentTypes()
    {
        // Get counts of different record types
        $types = PatientRecord::select('record_type', DB::raw('count(*) as total'))
            ->groupBy('record_type')
            ->get()
            ->map(function ($item) {
                // Convert database record_type to readable name
                $name = ucfirst(str_replace('_', ' ', $item->record_type));

                // Assign a color based on the type
                $color = match($item->record_type) {
                    'medical_checkup' => '#3b82f6', // blue
                    'lab_test' => '#10b981',        // green
                    'consultation' => '#8b5cf6',    // purple
                    default => '#f59e0b',           // amber
                };

                return [
                    'name' => $name,
                    'value' => $item->total,
                    'color' => $color
                ];
            })
            ->toArray();

        return $types;
    }

    /**
     * Get patient growth data (new vs returning)
     *
     * @return array
     */
    private function getPatientGrowth()
    {
        $growth = [];
        // Get last 6 months
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthName = $month->format('M'); // Short month name

            // New patients (users created this month)
            $newPatients = User::where('user_role', User::ROLE_PATIENT)
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();

            // Returning patients (patients with a record this month who registered before this month)
            $returningPatients = PatientRecord::join('users', 'patient_records.patient_id', '=', 'users.id')
                ->whereMonth('patient_records.appointment_date', $month->month)
                ->whereYear('patient_records.appointment_date', $month->year)
                ->where('users.created_at', '<', $month->startOfMonth())
                ->distinct('patient_records.patient_id')
                ->count('patient_records.patient_id');

            $growth[] = [
                'name' => $monthName,
                'new' => $newPatients,
                'returning' => $returningPatients,
            ];
        }

        return $growth;
    }
}
