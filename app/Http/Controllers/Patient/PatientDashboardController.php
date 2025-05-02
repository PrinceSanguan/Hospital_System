<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use App\Models\DoctorSchedule;
use App\Models\DoctorService;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PatientDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get upcoming appointments
        $upcomingAppointments = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('appointment_date', '>=', now())
            ->where('status', 'pending')
            ->orderBy('appointment_date', 'asc')
            ->take(5)
            ->get();

        // Get lab results
        $labResults = PatientRecord::where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->whereNotNull('lab_results')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        // Get medical records
        $medicalRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('record_type', 'medical_checkup')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        // Get doctors with schedules and services
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['schedules' => function($query) {
                $query->where('is_available', true);
            }])
            ->with(['services' => function($query) {
                $query->where('is_active', true);
            }])
            ->get()
            ->map(function($doctor) {
                // Only include doctors who have set up their schedules
                if ($doctor->schedules->isEmpty()) {
                    return null;
                }

                // Format doctor data for frontend
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->profile_specialty ?? 'General Physician',
                    'image' => $doctor->profile_image ?? 'https://ui.shadcn.com/avatars/01.png',
                    'schedules' => $doctor->schedules,
                    'services' => $doctor->services->map(function($service) {
                        return [
                            'id' => $service->id,
                            'name' => $service->name,
                            'description' => $service->description,
                            'duration_minutes' => $service->duration_minutes,
                            'price' => $service->price,
                        ];
                    }),
                ];
            })
            ->filter() // Remove null values (doctors without schedules)
            ->values(); // Re-index array

        return Inertia::render('Patient/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'upcomingAppointments' => $upcomingAppointments,
            'labResults' => $labResults,
            'medicalRecords' => $medicalRecords,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Store a new appointment request
     */
    public function storeAppointment(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'service_id' => 'nullable|exists:doctor_services,id',
        ]);

        $user = Auth::user();
        $doctor = User::findOrFail($request->doctor_id);

        // Create the patient record (appointment)
        $appointment = new PatientRecord();
        $appointment->patient_id = $user->id;
        $appointment->assigned_doctor_id = $doctor->id;
        $appointment->record_type = 'medical_checkup';
        $appointment->status = 'pending';
        $appointment->appointment_date = $request->appointment_date;

        // Store additional information in details field
        $details = [
            'appointment_time' => $request->appointment_time,
            'reason' => $request->reason,
            'notes' => $request->notes,
        ];

        // Add service if selected
        if ($request->service_id) {
            $service = DoctorService::findOrFail($request->service_id);
            $details['service'] = [
                'id' => $service->id,
                'name' => $service->name,
                'price' => $service->price,
                'duration_minutes' => $service->duration_minutes,
            ];
        }

        $appointment->details = json_encode($details);
        $appointment->save();

        // Create notification for the doctor
        Notification::create([
            'user_id' => $doctor->id,
            'type' => Notification::TYPE_APPOINTMENT_REQUEST,
            'title' => 'New Appointment Request',
            'message' => "Patient {$user->name} has requested an appointment on " . date('F j, Y', strtotime($request->appointment_date)) . " at {$request->appointment_time}.",
            'related_id' => $appointment->id,
            'related_type' => 'appointment',
            'data' => [
                'appointment_id' => $appointment->id,
                'patient_id' => $user->id,
                'patient_name' => $user->name,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
            ]
        ]);

        return redirect()->back()->with('success', 'Appointment request has been submitted. You will be notified when the doctor confirms your appointment.');
    }
}
