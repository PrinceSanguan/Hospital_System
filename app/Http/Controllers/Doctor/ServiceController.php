<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    /**
     * Display the doctor's services
     */
    public function index()
    {
        $user = Auth::user();
        $services = DoctorService::where('doctor_id', $user->id)->get();

        return Inertia::render('Doctor/Services', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'services' => $services,
        ]);
    }

    /**
     * Store a new service
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'duration_minutes' => 'required|integer|min:5',
            'price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $service = new DoctorService();
        $service->doctor_id = Auth::id();
        $service->name = $request->name;
        $service->description = $request->description;
        $service->duration_minutes = $request->duration_minutes;
        $service->price = $request->price;
        $service->is_active = $request->is_active;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('services', 'public');
            $service->image_path = $path;
        }

        $service->save();

        return redirect()->route('doctor.services.index')
            ->with('success', 'Service added successfully');
    }

    /**
     * Update a service
     */
    public function update(Request $request, $id)
    {
        $service = DoctorService::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'duration_minutes' => 'required|integer|min:5',
            'price' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $service->name = $request->name;
        $service->description = $request->description;
        $service->duration_minutes = $request->duration_minutes;
        $service->price = $request->price;
        $service->is_active = $request->is_active;

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($service->image_path) {
                Storage::disk('public')->delete($service->image_path);
            }

            $path = $request->file('image')->store('services', 'public');
            $service->image_path = $path;
        }

        $service->save();

        return redirect()->route('doctor.services.index')
            ->with('success', 'Service updated successfully');
    }

    /**
     * Delete a service
     */
    public function destroy($id)
    {
        $service = DoctorService::where('doctor_id', Auth::id())
            ->findOrFail($id);

        // Delete image if exists
        if ($service->image_path) {
            Storage::disk('public')->delete($service->image_path);
        }

        $service->delete();

        return redirect()->route('doctor.services.index')
            ->with('success', 'Service deleted successfully');
    }
}
