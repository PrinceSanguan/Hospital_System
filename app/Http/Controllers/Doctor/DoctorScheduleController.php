<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DoctorScheduleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $schedules = DoctorSchedule::where('doctor_id', $user->id)
            ->orderBy('day_of_week')
            ->get();

        return Inertia::render('Doctor/Schedule', [
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

        // If a specific date was provided, we'll use that instead of a recurring weekly schedule
        if (isset($validated['specific_date'])) {
            $specificDate = Carbon::parse($validated['specific_date']);

            // Check if a schedule already exists for this specific date and time range
            $existingSchedule = DoctorSchedule::where('doctor_id', Auth::id())
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

        $schedule = new DoctorSchedule();
        $schedule->doctor_id = Auth::id();
        $schedule->day_of_week = $validated['day_of_week'];
        $schedule->start_time = $validated['start_time'];
        $schedule->end_time = $validated['end_time'];
        $schedule->is_available = $validated['is_available'] ?? true;
        $schedule->max_appointments = $validated['max_appointments'];
        $schedule->notes = $validated['notes'] ?? null;

        if (isset($validated['specific_date'])) {
            $schedule->specific_date = $validated['specific_date'];
        }

        $schedule->save();

        return redirect()->route('doctor.schedule.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $schedule = DoctorSchedule::where('doctor_id', Auth::id())
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

        $schedule->day_of_week = $validated['day_of_week'];
        $schedule->start_time = $validated['start_time'];
        $schedule->end_time = $validated['end_time'];
        $schedule->is_available = $validated['is_available'] ?? true;
        $schedule->max_appointments = $validated['max_appointments'];
        $schedule->notes = $validated['notes'] ?? null;

        if (isset($validated['specific_date'])) {
            $schedule->specific_date = $validated['specific_date'];
        }

        $schedule->save();

        return redirect()->route('doctor.schedule.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $schedule = DoctorSchedule::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $schedule->delete();

        return redirect()->route('doctor.schedule.index');
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
        $createdSchedules = [];

        foreach ($schedules as $scheduleData) {
            $schedule = new DoctorSchedule();
            $schedule->doctor_id = Auth::id();
            $schedule->day_of_week = $scheduleData['day_of_week'];
            $schedule->start_time = $scheduleData['start_time'];
            $schedule->end_time = $scheduleData['end_time'];
            $schedule->is_available = $scheduleData['is_available'] ?? true;
            $schedule->max_appointments = $scheduleData['max_appointments'];
            $schedule->notes = $scheduleData['notes'] ?? null;

            if (isset($scheduleData['specific_date'])) {
                $schedule->specific_date = $scheduleData['specific_date'];
            }

            $schedule->save();
            $createdSchedules[] = $schedule;
        }

        return redirect()->route('doctor.schedule.index');
    }
}
