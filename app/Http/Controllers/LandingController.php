<?php

namespace App\Http\Controllers;

use App\Models\HospitalService;
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

        // Define the featured doctors for the landing page
        $doctors = [
            [
                'id' => 1,
                'name' => 'Dr. Sheila Mae Beltrano',
                'specialty' => 'Certified Family Physician',
                'image' => 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
                'availability' => ['Monday', 'Wednesday', 'Friday']
            ],
            [
                'id' => 2,
                'name' => 'Dr. Kathy Narvaez-Garcia',
                'specialty' => 'General Practitioner',
                'image' => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
                'availability' => ['Tuesday', 'Thursday', 'Saturday']
            ],
            [
                'id' => 3,
                'name' => 'Dr. Rogelia Bantayon-Tubog',
                'specialty' => 'Occupational Health Physician, BCOM Diplomate, Family Medicine',
                'image' => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
                'availability' => ['Monday', 'Tuesday', 'Friday']
            ],
            [
                'id' => 4,
                'name' => 'Dr. Blas Bandian',
                'specialty' => 'Diplomate, Family Medicine',
                'image' => 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
                'availability' => ['Wednesday', 'Thursday', 'Saturday']
            ]
        ];

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
