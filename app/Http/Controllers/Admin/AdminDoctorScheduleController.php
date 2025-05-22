<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AdminDoctorScheduleController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get all doctors
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->get(['id', 'name', 'email'])
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                ];
            });        // Get all doctor schedules
        $schedules = DoctorSchedule::with('doctor')
            ->orderBy('schedule_date', 'desc')
            ->get()
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'doctor' => [
                        'id' => $schedule->doctor->id,
                        'name' => $schedule->doctor->name,
                    ],
                    'day_date' => Carbon::parse($schedule->schedule_date)->format('m/d/Y'),                    'time' => Carbon::parse($schedule->start_time)->format('H:i A') . ' - ' . 
                             Carbon::parse($schedule->end_time)->format('H:i A'),
                    'status' => $schedule->status,
                    'notes' => $schedule->notes ?? '',
                ];
            });

        return Inertia::render('Admin/DoctorSchedule', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
            'schedules' => $schedules,
            'statusOptions' => ['pending', 'approved', 'rejected'],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'notes' => 'nullable|string',
        ]);

        // Create schedule
        DoctorSchedule::create([
            'doctor_id' => $request->doctor_id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => $request->status ?? 'pending',
            'notes' => $request->notes,
        ]);

        return redirect()->route('admin.doctor-schedules')->with('success', 'Doctor schedule created successfully');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $schedule = DoctorSchedule::findOrFail($id);
        
        // Update schedule
        $schedule->update([
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        return redirect()->route('admin.doctor-schedules')->with('success', 'Doctor schedule updated successfully');
    }

    public function destroy($id)
    {
        $schedule = DoctorSchedule::findOrFail($id);
        $schedule->delete();

        return redirect()->route('admin.doctor-schedules')->with('success', 'Doctor schedule deleted successfully');
    }

    public function create()
    {
        $user = Auth::user();

        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/DoctorScheduleForm', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
        ]);
    }
}
