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
        // Validate the report type
        $request->validate([
            'type' => 'required|string|in:summary,patient,appointment,financial',
        ]);

        $reportType = $request->input('type');
        $fileName = null;
        $reportData = [];

        // Prepare data based on report type
        switch ($reportType) {
            case 'summary':
                $fileName = 'clinic_summary_report.pdf';
                $reportData = $this->prepareSummaryReportData();
                break;
            case 'patient':
                $fileName = 'patient_report.pdf';
                $reportData = $this->preparePatientReportData();
                break;
            case 'appointment':
                $fileName = 'appointment_report.pdf';
                $reportData = $this->prepareAppointmentReportData();
                break;
            case 'financial':
                $fileName = 'financial_report.pdf';
                $reportData = $this->prepareFinancialReportData();
                break;
        }

        // Check if we have barryvdh/laravel-dompdf installed
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            try {
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.' . $reportType, $reportData);
                return $pdf->download($fileName);
            } catch (\Exception $e) {
                // If the view doesn't exist or another error occurs
                return back()->with('error', 'Error generating PDF: ' . $e->getMessage());
            }
        }

        // Fallback for when PDF library isn't available
        return back()->with('info', 'Report download functionality would be implemented here. Report Type: ' . ucfirst($reportType));
    }

    /**
     * Prepare data for the summary report
     */
    private function prepareSummaryReportData()
    {
        return [
            'title' => 'Clinic Summary Report',
            'generated_at' => Carbon::now()->format('F j, Y, g:i a'),
            'user_stats' => [
                'total' => User::count(),
                'patients' => User::where('user_role', User::ROLE_PATIENT)->count(),
                'doctors' => User::where('user_role', User::ROLE_DOCTOR)->count(),
                'staff' => User::where('user_role', User::ROLE_CLINICAL_STAFF)->count(),
            ],
            'appointment_stats' => [
                'total' => PatientRecord::count(),
                'pending' => PatientRecord::where('status', 'pending')->count(),
                'completed' => PatientRecord::where('status', 'completed')->count(),
                'cancelled' => PatientRecord::where('status', 'cancelled')->count(),
            ],
            'monthly_trends' => $this->getMonthlyAppointmentTrends(),
        ];
    }

    /**
     * Prepare data for the patient report
     */
    private function preparePatientReportData()
    {
        return [
            'title' => 'Patient Statistics Report',
            'generated_at' => Carbon::now()->format('F j, Y, g:i a'),
            'patient_count' => User::where('user_role', User::ROLE_PATIENT)->count(),
            'new_patients_this_month' => User::where('user_role', User::ROLE_PATIENT)
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count(),
            'patients_by_month' => $this->getMonthlyPatientGrowth(),
            'recent_patients' => User::where('user_role', User::ROLE_PATIENT)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(['id', 'name', 'email', 'created_at']),
        ];
    }

    /**
     * Prepare data for the appointment report
     */
    private function prepareAppointmentReportData()
    {
        return [
            'title' => 'Appointment Statistics Report',
            'generated_at' => Carbon::now()->format('F j, Y, g:i a'),
            'appointment_count' => PatientRecord::count(),
            'appointment_stats' => [
                'pending' => PatientRecord::where('status', 'pending')->count(),
                'completed' => PatientRecord::where('status', 'completed')->count(),
                'cancelled' => PatientRecord::where('status', 'cancelled')->count(),
            ],
            'appointment_trends' => $this->getMonthlyAppointmentTrends(),
            'appointment_types' => $this->getAppointmentTypeDistribution(),
            'upcoming_appointments' => PatientRecord::with(['patient', 'assignedDoctor'])
                ->where('appointment_date', '>=', Carbon::now())
                ->orderBy('appointment_date', 'asc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Prepare data for the financial report
     */
    private function prepareFinancialReportData()
    {
        // This would connect to a financial model in a real application
        // For this example, we'll create mock data
        return [
            'title' => 'Financial Summary Report',
            'generated_at' => Carbon::now()->format('F j, Y, g:i a'),
            'monthly_revenue' => [
                ['month' => 'Jan', 'revenue' => rand(5000, 15000)],
                ['month' => 'Feb', 'revenue' => rand(5000, 15000)],
                ['month' => 'Mar', 'revenue' => rand(5000, 15000)],
                ['month' => 'Apr', 'revenue' => rand(5000, 15000)],
                ['month' => 'May', 'revenue' => rand(5000, 15000)],
                ['month' => 'Jun', 'revenue' => rand(5000, 15000)],
            ],
            'total_revenue_ytd' => rand(50000, 150000),
            'average_monthly_revenue' => rand(8000, 12000),
            'revenue_by_service' => [
                ['service' => 'Medical Checkup', 'revenue' => rand(10000, 30000)],
                ['service' => 'Laboratory Tests', 'revenue' => rand(15000, 35000)],
                ['service' => 'Consultations', 'revenue' => rand(20000, 40000)],
                ['service' => 'Procedures', 'revenue' => rand(25000, 45000)],
            ],
        ];
    }
}
