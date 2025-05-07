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
        // Database-agnostic approach to ensure fresh data
        if (DB::connection()->getDriverName() === 'mysql') {
            // MySQL specific cache setting
            DB::statement("SET SESSION query_cache_type=0");
        }
        // For PostgreSQL we don't need to do anything special

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
                      ->orWhere('record_type', 'prescription')
                      ->orWhere('record_type', 'medical_record');
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
    public function store(Request $request)
    {
        // Log the received request data
        Log::info('Appointment request received', [
            'request_data' => $request->all(),
            'user_id' => Auth::id()
        ]);

        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'service_id' => 'nullable|exists:doctor_services,id',
            // Patient information - make these optional to allow direct booking
            'name' => 'required|string',
            'birthdate' => 'required|date',
            'age' => 'required|numeric|min:0|max:120',
            'height' => 'required|numeric|min:1',
            'weight' => 'required|numeric|min:1',
            'bmi' => 'required|numeric',
            'address' => 'required|string',
            // Make vital signs optional
            'temperature' => 'nullable|numeric|min:35|max:42',
            'pulse_rate' => 'nullable|numeric|min:40|max:220',
            'respiratory_rate' => 'nullable|numeric|min:8|max:30',
            'blood_pressure' => 'nullable|string|regex:/^\d{2,3}\/\d{2,3}$/',
            'oxygen_saturation' => 'nullable|numeric|min:80|max:100',
            // Add validation for uploaded files
            'uploaded_files' => 'nullable|string',
            'has_previous_records' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $doctor = User::findOrFail($request->doctor_id);

        // Create the patient record (appointment)
        $appointment = new PatientRecord();
        $appointment->patient_id = $user->id;
        $appointment->assigned_doctor_id = $doctor->id;
        $appointment->record_type = 'medical_checkup';
        $appointment->status = 'pending';

        // Format the appointment date and time correctly
        $appointmentDateTime = $request->appointment_date . ' ' . $request->appointment_time;
        Log::info('Formatting appointment date and time', [
            'date' => $request->appointment_date,
            'time' => $request->appointment_time,
            'combined' => $appointmentDateTime
        ]);

        $appointment->appointment_date = $appointmentDateTime;

        // If service_id is provided, associate it with the appointment
        if ($request->has('service_id') && !empty($request->service_id)) {
            $appointment->service_id = $request->service_id;
            Log::info('Service associated with appointment', ['service_id' => $request->service_id]);
        }

        // Store additional information in details field
        $details = [
            'appointment_time' => $request->appointment_time,
            'reason' => $request->reason,
            'notes' => $request->notes,
            // Patient information
            'patient_info' => [
                'name' => $request->name,
                'birthdate' => $request->birthdate,
                'age' => $request->age,
                'height' => $request->height,
                'weight' => $request->weight,
                'bmi' => $request->bmi,
                'address' => $request->address,
            ],
        ];

        // Add uploaded files information if provided
        if ($request->has('uploaded_files') && !empty($request->uploaded_files)) {
            try {
                $uploadedFiles = json_decode($request->uploaded_files, true);

                // Log the decoded data to help with debugging
                Log::info('Processing uploaded files for appointment', [
                    'json_decode_result' => $uploadedFiles,
                    'json_last_error' => json_last_error(),
                    'json_last_error_msg' => json_last_error_msg(),
                    'raw_input' => $request->uploaded_files
                ]);

                if (json_last_error() === JSON_ERROR_NONE && is_array($uploadedFiles) && count($uploadedFiles) > 0) {
                    $details['uploaded_files'] = $uploadedFiles;

                    Log::info('Added uploaded files to appointment details', [
                        'files_count' => count($uploadedFiles),
                        'appointment_id' => $appointment->id ?? 'not_saved_yet',
                        'files_data' => $uploadedFiles
                    ]);
                } else {
                    Log::warning('Failed to parse uploaded files JSON properly', [
                        'uploaded_files' => $request->uploaded_files,
                        'json_last_error' => json_last_error(),
                        'json_last_error_msg' => json_last_error_msg()
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Error parsing uploaded files JSON', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'uploaded_files' => $request->uploaded_files
                ]);
            }
        } else {
            Log::info('No uploaded files information provided in the request', [
                'request_has_uploaded_files' => $request->has('uploaded_files'),
                'uploaded_files_value' => $request->uploaded_files ?? 'null'
            ]);
        }

        // Add vital signs if provided
        if ($request->temperature || $request->pulse_rate || $request->respiratory_rate ||
            $request->blood_pressure || $request->oxygen_saturation) {
            $details['vital_signs'] = [
                'temperature' => $request->temperature,
                'pulse_rate' => $request->pulse_rate,
                'respiratory_rate' => $request->respiratory_rate,
                'blood_pressure' => $request->blood_pressure,
                'oxygen_saturation' => $request->oxygen_saturation,
                'recorded_at' => now()->format('Y-m-d H:i:s'),
            ];
        }

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

        try {
            $saved = $appointment->save();
            Log::info('Appointment saved result', [
                'saved' => $saved,
                'appointment_id' => $appointment->id,
                'appointment_data' => $appointment->toArray()
            ]);

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
                    'has_patient_info' => true,
                    'has_vital_signs' => true,
                ]
            ]);

            return redirect()->back()->with('success', 'Appointment request has been submitted. You will be notified when the doctor confirms your appointment.');
        } catch (\Exception $e) {
            Log::error('Failed to save appointment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withErrors(['error' => 'Failed to save appointment. Please try again.']);
        }
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
    public function bookAppointment(Request $request)
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

        // Check if a doctor_id is provided in the query string
        $preSelectedDoctorId = $request->query('doctor_id') ? (int)$request->query('doctor_id') : null;

        return Inertia::render('Patient/BookAppointment', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
            'notifications' => $notifications,
            'preSelectedDoctorId' => $preSelectedDoctorId,
        ]);
    }

    // List all patient medical records
    public function listRecords()
    {
        $user = Auth::user();

        $records = PatientRecord::where('patient_id', $user->id)
            ->where(function($query) {
                $query->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
                      ->orWhere('record_type', PatientRecord::TYPE_MEDICAL_RECORD)
                      ->orWhere('record_type', 'medical_record') // Include both forms to ensure compatibility
                      ->orWhere('record_type', 'prescription')
                      ->orWhere('record_type', 'medical_checkup'); // Include both forms to ensure compatibility
            })
            ->with('assignedDoctor')
            ->orderBy('updated_at', 'desc')
            ->get();

        // Log for debugging
        Log::info('Patient records', [
            'patient_id' => $user->id,
            'count' => $records->count(),
            'types' => $records->pluck('record_type')->toArray()
        ]);

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

        $labRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->latest('updated_at')
            ->paginate(10);

        return Inertia::render('Patient/LabResults', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'labRecords' => $labRecords
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

    /**
     * Show the lab appointment booking page
     */
    public function bookLabAppointment()
    {
        $user = Auth::user();

        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('Patient/BookLabAppointment', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'doctors' => $doctors
        ]);
    }

    /**
     * Store a new lab appointment request
     */
    public function storeLabAppointment(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'assigned_doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after:yesterday',
            'appointment_time' => 'required',
            'lab_type' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $record = new PatientRecord();
        $record->patient_id = $user->id;
        $record->assigned_doctor_id = $validated['assigned_doctor_id'];
        $record->record_type = 'laboratory';
        $record->appointment_date = $validated['appointment_date'];
        $record->status = 'pending';

        $details = [
            'lab_type' => $validated['lab_type'],
            'appointment_time' => $validated['appointment_time'],
            'notes' => $validated['notes'] ?? '',
            'requested_by' => 'patient',
            'request_date' => now()->toDateString(),
        ];

        $record->details = json_encode($details);
        $record->save();

        return redirect()->route('patient.appointments.index')
            ->with('success', 'Laboratory appointment request submitted successfully. You will be notified once it is confirmed.');
    }

    /**
     * Show lab results for a patient
     */
    public function viewLabResults($id)
    {
        $user = Auth::user();

        $record = PatientRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        return Inertia::render('Patient/LabResultDetail', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'record' => $record
        ]);
    }

    /**
     * Display a detailed view of a specific doctor's profile.
     */
    public function viewDoctor($id)
    {
        $doctor = \App\Models\User::where('user_role', \App\Models\User::ROLE_DOCTOR)
            ->with(['doctorProfile', 'services' => function($query) {
                $query->where('is_active', true);
            }, 'schedules'])
            ->findOrFail($id);

        // Get available dates based on doctor schedules
        $availableDates = [];
        $availableTimeSlots = [];

        if ($doctor->schedules) {
            foreach ($doctor->schedules as $schedule) {
                if ($schedule->is_available) {
                    // Add available days from schedules
                    $availableDates[] = [
                        'day' => $schedule->day_of_week,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                    ];
                }
            }
        }

        return inertia('Patient/DoctorProfile', [
            'doctor' => $doctor,
            'availableDates' => $availableDates,
            'user' => auth()->user(),
        ]);
    }
}
