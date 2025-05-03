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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PatientDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get upcoming appointments - make sure we're getting the latest status
        // Get upcoming appointments - make sure we're getting the latest status without caching
        // First clear any query cache to ensure we have fresh data
        DB::statement("SET SESSION query_cache_type=0");

        // Directly query for appointments with pending or confirmed status
        $upcomingAppointments = PatientRecord::where('patient_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('appointment_date', '>=', now()->startOfDay())
            ->with('assignedDoctor')
            ->orderBy('appointment_date', 'asc')
            ->get();

        // Debug the SQL query being executed
        Log::info('Upcoming appointments query', [
            'query' => PatientRecord::where('patient_id', $user->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('appointment_date', '>=', now()->startOfDay())
                ->toSql(),
            'count' => $upcomingAppointments->count(),
            'appointment_ids' => $upcomingAppointments->pluck('id')->toArray(),
            'appointment_statuses' => $upcomingAppointments->pluck('status')->toArray()
        ]);

        // Force fresh data by avoiding any potential caching
        $upcomingAppointments->load(['assignedDoctor']);

        // Debug appointments to check statuses
        Log::info('Patient appointments statuses:', $upcomingAppointments->pluck('status', 'id')->toArray());

        // Get lab results
        $labResults = PatientRecord::where('patient_id', $user->id)
            ->where('record_type', 'laboratory_test')
            ->whereNotNull('lab_results')
            ->orderBy('updated_at', 'desc')
            ->get();

        // Get medical records
        $medicalRecords = PatientRecord::where('patient_id', $user->id)
            ->where(function($query) {
                $query->where('record_type', 'medical_checkup')
                      ->orWhere('record_type', 'prescription');
            })
            ->with('assignedDoctor')
            ->orderBy('updated_at', 'desc')
            ->get();

        // Get unread notifications count
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'read' => !is_null($notification->read_at),
                    'created_at' => $notification->created_at,
                    'related_id' => $notification->related_id,
                    'related_type' => $notification->related_type,
                ];
            });

        // Get available doctors
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['schedules', 'services'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->specialty ?? 'General Practitioner',
                    'image' => $doctor->profile_photo ?? '/placeholder-avatar.jpg',
                    'availability' => $doctor->availability ?? [],
                    'schedules' => $doctor->schedules,
                    'services' => $doctor->services,
                ];
            });

        return Inertia::render('Patient/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'upcomingAppointments' => $upcomingAppointments,
            'labResults' => $labResults,
            'medicalRecords' => $medicalRecords,
            'notifications' => $notifications,
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

        // Format the appointment date and time correctly
        $appointmentDateTime = $request->appointment_date . ' ' . $request->appointment_time;
        $appointment->appointment_date = $appointmentDateTime;

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

    // List all patient appointments
    public function listAppointments()
    {
        $user = Auth::user();

        $appointments = PatientRecord::where('patient_id', $user->id)
            ->where(function($query) {
                $query->where('record_type', 'medical_checkup')
                      ->orWhere('record_type', 'laboratory_test');
            })
            ->with('assignedDoctor')
            ->orderBy('appointment_date', 'desc')
            ->get();

        // Get unread notifications
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Patient/Appointments', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointments' => $appointments,
            'notifications' => $notifications,
        ]);
    }

    // View a specific appointment
    public function viewAppointment($id)
    {
        $user = Auth::user();

        $appointment = PatientRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->with('assignedDoctor')
            ->firstOrFail();

        return Inertia::render('Patient/AppointmentDetails', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointment' => $appointment
        ]);
    }

    // Show booking form
    public function bookAppointment()
    {
        $user = Auth::user();

        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['schedules', 'services'])
            ->get();

        // Get notifications for the user
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Patient/BookAppointment', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
            'notifications' => $notifications,
        ]);
    }

    // List all patient medical records
    public function listRecords()
    {
        $user = Auth::user();

        $records = PatientRecord::where('patient_id', $user->id)
            ->where(function($query) {
                $query->where('record_type', 'medical_checkup')
                      ->orWhere('record_type', 'prescription');
            })
            ->with('assignedDoctor')
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Patient/Records', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'records' => $records
        ]);
    }

    // List lab results
    public function listLabResults()
    {
        $user = Auth::user();

        $labResults = PatientRecord::where('patient_id', $user->id)
            ->where('record_type', 'laboratory_test')
            ->whereNotNull('lab_results')
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('Patient/LabResults', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'labResults' => $labResults
        ]);
    }

    // View a specific record
    public function viewRecord($id)
    {
        $user = Auth::user();

        $record = PatientRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->with('assignedDoctor')
            ->firstOrFail();

        return Inertia::render('Patient/RecordDetails', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record
        ]);
    }

    // List all doctors
    public function listDoctors()
    {
        $user = Auth::user();

        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['schedules', 'services'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->specialty ?? 'General Practitioner',
                    'image' => $doctor->profile_photo ?? '/placeholder-avatar.jpg',
                    'availability' => $doctor->availability ?? [],
                    'schedules' => $doctor->schedules,
                    'services' => $doctor->services,
                ];
            });

        // Get notifications for the user
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Patient/Doctors', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
            'notifications' => $notifications,
        ]);
    }

    // View profile
    public function viewProfile()
    {
        $user = Auth::user();

        return Inertia::render('Patient/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ]
        ]);
    }

    // Update profile
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        // Update user data in the database
        User::where('id', $user->id)->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return back()->with('success', 'Profile updated successfully');
    }
}
