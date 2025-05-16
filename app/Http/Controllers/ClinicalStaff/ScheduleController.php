<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\StaffSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $schedules = StaffSchedule::where('doctor_id', $user->id)
            ->orderBy('day_of_week')
            ->get();

        return Inertia::render('ClinicalStaff/Schedule', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'schedules' => $schedules,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_available' => 'boolean',
            'max_appointments' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
            'specific_date' => 'nullable|date',
        ]);

        if (isset($validated['specific_date'])) {
            $specificDate = Carbon::parse($validated['specific_date']);

            // Check for overlapping schedules
            $existingSchedule = StaffSchedule::where('doctor_id', Auth::id())
                ->where('day_of_week', $specificDate->dayOfWeek)
                ->where('specific_date', $specificDate->format('Y-m-d'))
                ->where(function($query) use ($validated) {
                    $query->where(function($q) use ($validated) {
                        $q->where('start_time', '<=', $validated['start_time'])
                          ->where('end_time', '>', $validated['start_time']);
                    })->orWhere(function($q) use ($validated) {
                        $q->where('start_time', '<', $validated['end_time'])
                          ->where('end_time', '>=', $validated['end_time']);
                    });
                })
                ->first();

            if ($existingSchedule) {
                return back()->withErrors([
                    'specific_date' => 'A schedule already exists for this date and time range.'
                ]);
            }
        }

        $schedule = new StaffSchedule();
        $schedule->user_role = Auth::id();
        $schedule->day_of_week = $validated['day_of_week'];
        $schedule->start_time = $validated['start_time'];
        $schedule->end_time = $validated['end_time'];
        $schedule->is_available = $validated['is_available'] ?? true;
        $schedule->max_appointments = $validated['max_appointments'];
        $schedule->notes = $validated['notes'] ?? null;
        $schedule->specific_date = $validated['specific_date'] ?? null;

        $schedule->save();

        return redirect()->route('staff.clinical-staff.schedule.index')->with('success', 'Schedule created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $schedule = StaffSchedule::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $validated = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_available' => 'boolean',
            'max_appointments' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
            'specific_date' => 'nullable|date',
        ]);

        $schedule->update([
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'is_available' => $validated['is_available'] ?? true,
            'max_appointments' => $validated['max_appointments'],
            'notes' => $validated['notes'] ?? null,
            'specific_date' => $validated['specific_date'] ?? null,
        ]);

        return redirect()->route('staff.clinical-staff.schedule.index')->with('success', 'Schedule updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $schedule = StaffSchedule::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $schedule->delete();

        return redirect()->route('staff.clinical-staff.schedule.index')->with('success', 'Schedule deleted successfully');
    }

    /**
     * Store multiple schedules at once
     */
    public function storeMultiple(Request $request)
    {
        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|min:0|max:6',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            'schedules.*.is_available' => 'boolean',
            'schedules.*.max_appointments' => 'required|integer|min:1',
            'schedules.*.notes' => 'nullable|string|max:255',
            'schedules.*.specific_date' => 'nullable|date',
        ]);

        $schedules = $request->input('schedules');

        foreach ($schedules as $scheduleData) {
            StaffSchedule::create([
                'user_role' => Auth::id(),
                'day_of_week' => $scheduleData['day_of_week'],
                'start_time' => $scheduleData['start_time'],
                'end_time' => $scheduleData['end_time'], // Fixed: was incorrectly set to start_time
                'is_available' => $scheduleData['is_available'] ?? true,
                'max_appointments' => $scheduleData['max_appointments'],
                'notes' => $scheduleData['notes'] ?? null,
                'specific_date' => $scheduleData['specific_date'] ?? null,
            ]);
        }

        return redirect()->route('staff.clinical-staff.schedule.index')->with('success', 'Schedules created successfully');
    }
}
