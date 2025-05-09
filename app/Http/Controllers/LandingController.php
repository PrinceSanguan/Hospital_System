<?php

namespace App\Http\Controllers;

use App\Models\HospitalService;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LandingController extends Controller
{
    /**
     * Display the landing page with available services
     */
    public function index()
    {
        // Define the services available on the landing page
        $services = [
            [
                'id' => 'medical-checkup',
                'title' => 'Medical Check-up',
                'description' => 'Schedule medical checkups and consultations',
                'icon' => 'medical',
                'requires_auth' => true
            ],
            [
                'id' => 'laboratory',
                'title' => 'Laboratory',
                'description' => 'Book laboratory tests and view results',
                'icon' => 'laboratory',
                'requires_auth' => true
            ],
            [
                'id' => 'clinical-schedule',
                'title' => 'Clinical Schedule',
                'description' => 'View clinic schedules and availability',
                'icon' => 'schedule',
                'requires_auth' => false
            ],
            [
                'id' => 'services-available',
                'title' => 'Services Available',
                'description' => 'Explore the services we offer',
                'icon' => 'services',
                'requires_auth' => false
            ],
            [
                'id' => 'doctor-on-duty',
                'title' => 'Doctor on Duty',
                'description' => 'See which doctors are currently on duty',
                'icon' => 'doctor',
                'requires_auth' => false
            ],
            [
                'id' => 'specialists',
                'title' => 'Specialists',
                'description' => 'Learn about our specialist doctors',
                'icon' => 'specialist',
                'requires_auth' => false
            ],
        ];

        // Get hospital services from database with error handling
        try {
            $hospitalServices = HospitalService::where('is_active', true)->get();
        } catch (\Exception $e) {
            Log::error('Error loading hospital services: ' . $e->getMessage());
            // Provide empty array if database query fails
            $hospitalServices = [];
        }

        // Fetch featured doctors from the database instead of hardcoding them
        try {
            $doctors = User::where('user_role', User::ROLE_DOCTOR)
                ->with(['doctorProfile', 'schedules'])
                ->limit(4) // Limit to 4 featured doctors
                ->get()
                ->map(function ($doctor) {
                    // Extract availability days from schedules
                    $availability = $doctor->schedules
                        ->where('is_available', true)
                        ->pluck('day_of_week')
                        ->toArray();

                    // Format the doctor data for the frontend
                    return [
                        'id' => $doctor->id,
                        'name' => 'Dr. ' . $doctor->name,
                        'specialty' => $doctor->doctorProfile ? $doctor->doctorProfile->specialty : 'General Physician',
                        'image' => $doctor->profile_image ?? 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
                        'availability' => $availability
                    ];
                });
        } catch (\Exception $e) {
            // Log error and provide fallback data
            Log::error('Error loading doctor data: ' . $e->getMessage());
            $doctors = [];
        }

        return Inertia::render('Landing', [
            'services' => $services,
            'hospitalServices' => $hospitalServices,
            'doctors' => $doctors,
            'isAuthenticated' => Auth::check(),
            'userRole' => Auth::check() ? Auth::user()->user_role : null,
        ]);
    }

    /**
     * Display the view for a specific service
     */
    public function viewService(string $service)
    {
        // Check if user authentication is required for this service
        if (in_array($service, ['medical-checkup', 'laboratory']) && !Auth::check()) {
            return redirect()->route('auth.login')->with('message', 'Please login to access this service');
        }

        // Return the appropriate view based on the service
        return Inertia::render('Services/' . ucfirst($service));
    }

    /**
     * Display the view for a specific doctor
     */
    public function viewDoctor($id)
    {
        $doctor = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['doctorProfile', 'services' => function($query) {
                $query->where('is_active', true);
            }, 'schedules'])
            ->findOrFail($id);

        // Get available dates based on doctor schedules
        $availableDates = [];
        $availableTimeSlots = [];
        if ($doctor->schedules) {
            foreach ($doctor->schedules as $schedule) {
                if ($schedule->is_available) {
                    // Add available days from schedules
                    $availableDates[] = [
                        'day' => $schedule->day_of_week,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                    ];
                }
            }
        }

        return Inertia::render('Doctors/Show', [
            'doctor' => $doctor,
            'availableDates' => $availableDates,
            'availableTimeSlots' => $availableTimeSlots
        ]);
    }
}
