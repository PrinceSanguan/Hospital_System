<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DoctorScheduleManagementController extends Controller
{
    /**
     * Display a listing of all doctor schedules.
     */
    public function index()
    {
        $user = Auth::user();

        // Get all doctors
        $doctors = User::where('user_role', 'doctor')->orderBy('name')->get();

        // Get all schedules
        $schedules = DoctorSchedule::with('doctor')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ClinicalStaff/DoctorScheduleManagement', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
            'schedules' => $schedules,
        ]);
    }

    /**
     * Store a new doctor schedule created by staff.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'day_of_week' => 'required|string|in:0,1,2,3,4,5,6',
            'start_time' => 'required|string',
            'end_time' => 'required|string|after:start_time',
            'notes' => 'nullable|string',
            'specific_date' => 'nullable|date',
        ]);

        // Check for existing schedule that might conflict
        $query = DoctorSchedule::where('doctor_id', $validated['doctor_id'])
            ->where('day_of_week', $validated['day_of_week']);

        if (!empty($validated['specific_date'])) {
            $query->where('specific_date', $validated['specific_date']);
        } else {
            $query->whereNull('specific_date');
        }

        $existingSchedule = $query->where(function($q) use ($validated) {
            $q->where(function($inner) use ($validated) {
                $inner->where('start_time', '<=', $validated['start_time'])
                      ->where('end_time', '>', $validated['start_time']);
            })->orWhere(function($inner) use ($validated) {
                $inner->where('start_time', '<', $validated['end_time'])
                      ->where('end_time', '>=', $validated['end_time']);
            });
        })->first();

        if ($existingSchedule) {
            return back()->withErrors([
                'time_conflict' => 'This schedule conflicts with an existing schedule for this doctor.'
            ]);
        }

        // Determine schedule_date based on specific_date or day_of_week
        if (!empty($validated['specific_date'])) {
            $scheduleDate = $validated['specific_date'];
        } else {
            // If day_of_week is provided, set schedule_date to the next occurrence of that day
            $today = Carbon::today();
            $dayOfWeek = (int)$validated['day_of_week'];
            $scheduleDate = $today->dayOfWeek === $dayOfWeek
                ? $today->format('Y-m-d')
                : $today->next($dayOfWeek)->format('Y-m-d');
        }

        // Create new schedule - since staff is creating it, it's automatically approved
        $schedule = DoctorSchedule::create([
            'doctor_id' => $validated['doctor_id'],
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'specific_date' => $validated['specific_date'] ?? null,
            'schedule_date' => $scheduleDate,
            'notes' => $validated['notes'] ?? null,
            'is_approved' => true,
            'status' => 'approved',
            'is_available' => true,
            'max_appointments' => 10, // Default value, could be made configurable
        ]);

        return redirect()->route('staff.doctor-schedules.index')->with('success', 'Doctor schedule created successfully');
    }

    /**
     * Display schedules for a specific doctor.
     */
    public function doctorSchedules($doctorId)
    {
        $user = Auth::user();
        $doctor = User::where('user_role', 'doctor')->findOrFail($doctorId);

        $schedules = DoctorSchedule::where('doctor_id', $doctorId)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->paginate(15);

        return Inertia::render('Staff/DoctorScheduleDetails', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctor' => $doctor,
            'schedules' => $schedules,
        ]);
    }

    /**
     * Approve a doctor's schedule.
     */
    public function approveSchedule($id)
    {
        $schedule = DoctorSchedule::findOrFail($id);

        $schedule->update([
            'is_approved' => true,
            'status' => 'approved'
        ]);

        return redirect()->back()->with('success', 'Schedule approved successfully');
    }

    /**
     * Reject a doctor's schedule with a note.
     */
    public function rejectSchedule(Request $request, $id)
    {
        $request->validate([
            'rejection_note' => 'required|string|max:255',
        ]);

        $schedule = DoctorSchedule::findOrFail($id);

        $schedule->update([
            'is_approved' => false,
            'status' => 'rejected',
            'rejection_note' => $request->rejection_note
        ]);

        return redirect()->back()->with('success', 'Schedule rejected successfully');
    }

    /**
     * Edit a doctor's schedule.
     */
    public function editSchedule(Request $request, $id)
    {
        $schedule = DoctorSchedule::findOrFail($id);

        $validated = $request->validate([
            'day_of_week' => 'required|string|in:0,1,2,3,4,5,6',
            'start_time' => 'required|string',
            'end_time' => 'required|string|after:start_time',
            'notes' => 'nullable|string',
            'specific_date' => 'nullable|date',
        ]);

        // Determine schedule_date when updating as well
        if (!empty($validated['specific_date'])) {
            $validated['schedule_date'] = $validated['specific_date'];
        } else {
            // If day_of_week is provided, set schedule_date to the next occurrence of that day
            $today = Carbon::today();
            $dayOfWeek = (int)$validated['day_of_week'];
            $validated['schedule_date'] = $today->dayOfWeek === $dayOfWeek
                ? $today->format('Y-m-d')
                : $today->next($dayOfWeek)->format('Y-m-d');
        }

        $schedule->update($validated);

        return redirect()->back()->with('success', 'Schedule updated successfully');
    }
}
