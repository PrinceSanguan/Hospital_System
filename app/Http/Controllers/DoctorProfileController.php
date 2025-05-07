<?php

namespace App\Http\Controllers;

use App\Models\DoctorProfile;
use App\Models\DoctorService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DoctorProfileController extends Controller
{
    /**
     * Display a listing of doctor profiles.
     */
    public function index()
    {
        // For admin: view all doctor profiles
        if (Auth::user()->user_role === User::ROLE_ADMIN) {
            $doctors = User::where('user_role', User::ROLE_DOCTOR)
                ->with('doctorProfile', 'services')
                ->get();
            return view('admin.doctors.index', compact('doctors'));
        }

        // Redirect to the doctor's own profile if not admin
        return redirect()->route('doctor.profile');
    }

    /**
     * Show the form for creating a new doctor profile.
     */
    public function create()
    {
        // This is handled during user registration
        return redirect()->route('doctor.profile');
    }

    /**
     * Store a newly created doctor profile.
     */
    public function store(Request $request)
    {
        // This is handled during user registration
        return redirect()->route('doctor.profile');
    }

    /**
     * Display the specified doctor profile.
     */
    public function show($id)
    {
        $doctor = User::where('user_role', User::ROLE_DOCTOR)
            ->with('doctorProfile', 'services')
            ->findOrFail($id);

        return Inertia::render('Doctor/Show', [
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'role' => $doctor->user_role,
                'specialization' => $doctor->doctorProfile?->specialization,
                'qualifications' => $doctor->doctorProfile?->qualifications,
                'about' => $doctor->doctorProfile?->about,
                'phone_number' => $doctor->doctorProfile?->phone_number,
                'address' => $doctor->doctorProfile?->address,
                'years_of_experience' => $doctor->doctorProfile?->years_of_experience,
                'languages_spoken' => $doctor->doctorProfile?->languages_spoken,
                'education' => $doctor->doctorProfile?->education,
                'profile_image' => $doctor->doctorProfile?->profile_image ? asset('storage/' . $doctor->doctorProfile->profile_image) : null,
                'is_visible' => $doctor->doctorProfile?->is_visible
            ],
            'services' => $doctor->services
        ]);
    }

    /**
     * Show the form for editing the doctor profile.
     */
    public function edit()
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return redirect()->route('dashboard')
                ->with('error', 'Only doctors can edit doctor profiles.');
        }

        // Get or create doctor profile
        $profile = $user->doctorProfile ?? new DoctorProfile(['doctor_id' => $user->id]);
        $services = $user->services;

        return Inertia::render('Doctor/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'specialization' => $profile->specialization,
                'qualifications' => $profile->qualifications,
                'about' => $profile->about,
                'phone_number' => $profile->phone_number,
                'address' => $profile->address,
                'years_of_experience' => $profile->years_of_experience,
                'languages_spoken' => $profile->languages_spoken,
                'education' => $profile->education,
                'profile_image' => $profile->profile_image ? asset('storage/' . $profile->profile_image) : null,
                'is_visible' => $profile->is_visible
            ],
            'services' => $services
        ]);
    }

    /**
     * Update the specified doctor profile.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return redirect()->route('dashboard')
                ->with('error', 'Only doctors can update doctor profiles.');
        }

        $request->validate([
            'name' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:255',
            'qualifications' => 'nullable|string',
            'address' => 'nullable|string',
            'about' => 'nullable|string',
            'years_of_experience' => 'nullable|integer|min:0',
            'languages_spoken' => 'nullable|string|max:255',
            'education' => 'nullable|string|max:255',
            'profile_image' => 'nullable|image|max:2048',
            'is_visible' => 'boolean',
        ]);

        // Get or create doctor profile
        $profile = $user->doctorProfile ?? new DoctorProfile(['doctor_id' => $user->id]);

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            if ($profile->profile_image) {
                Storage::delete($profile->profile_image);
            }
            $profile->profile_image = $request->file('profile_image')->store('doctor-profiles', 'public');
        }

        // Update profile fields
        $profile->fill([
            'phone_number' => $request->phone_number,
            'specialization' => $request->specialization,
            'qualifications' => $request->qualifications,
            'address' => $request->address,
            'about' => $request->about,
            'years_of_experience' => $request->years_of_experience,
            'languages_spoken' => $request->languages_spoken,
            'education' => $request->education,
            'is_visible' => $request->has('is_visible'),
        ]);

        // Update user name if provided
        if ($request->name) {
            // Use the User model to update the name
            User::where('id', $user->id)->update(['name' => $request->name]);
        }

        $profile->save();

        return Inertia::render('Doctor/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'specialization' => $profile->specialization,
                'qualifications' => $profile->qualifications,
                'about' => $profile->about,
                'phone_number' => $profile->phone_number,
                'address' => $profile->address,
                'years_of_experience' => $profile->years_of_experience,
                'languages_spoken' => $profile->languages_spoken,
                'education' => $profile->education,
                'profile_image' => $profile->profile_image ? asset('storage/' . $profile->profile_image) : null,
                'is_visible' => $profile->is_visible
            ],
            'services' => $user->services,
            'flash' => [
                'success' => 'Profile updated successfully.'
            ]
        ]);
    }

    /**
     * Remove the specified doctor profile.
     */
    public function destroy($id)
    {
        // Only admin should be able to delete doctor profiles
        if (Auth::user()->user_role !== User::ROLE_ADMIN) {
            return redirect()->route('dashboard')
                ->with('error', 'You are not authorized to perform this action.');
        }

        $profile = DoctorProfile::findOrFail($id);

        // Delete profile image if exists
        if ($profile->profile_image) {
            Storage::delete($profile->profile_image);
        }

        $profile->delete();

        return redirect()->route('admin.doctors.index')
            ->with('success', 'Doctor profile deleted successfully.');
    }

    /**
     * Show all doctors to patients on the landing page or dashboard
     */
    public function listDoctors()
    {
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->whereHas('doctorProfile', function ($query) {
                $query->where('is_visible', true);
            })
            ->with(['doctorProfile', 'services' => function ($query) {
                $query->where('is_active', true);
            }])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialization' => $doctor->doctorProfile?->specialization,
                    'qualifications' => $doctor->doctorProfile?->qualifications,
                    'about' => $doctor->doctorProfile?->about,
                    'years_of_experience' => $doctor->doctorProfile?->years_of_experience,
                    'profile_image' => $doctor->doctorProfile?->profile_image ? asset('storage/' . $doctor->doctorProfile->profile_image) : null,
                    'services' => $doctor->services
                ];
            });

        return Inertia::render('Patient/Doctors', [
            'doctors' => $doctors
        ]);
    }

    /**
     * API endpoint for retrieving doctor profile data
     */
    public function getProfileData()
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $profile = $user->doctorProfile ?? new DoctorProfile(['doctor_id' => $user->id]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'specialization' => $profile->specialization,
                'qualifications' => $profile->qualifications,
                'about' => $profile->about,
                'phone' => $profile->phone_number,
                'address' => $profile->address,
                'years_of_experience' => $profile->years_of_experience,
                'languages_spoken' => $profile->languages_spoken,
                'education' => $profile->education,
                'profile_image' => $profile->profile_image ? asset('storage/' . $profile->profile_image) : null,
                'is_visible' => $profile->is_visible
            ],
            'services' => $user->services
        ]);
    }

    /**
     * Show the settings page for a doctor
     */
    public function settings()
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return redirect()->route('dashboard')
                ->with('error', 'Only doctors can access doctor settings.');
        }

        // Get or create doctor profile
        $profile = $user->doctorProfile ?? new DoctorProfile(['doctor_id' => $user->id]);

        return Inertia::render('Doctor/Settings', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'specialization' => $profile->specialization,
                'qualifications' => $profile->qualifications,
                'about' => $profile->about,
                'phone_number' => $profile->phone_number,
                'address' => $profile->address,
                'years_of_experience' => $profile->years_of_experience,
                'languages_spoken' => $profile->languages_spoken,
                'education' => $profile->education,
                'profile_image' => $profile->profile_image ? asset('storage/' . $profile->profile_image) : null,
                'is_visible' => $profile->is_visible
            ]
        ]);
    }
}
