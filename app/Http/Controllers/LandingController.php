<?php

namespace App\Http\Controllers;

use App\Models\HospitalService;
use App\Models\User; // Add this import
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

        // Get doctors from database
        try {
            $doctors = User::where('user_role', User::ROLE_DOCTOR)
                ->with(['schedules', 'services'])
                ->get()
                ->map(function ($doctor) {
                    return [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'specialty' => $doctor->specialty ?? 'General Practitioner',
                        'image' => $doctor->profile_photo ?? '/placeholder-avatar.jpg',
                        'availability' => $doctor->availability ?? [],
                        'schedules' => $doctor->schedules,
                        'services' => $doctor->services,
                    ];
                });
        } catch (\Exception $e) {
            Log::error('Error loading doctors: ' . $e->getMessage());
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
}
