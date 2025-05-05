<?php

namespace App\Http\Controllers;

use App\Models\HospitalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class HospitalServiceController extends Controller
{
    /**
     * Display a listing of hospital services.
     */
    public function index()
    {
        $services = HospitalService::all();

        return Inertia::render('Admin/HospitalServices/Index', [
            'services' => $services
        ]);
    }

    /**
     * Show the form for creating a new hospital service.
     */
    public function create()
    {
        return Inertia::render('Admin/HospitalServices/Create');
    }

    /**
     * Store a newly created hospital service in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'required|string',
            'category' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
            'price' => 'nullable|numeric|min:0',
            'icon' => 'nullable|string|max:30',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $service = new HospitalService();
        $service->name = $request->name;
        $service->description = $request->description;
        $service->category = $request->category;
        $service->is_active = $request->is_active;
        $service->price = $request->price;
        $service->icon = $request->icon;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('services', 'public');
            $service->image_path = $path;
        }

        $service->save();

        return redirect()->route('admin.services.index')
            ->with('success', 'Service added successfully');
    }

    /**
     * Display the specified hospital service.
     */
    public function show(HospitalService $service)
    {
        return Inertia::render('Admin/HospitalServices/Show', [
            'service' => $service
        ]);
    }

    /**
     * Show the form for editing the specified hospital service.
     */
    public function edit(HospitalService $service)
    {
        return Inertia::render('Admin/HospitalServices/Edit', [
            'service' => $service
        ]);
    }

    /**
     * Update the specified hospital service in storage.
     */
    public function update(Request $request, HospitalService $service)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'required|string',
            'category' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
            'price' => 'nullable|numeric|min:0',
            'icon' => 'nullable|string|max:30',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $service->name = $request->name;
        $service->description = $request->description;
        $service->category = $request->category;
        $service->is_active = $request->is_active;
        $service->price = $request->price;
        $service->icon = $request->icon;

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($service->image_path) {
                Storage::disk('public')->delete($service->image_path);
            }

            $path = $request->file('image')->store('services', 'public');
            $service->image_path = $path;
        }

        $service->save();

        return redirect()->route('admin.services.index')
            ->with('success', 'Service updated successfully');
    }

    /**
     * Remove the specified hospital service from storage.
     */
    public function destroy(HospitalService $service)
    {
        // Delete image if exists
        if ($service->image_path) {
            Storage::disk('public')->delete($service->image_path);
        }

        $service->delete();

        return redirect()->route('admin.services.index')
            ->with('success', 'Service deleted successfully');
    }

    /**
     * Get active services for the landing page.
     */
    public function getActiveServices()
    {
        $services = HospitalService::where('is_active', true)->get();

        return response()->json([
            'services' => $services
        ]);
    }
}
