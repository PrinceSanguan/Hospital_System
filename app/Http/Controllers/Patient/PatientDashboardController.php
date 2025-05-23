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
use App\Models\Patient;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\LabResult;

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
            ->where(function ($query) {
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
            ->with(['doctorProfile', 'schedules', 'services'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->doctorProfile?->specialization ?? '', // Changed from 'specialty' to 'specialization'
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
            'upcomingAppointments' => $upcomingAppointments->map(function ($appointment) {
                // Make sure doctor information is always included
                return [
                    'id' => $appointment->id,
                    'appointment_date' => $appointment->appointment_date,
                    'status' => $appointment->status,
                    'record_type' => $appointment->record_type,
                    'details' => $appointment->details,
                    'assignedDoctor' => $appointment->assignedDoctor ? [
                        'id' => $appointment->assignedDoctor->id,
                        'name' => $appointment->assignedDoctor->name
                    ] : null
                ];
            }),
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

        // Check database connection first
        try {
            DB::connection()->getPdo();
            Log::info('Database connection established');
        } catch (\Exception $e) {
            Log::error('Database connection failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withErrors(['error' => 'Database connection error. Please try again later.']);
        }

        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
            'service_id' => 'nullable|numeric',
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

        // Begin database transaction for consistency
        DB::beginTransaction();

        try {
            // Format the appointment date and time correctly
            $appointmentDateTime = $request->appointment_date . ' ' . $request->appointment_time;
            Log::info('Formatting appointment date and time', [
                'date' => $request->appointment_date,
                'time' => $request->appointment_time,
                'combined' => $appointmentDateTime
            ]);

            // Validate the doctor exists
            if (!$doctor) {
                Log::error('Doctor not found', ['doctor_id' => $request->doctor_id]);
                throw new \Exception("Doctor with ID {$request->doctor_id} not found");
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
            }

            // Add vital signs if provided
            if (
                $request->temperature || $request->pulse_rate || $request->respiratory_rate ||
                $request->blood_pressure || $request->oxygen_saturation
            ) {
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
                try {
                    $service = DoctorService::find($request->service_id);
                    if ($service) {
                        $details['service'] = [
                            'id' => $service->id,
                            'name' => $service->name,
                            'price' => $service->price,
                            'duration_minutes' => $service->duration_minutes,
                        ];
                    } else {
                        Log::warning('Service not found', ['service_id' => $request->service_id]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error retrieving service', [
                        'service_id' => $request->service_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // 1. Create the patient record (appointment)
            $patientRecord = new PatientRecord();
            $patientRecord->patient_id = $user->id;
            $patientRecord->assigned_doctor_id = $doctor->id;
            $patientRecord->record_type = 'medical_checkup';
            $patientRecord->status = 'pending';

            // Format the appointment date properly
            try {
                $parsedDate = new \DateTime($appointmentDateTime);
                $patientRecord->appointment_date = $parsedDate->format('Y-m-d H:i:s');
                Log::info('Setting appointment date', [
                    'appointment_date' => $patientRecord->appointment_date,
                    'original_input' => $appointmentDateTime
                ]);
            } catch (\Exception $e) {
                Log::error('Error parsing appointment date', [
                    'input' => $appointmentDateTime,
                    'error' => $e->getMessage()
                ]);
                throw new \Exception('Invalid appointment date format: ' . $appointmentDateTime);
            }

            // If service_id is provided, associate it with the appointment
            if ($request->has('service_id') && !empty($request->service_id)) {
                $patientRecord->service_id = $request->service_id;
                Log::info('Service associated with appointment', ['service_id' => $request->service_id]);
            }

            $patientRecord->details = json_encode($details);
            $patientRecord->save();

            Log::info('Created patient record', [
                'record_id' => $patientRecord->id,
                'patient_id' => $user->id,
                'doctor_id' => $doctor->id
            ]);

            // 2. Create entry in the appointments table as well for staff view
            // First check if the user has a corresponding patient record
            $patientData = Patient::where('user_id', $user->id)->first();

            if (!$patientData) {
                // Instead of throwing an exception, create a new Patient record
                Log::info('Creating new patient record for user', ['user_id' => $user->id]);

                $patientData = new Patient();
                $patientData->user_id = $user->id;
                $patientData->name = $user->name;
                $patientData->reference_number = 'PAT' . str_pad($user->id, 6, '0', STR_PAD_LEFT);

                // Extract data from the patient info in the request
                $patientData->date_of_birth = $request->birthdate;
                $patientData->address = $request->address;

                // If gender is provided in the request, use it, otherwise default to null
                $patientData->gender = $request->gender ?? null;
                $patientData->contact_number = $user->phone ?? null;

                $patientData->save();

                Log::info('Created new patient record', ['patient_id' => $patientData->id]);
            }

            // Now create the appointment entry
            $appointment = new \App\Models\Appointment();
            $appointment->patient_id = $patientData->id;

            // Get the correct doctor_id from the doctors table instead of using user_id
            $doctorRecord = \App\Models\Doctor::where('user_id', $doctor->id)->first();

            if (!$doctorRecord) {
                // If no doctor record exists, create one
                Log::info('Creating new doctor record for user', ['user_id' => $doctor->id]);

                $doctorRecord = new \App\Models\Doctor();
                $doctorRecord->user_id = $doctor->id;
                $doctorRecord->name = $doctor->name;
                $doctorRecord->specialization = $doctor->doctorProfile?->specialization ?? '';
                $doctorRecord->license_number = $doctor->doctorProfile?->license_number ?? null;
                $doctorRecord->contact_number = $doctor->phone ?? null;
                $doctorRecord->save();

                Log::info('Created new doctor record', ['doctor_id' => $doctorRecord->id]);
            }

            // Use the correct doctor ID from the doctors table
            $appointment->doctor_id = $doctorRecord->id;
            $appointment->assigned_doctor_id = $doctor->id; // Keep the user_id for assigned_doctor

            // Format appointment date the same way
            $appointment->appointment_date = $patientRecord->appointment_date;

            $appointment->status = 'pending';
            $appointment->reason = $request->reason;
            $appointment->notes = $request->notes ?? '';
            $appointment->details = json_encode($details);
            $appointment->record_type = 'medical_checkup';
            $appointment->reference_number = 'APP' . str_pad($patientRecord->id, 6, '0', STR_PAD_LEFT);

            try {
                $appointment->save();

                Log::info('Created appointment record', [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $patientData->id,
                    'doctor_id' => $doctor->id,
                    'reference_number' => $appointment->reference_number
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to save appointment', [
                    'error' => $e->getMessage(),
                    'appointment_data' => [
                        'patient_id' => $patientData->id,
                        'doctor_id' => $doctor->id,
                        'appointment_date' => $appointment->appointment_date
                    ]
                ]);
                throw new \Exception('Failed to save appointment: ' . $e->getMessage());
            }

            // Create notification for the doctor
            Notification::create([
                'user_id' => $doctor->id,
                'type' => Notification::TYPE_APPOINTMENT_REQUEST,
                'title' => 'New Appointment Request',
                'message' => "Patient {$user->name} has requested an appointment on " . date('F j, Y', strtotime($request->appointment_date)) . " at {$request->appointment_time}.",
                'related_id' => $patientRecord->id,
                'related_type' => 'appointment',
                'data' => [
                    'appointment_id' => $patientRecord->id,
                    'patient_id' => $user->id,
                    'patient_name' => $user->name,
                    'appointment_date' => $request->appointment_date,
                    'appointment_time' => $request->appointment_time,
                    'has_patient_info' => true,
                    'has_vital_signs' => true,
                ]
            ]);

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', 'Appointment request has been submitted. You will be notified when the doctor confirms your appointment.');
        } catch (\Exception $e) {
            // Rollback transaction if there was an error
            DB::rollBack();

            Log::error('Failed to save appointment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'patient_id' => $user->id,
                'doctor_id' => $request->doctor_id
            ]);

            // For debugging purposes - return detailed error in development
            if (config('app.debug')) {
                return redirect()->back()->withErrors(['error' => 'Failed to save appointment: ' . $e->getMessage()]);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to save appointment. Please try again.']);
        }
    }

    // List all patient appointments
    public function listAppointments()
    {
        $user = Auth::user();

        $appointments = PatientRecord::where('patient_id', $user->id)
            ->where(function ($query) {
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
            'appointments' => $appointments->map(function ($appointment) {
                // Make sure doctor information is always included
                return [
                    'id' => $appointment->id,
                    'appointment_date' => $appointment->appointment_date,
                    'status' => $appointment->status,
                    'record_type' => $appointment->record_type,
                    'details' => $appointment->details,
                    'assignedDoctor' => $appointment->assignedDoctor ? [
                        'id' => $appointment->assignedDoctor->id,
                        'name' => $appointment->assignedDoctor->name
                    ] : null
                ];
            }),
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
            ->with(['doctorProfile', 'schedules', 'services'])
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
            ->where(function ($query) {
                $query->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
                    ->orWhere('record_type', PatientRecord::TYPE_MEDICAL_RECORD)
                    ->orWhere('record_type', 'medical_record') // Include both forms to ensure compatibility
                    ->orWhere('record_type', 'prescription')
                    ->orWhere('record_type', 'medical_checkup'); // Include both forms to ensure compatibility
            })
            ->where('status', 'completed') // Only show completed records to patients
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

        // Get lab records from PatientRecord table (lab appointments)
        $labRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->latest('updated_at')
            ->paginate(10);

        // Find patient record linked to this user
        $patient = \App\Models\Patient::where('user_id', $user->id)->first();

        // Get uploaded lab results if patient record exists
        $uploadedLabResults = [];
        if ($patient) {
            // Get lab results from LabResult table (uploaded files)
            $uploadedLabResults = \App\Models\LabResult::where('patient_id', $patient->id)
                ->latest('test_date')
                ->get()
                ->map(function ($result) {
                    return [
                        'id' => 'lab_' . $result->id, // Prefix to distinguish from PatientRecord IDs
                        'patient_id' => $result->patient_id,
                        'record_type' => 'laboratory_file',
                        'appointment_date' => $result->test_date,
                        'status' => 'completed',
                        'details' => json_encode([
                            'lab_type' => $result->test_type,
                            'notes' => $result->notes,
                            'reference_number' => 'PAT' . str_pad($result->id, 6, '0', STR_PAD_LEFT),
                            'file_path' => $result->file_path,
                            'result_date' => $result->created_at,
                        ]),
                        'created_at' => $result->created_at,
                        'updated_at' => $result->updated_at,
                        'is_file' => true
                    ];
                });
        }

        // Add uploaded lab results to paginated records
        $labRecords->getCollection()->transform(function ($record) {
            $record->is_file = false;
            return $record;
        });

        // Combine both types of results if there are uploaded lab results
        if (count($uploadedLabResults) > 0) {
            $combinedRecords = $labRecords->getCollection()->concat($uploadedLabResults);
            $combinedRecords = $combinedRecords->sortByDesc('updated_at')->values();

            $labRecords->setCollection($combinedRecords->slice(
                ($labRecords->currentPage() - 1) * $labRecords->perPage(),
                $labRecords->perPage()
            ));

            // Update total count for pagination
            $labRecords->total(count($combinedRecords));
        }

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
            ->with(['doctorProfile', 'schedules', 'services'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->doctorProfile->specialization ?? '',
                    'profile_image' => $doctor->doctorProfile->profile_image ?? null,
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

        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with('doctorProfile')
            ->get();

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
            ->with(['doctorProfile', 'services' => function ($query) {
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
            'user' => Auth::user(),
        ]);
    }

    /**
     * Display the doctor schedules page
     *
     * @return \Inertia\Response
     */
    public function viewDoctorSchedules()
    {
        $user = Auth::user();

        // Get all doctors
        $doctors = User::where('user_role', 'doctor')
            ->with('doctorProfile')
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->doctorProfile->specialization ?? '',
                    'profile_image' => $doctor->doctorProfile->profile_image ?? null,
                ];
            });

        return Inertia::render('Patient/ViewDoctorSchedules', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
        ]);
    }

    /**
     * Get booked time slots for a specific doctor and date
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBookedTimeSlots(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        try {
            // Find all appointments for this doctor on the selected date
            $bookedAppointments = PatientRecord::where('assigned_doctor_id', $request->doctor_id)
                ->whereDate('appointment_date', $request->date)
                ->whereIn('status', ['pending', 'confirmed']) // Only include pending and confirmed appointments
                ->get();

            // Extract the appointment times from the details JSON
            $bookedTimeSlots = [];
            foreach ($bookedAppointments as $appointment) {
                $details = json_decode($appointment->details, true);
                if (isset($details['appointment_time'])) {
                    $bookedTimeSlots[] = $details['appointment_time'];
                }
            }

            return response()->json([
                'success' => true,
                'bookedTimeSlots' => $bookedTimeSlots
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving booked time slots: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download lab result file
     */
    public function downloadLabResult($id)
    {
        try {
            $user = Auth::user();

            // Handle lab_ prefixed IDs (from uploaded files)
            if (str_starts_with($id, 'lab_')) {
                $labResultId = str_replace('lab_', '', $id);
                $patient = \App\Models\Patient::where('user_id', $user->id)->first();

                if (!$patient) {
                    abort(404, 'Patient record not found');
                }

                $labResult = \App\Models\LabResult::where('id', $labResultId)
                    ->where('patient_id', $patient->id)
                    ->first();

                if (!$labResult) {
                    abort(404, 'Lab result not found or access denied');
                }

                $publicFilePath = public_path($labResult->file_path);

                if (!file_exists($publicFilePath)) {
                    abort(404, 'File not found');
                }

                $extension = pathinfo($publicFilePath, PATHINFO_EXTENSION);
                $filename = 'lab_result_' . $labResultId . '.' . $extension;

                return response()->download($publicFilePath, $filename);
            }

            // Handle regular PatientRecord IDs
            $labRecord = PatientRecord::where('id', $id)
                ->where('patient_id', $user->id)
                ->where('record_type', 'laboratory')
                ->first();

            if (!$labRecord) {
                abort(404, 'Lab record not found or access denied');
            }

            // Find the corresponding file in lab_result directory
            $labResultDir = public_path('lab_result');

            if (!is_dir($labResultDir)) {
                abort(404, 'Lab result directory not found');
            }

            $files = scandir($labResultDir);
            $matchingFile = null;

            // Look for files that match the pattern
            foreach ($files as $file) {
                if (strpos($file, 'lab_result_') === 0 && $file !== '.' && $file !== '..') {
                    $matchingFile = $file;
                    break;
                }
            }

            if (!$matchingFile) {
                abort(404, 'No lab result file found');
            }

            $publicFilePath = public_path('lab_result/' . $matchingFile);

            if (!file_exists($publicFilePath)) {
                abort(404, 'File not found');
            }

            $extension = pathinfo($publicFilePath, PATHINFO_EXTENSION);
            $filename = 'lab_result_' . $id . '.' . $extension;

            return response()->download($publicFilePath, $filename);
        } catch (\Exception $e) {
            Log::error('Patient lab result download error: ' . $e->getMessage());
            abort(500, 'Error downloading file');
        }
    }

    /**
     * Download a medical record as PDF
     */
    public function downloadMedicalRecord($id)
    {
        try {
            $user = Auth::user();

            // Find the medical record that belongs to this patient
            $record = PatientRecord::where('id', $id)
                ->where('patient_id', $user->id)
                ->firstOrFail();

            // Assuming there's a file_path field in the medical record
            if (empty($record->file_path)) {
                abort(404, 'No file associated with this record');
            }

            $publicFilePath = public_path($record->file_path);

            if (!file_exists($publicFilePath)) {
                abort(404, 'File not found');
            }

            $extension = pathinfo($publicFilePath, PATHINFO_EXTENSION);
            $filename = 'medical_record_' . $id . '.' . $extension;

            return response()->download($publicFilePath, $filename);
        } catch (\Exception $e) {
            Log::error('Patient medical record download error: ' . $e->getMessage());
            abort(500, 'Error downloading file');
        }
    }
}
