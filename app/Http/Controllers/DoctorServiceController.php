<?php

namespace App\Http\Controllers;

use App\Models\DoctorService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DoctorServiceController extends Controller
{
    /**
     * Display a listing of doctor services.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return redirect()->route('dashboard')
                ->with('error', 'Only doctors can manage services.');
        }

        $services = DoctorService::where('doctor_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        if (request()->wantsJson() || request()->inertia()) {
            return Inertia::render('Doctor/Services', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'services' => $services
            ]);
        }

        return view('doctors.services.index', compact('services'));
    }

    /**
     * Show the form for creating a new doctor service.
     */
    public function create()
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return redirect()->route('dashboard')
                ->with('error', 'Only doctors can manage services.');
        }

        if (request()->wantsJson() || request()->inertia()) {
            return Inertia::render('Doctor/ServiceCreate', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ]
            ]);
        }

        return view('doctors.services.create');
    }

    /**
     * Store a newly created doctor service.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->user_role !== User::ROLE_DOCTOR) {
            return redirect()->route('dashboard')
                ->with('error', 'Only doctors can manage services.');
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'duration_minutes' => 'required|integer|min:5|max:240',
            'price' => 'required|numeric|min:0',
            'image_path' => 'nullable|image|max:2048',
            'is_active' => 'boolean',
        ]);

        $service = new DoctorService([
            'doctor_id' => $user->id,
            'name' => $validatedData['name'],
            'description' => $validatedData['description'],
            'duration_minutes' => $validatedData['duration_minutes'],
            'price' => $validatedData['price'],
            'is_active' => $request->has('is_active'),
        ]);

        // Handle image upload
        if ($request->hasFile('image_path')) {
            $service->image_path = $request->file('image_path')->store('doctor-services', 'public');
        }

        $service->save();

        if ($request->wantsJson() || $request->inertia()) {
            return response()->json([
                'success' => true,
                'message' => 'Service created successfully.',
                'service' => $service
            ]);
        }

        return redirect()->route('doctor.services.manage')
            ->with('success', 'Service created successfully.');
    }

    /**
     * Show the form for editing the specified doctor service.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $service = DoctorService::findOrFail($id);

        // Check if service belongs to the logged-in doctor
        if ($service->doctor_id !== $user->id && $user->user_role !== User::ROLE_ADMIN) {
            return redirect()->route('dashboard')
                ->with('error', 'You are not authorized to edit this service.');
        }

        if (request()->wantsJson() || request()->inertia()) {
            return Inertia::render('Doctor/ServiceEdit', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'service' => $service
            ]);
        }

        return view('doctors.services.edit', compact('service'));
    }

    /**
     * Update the specified doctor service.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $service = DoctorService::findOrFail($id);

        // Check if service belongs to the logged-in doctor
        if ($service->doctor_id !== $user->id && $user->user_role !== User::ROLE_ADMIN) {
            return redirect()->route('dashboard')
                ->with('error', 'You are not authorized to update this service.');
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'duration_minutes' => 'required|integer|min:5|max:240',
            'price' => 'required|numeric|min:0',
            'image_path' => 'nullable|image|max:2048',
            'is_active' => 'boolean',
        ]);

        $service->fill([
            'name' => $validatedData['name'],
            'description' => $validatedData['description'],
            'duration_minutes' => $validatedData['duration_minutes'],
            'price' => $validatedData['price'],
            'is_active' => $request->has('is_active'),
        ]);

        // Handle image upload
        if ($request->hasFile('image_path')) {
            if ($service->image_path) {
                Storage::delete($service->image_path);
            }
            $service->image_path = $request->file('image_path')->store('doctor-services', 'public');
        }

        $service->save();

        if ($request->wantsJson() || $request->inertia()) {
            return response()->json([
                'success' => true,
                'message' => 'Service updated successfully.',
                'service' => $service
            ]);
        }

        return redirect()->route('doctor.services.manage')
            ->with('success', 'Service updated successfully.');
    }

    /**
     * Remove the specified doctor service.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $service = DoctorService::findOrFail($id);

        // Check if service belongs to the logged-in doctor
        if ($service->doctor_id !== $user->id && $user->user_role !== User::ROLE_ADMIN) {
            return redirect()->route('dashboard')
                ->with('error', 'You are not authorized to delete this service.');
        }

        // Delete image if exists
        if ($service->image_path) {
            Storage::delete($service->image_path);
        }

        $service->delete();

        if (request()->wantsJson() || request()->inertia()) {
            return response()->json([
                'success' => true,
                'message' => 'Service deleted successfully.'
            ]);
        }

        return redirect()->route('doctor.services.manage')
            ->with('success', 'Service deleted successfully.');
    }

    /**
     * Get services for a specific doctor (public API)
     */
    public function getDoctorServices($id)
    {
        $doctor = User::where('user_role', User::ROLE_DOCTOR)->findOrFail($id);
        $services = DoctorService::where('doctor_id', $doctor->id)
                    ->where('is_active', true)
                    ->orderBy('created_at', 'desc')
                    ->get();

        return response()->json($services);
    }
}
