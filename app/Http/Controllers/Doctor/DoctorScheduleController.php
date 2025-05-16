<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use App\Models\User; // Use User model
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

        // Get all staff members assigned to this doctor
        $staff = User::where('user_role', 'staff')->orderBy('name')->get();

        return Inertia::render('Doctor/Schedule', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'schedules' => $schedules,
            'staff' => $staff,
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
            'staff_id' => 'required|exists:staff,id',
            'notes' => 'nullable|string|max:255',
            'specific_date' => 'nullable|date',
        ]);

        if (isset($validated['specific_date'])) {
            $specificDate = Carbon::parse($validated['specific_date']);

            // Check for overlapping schedules
            $existingSchedule = DoctorSchedule::where('doctor_id', Auth::id())
                ->where('staff_id', $validated['staff_id'])
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
                    'specific_date' => 'A schedule already exists for this staff member on this date and time range.'
                ]);
            }
        }

        // Determine schedule_date based on specific_date or day_of_week
        if (isset($validated['specific_date'])) {
            $scheduleDate = $validated['specific_date'];
        } else {
            // Set schedule_date to the next occurrence of the day of week
            $today = Carbon::today();
            $dayOfWeek = (int)$validated['day_of_week'];
            $scheduleDate = $today->dayOfWeek === $dayOfWeek
                ? $today->format('Y-m-d')
                : $today->next($dayOfWeek)->format('Y-m-d');
        }

        $schedule = new DoctorSchedule();
        $schedule->doctor_id = Auth::id();
        $schedule->staff_id = $validated['staff_id'];
        $schedule->day_of_week = $validated['day_of_week'];
        $schedule->start_time = $validated['start_time'];
        $schedule->end_time = $validated['end_time'];
        $schedule->is_available = $validated['is_available'] ?? true;
        $schedule->max_appointments = $validated['max_appointments'];
        $schedule->notes = $validated['notes'] ?? null;
        $schedule->specific_date = $validated['specific_date'] ?? null;
        $schedule->schedule_date = $scheduleDate;

        $schedule->save();

        return redirect()->route('doctor.schedule.index')->with('success', 'Schedule created successfully');
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
            'staff_id' => 'required|exists:staff,id',
            'notes' => 'nullable|string|max:255',
            'specific_date' => 'nullable|date',
        ]);

        // Determine schedule_date based on specific_date or day_of_week
        if (isset($validated['specific_date'])) {
            $scheduleDate = $validated['specific_date'];
        } else {
            // Set schedule_date to the next occurrence of the day of week
            $today = Carbon::today();
            $dayOfWeek = (int)$validated['day_of_week'];
            $scheduleDate = $today->dayOfWeek === $dayOfWeek
                ? $today->format('Y-m-d')
                : $today->next($dayOfWeek)->format('Y-m-d');
        }

        $schedule->update([
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'is_available' => $validated['is_available'] ?? true,
            'max_appointments' => $validated['max_appointments'],
            'staff_id' => $validated['staff_id'],
            'notes' => $validated['notes'] ?? null,
            'specific_date' => $validated['specific_date'] ?? null,
            'schedule_date' => $scheduleDate,
        ]);

        return redirect()->route('doctor.schedule.index')->with('success', 'Schedule updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $schedule = DoctorSchedule::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $schedule->delete();

        return redirect()->route('doctor.schedule.index')->with('success', 'Schedule deleted successfully');
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
            'schedules.*.staff_id' => 'required|exists:staff,id',
            'schedules.*.notes' => 'nullable|string|max:255',
            'schedules.*.specific_date' => 'nullable|date',
        ]);

        $schedules = $request->input('schedules');

        foreach ($schedules as $scheduleData) {
            // Determine schedule_date
            if (isset($scheduleData['specific_date'])) {
                $scheduleDate = $scheduleData['specific_date'];
            } else {
                // Set schedule_date to the next occurrence of the day of week
                $today = Carbon::today();
                $dayOfWeek = (int)$scheduleData['day_of_week'];
                $scheduleDate = $today->dayOfWeek === $dayOfWeek
                    ? $today->format('Y-m-d')
                    : $today->next($dayOfWeek)->format('Y-m-d');
            }

            DoctorSchedule::create([
                'doctor_id' => Auth::id(),
                'staff_id' => $scheduleData['staff_id'],
                'day_of_week' => $scheduleData['day_of_week'],
                'start_time' => $scheduleData['start_time'],
                'end_time' => $scheduleData['end_time'],
                'is_available' => $scheduleData['is_available'] ?? true,
                'max_appointments' => $scheduleData['max_appointments'],
                'notes' => $scheduleData['notes'] ?? null,
                'specific_date' => $scheduleData['specific_date'] ?? null,
                'schedule_date' => $scheduleDate,
            ]);
        }

        return redirect()->route('doctor.schedule.index')->with('success', 'Schedules created successfully');
    }

    /**
     * View schedules for a specific staff member
     */
    public function viewStaffSchedule($staffId)
    {
        $user = Auth::user();

        // Verify this staff belongs to the doctor
        $staff = User::where('id', $staffId)
            ->where('user_role', 'staff')
            ->firstOrFail();

        $schedules = DoctorSchedule::where('doctor_id', $user->id)
            ->where('staff_id', $staffId)
            ->orderBy('day_of_week')
            ->get();

        return Inertia::render('Doctor/StaffSchedule', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'staff' => $staff,
            'schedules' => $schedules,
        ]);
    }
}
