<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    /**
     * Display the doctor's schedule
     */
    public function index()
    {
        $user = Auth::user();
        $schedules = DoctorSchedule::where('doctor_id', $user->id)->get();

        return Inertia::render('Doctor/Schedule', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'schedules' => $schedules,
        ]);
    }

    /**
     * Store a new schedule
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_available' => 'required|boolean',
            'max_appointments' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $schedule = new DoctorSchedule();
        $schedule->doctor_id = Auth::id();
        $schedule->day_of_week = $request->day_of_week;
        $schedule->start_time = $request->start_time;
        $schedule->end_time = $request->end_time;
        $schedule->is_available = $request->is_available;
        $schedule->max_appointments = $request->max_appointments;
        $schedule->notes = $request->notes;
        $schedule->save();

        return redirect()->route('doctor.schedule.index')
            ->with('success', 'Schedule added successfully');
    }

    /**
     * Store multiple schedules
     */
    public function storeMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.start_time' => 'required|string',
            'schedules.*.end_time' => 'required|string',
            'schedules.*.is_available' => 'required|boolean',
            'schedules.*.max_appointments' => 'required|integer|min:1',
            'schedules.*.notes' => 'nullable|string|max:255',
            'schedules.*.specific_date' => 'required|date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        foreach ($request->schedules as $scheduleData) {
            $schedule = new DoctorSchedule();
            $schedule->doctor_id = Auth::id();
            $schedule->day_of_week = $scheduleData['day_of_week'];
            $schedule->start_time = $scheduleData['start_time'];
            $schedule->end_time = $scheduleData['end_time'];
            $schedule->is_available = $scheduleData['is_available'];
            $schedule->max_appointments = $scheduleData['max_appointments'];
            $schedule->notes = $scheduleData['notes'] ?? null;
            $schedule->specific_date = $scheduleData['specific_date'];
            $schedule->save();
        }

        return redirect()->route('doctor.schedule.index')
            ->with('success', 'Schedules added successfully');
    }

    /**
     * Update a schedule
     */
    public function update(Request $request, $id)
    {
        $schedule = DoctorSchedule::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'day_of_week' => 'required|integer|between:0,6',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_available' => 'required|boolean',
            'max_appointments' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
            'specific_date' => 'nullable|date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $schedule->day_of_week = $request->day_of_week;
        $schedule->start_time = $request->start_time;
        $schedule->end_time = $request->end_time;
        $schedule->is_available = $request->is_available;
        $schedule->max_appointments = $request->max_appointments;
        $schedule->notes = $request->notes;
        if (isset($request->specific_date)) {
            $schedule->specific_date = $request->specific_date;
        }
        $schedule->save();

        return redirect()->route('doctor.schedule.index')
            ->with('success', 'Schedule updated successfully');
    }

    /**
     * Delete a schedule
     */
    public function destroy($id)
    {
        $schedule = DoctorSchedule::where('doctor_id', Auth::id())
            ->findOrFail($id);

        $schedule->delete();

        return redirect()->route('doctor.schedule.index')
            ->with('success', 'Schedule deleted successfully');
    }
}
