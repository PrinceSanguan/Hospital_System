<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Display the reports page
     */
    public function index()
    {
        $user = Auth::user();

        // Get user stats
        $userStats = [
            'total' => User::count(),
            'patients' => User::where('user_role', User::ROLE_PATIENT)->count(),
            'doctors' => User::where('user_role', User::ROLE_DOCTOR)->count(),
            'staff' => User::where('user_role', User::ROLE_CLINICAL_STAFF)->count(),
            'new_this_month' => User::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count(),
        ];

        // Get appointment stats
        $appointmentStats = [
            'total' => PatientRecord::count(),
            'pending' => PatientRecord::where('status', 'pending')->count(),
            'completed' => PatientRecord::where('status', 'completed')->count(),
            'cancelled' => PatientRecord::where('status', 'cancelled')->count(),
            'this_month' => PatientRecord::whereMonth('appointment_date', Carbon::now()->month)
                ->whereYear('appointment_date', Carbon::now()->year)
                ->count(),
        ];

        // Monthly appointment trends (last 6 months)
        $appointmentTrends = $this->getMonthlyAppointmentTrends();

        // Patient growth trends
        $patientGrowth = $this->getMonthlyPatientGrowth();

        // Get monthly appointment types
        $appointmentTypes = $this->getAppointmentTypeDistribution();

        return Inertia::render('Admin/Reports', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'stats' => [
                'users' => $userStats,
                'appointments' => $appointmentStats,
            ],
            'charts' => [
                'appointmentTrends' => $appointmentTrends,
                'patientGrowth' => $patientGrowth,
                'appointmentTypes' => $appointmentTypes,
            ],
        ]);
    }

    /**
     * Get appointment trends for the last 6 months
     */
    private function getMonthlyAppointmentTrends()
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
     * Get patient growth for the last 6 months
     */
    private function getMonthlyPatientGrowth()
    {
        $growth = [];

        // Get last 6 months
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthName = $month->format('M'); // Short month name

            $newPatients = User::where('user_role', User::ROLE_PATIENT)
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();

            $growth[] = [
                'name' => $monthName,
                'new_patients' => $newPatients,
            ];
        }

        return $growth;
    }

    /**
     * Get appointment type distribution
     */
    private function getAppointmentTypeDistribution()
    {
        return PatientRecord::select('record_type', DB::raw('count(*) as total'))
            ->groupBy('record_type')
            ->get()
            ->map(function ($item) {
                // Convert record_type to a readable name
                $name = ucfirst(str_replace('_', ' ', $item->record_type));

                // Assign a color
                $color = match($item->record_type) {
                    'medical_checkup' => '#3b82f6', // blue
                    'laboratory' => '#10b981',      // green
                    'consultation' => '#8b5cf6',    // purple
                    default => '#f59e0b',           // amber
                };

                return [
                    'name' => $name,
                    'value' => $item->total,
                    'color' => $color,
                ];
            });
    }

    /**
     * Generate a downloadable PDF report
     */
    public function downloadReport(Request $request)
    {
        // TODO: Implement PDF generation with a package like dompdf
        // This would be implemented in a real application

        return back()->with('success', 'Report download functionality would be implemented here.');
    }
}
