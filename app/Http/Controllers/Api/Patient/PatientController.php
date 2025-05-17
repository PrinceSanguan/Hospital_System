<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\PatientRecord;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use App\Models\DoctorService;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Appointment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Models\DoctorSchedule;


class PatientController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();

        // Get upcoming appointments - make sure we're getting the latest status without caching
        // Database-agnostic approach to ensure fresh data
        if (DB::connection()->getDriverName() === 'mysql') {
            // MySQL specific cache setting
            DB::statement("SET SESSION query_cache_type=0");
        }

        // Directly query for appointments with pending or confirmed status
        $upcomingAppointments = PatientRecord::where('patient_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('appointment_date', '>=', now()->startOfDay())
            ->with('assignedDoctor')
            ->orderBy('appointment_date', 'asc')
            ->get();

        // Force fresh data by avoiding any potential caching
        $upcomingAppointments->load(['assignedDoctor']);

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
                    'specialty' => $doctor->doctorProfile?->specialization ?? '',
                    'image' => $doctor->profile_photo ?? '/placeholder-avatar.jpg',
                    'availability' => $doctor->availability ?? [],
                    'schedules' => $doctor->schedules,
                    'services' => $doctor->services,
                ];
            });

        return response()->json([
            'status' => 'success',
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
            return response()->json([
                'status' => 'error',
                'message' => 'Database connection error. Please try again later.'
            ], 500);
        }

        $validator = validator($request->all(), [
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

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

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
            $appointment = new Appointment();
            $appointment->patient_id = $patientData->id;

            // Get the correct doctor_id from the doctors table instead of using user_id
            $doctorRecord = Doctor::where('user_id', $doctor->id)->first();

            if (!$doctorRecord) {
                // If no doctor record exists, create one
                Log::info('Creating new doctor record for user', ['user_id' => $doctor->id]);

                $doctorRecord = new Doctor();
                $doctorRecord->user_id = $doctor->id;
                $doctorRecord->name = $doctor->name;
                $doctorRecord->specialization = $doctor->doctorProfile?->specialization ?? 'General Practitioner';
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

            return response()->json([
                'status' => 'success',
                'message' => 'Appointment request has been submitted. You will be notified when the doctor confirms your appointment.',
                'data' => [
                    'appointment_id' => $patientRecord->id,
                    'reference_number' => $appointment->reference_number,
                ]
            ]);
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

            return response()->json([
                'status' => 'error',
                'message' => config('app.debug') ?
                    'Failed to save appointment: ' . $e->getMessage() :
                    'Failed to save appointment. Please try again.'
            ], 500);
        }
    }

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

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointments' => $appointments,
            'notifications' => $notifications,
        ]);
    }

    public function viewAppointment($id)
    {
        $user = Auth::user();

        $appointment = PatientRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->with('assignedDoctor')
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointment' => $appointment
        ]);
    }

    public function bookAppointment(Request $request)
    {
        $user = Auth::user();

        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['doctorProfile', 'schedules', 'services'])
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $doctor->doctorProfile?->specialization ?? '',
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

        // Check if a doctor_id is provided in the query string
        $preSelectedDoctorId = $request->query('doctor_id') ? (int)$request->query('doctor_id') : null;

        return response()->json([
            'status' => 'success',
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

    public function listRecords()
    {
        $user = Auth::user();

        $records = PatientRecord::where('patient_id', $user->id)
            ->where(function ($query) {
                $query->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
                    ->orWhere('record_type', PatientRecord::TYPE_MEDICAL_RECORD)
                    ->orWhere('record_type', 'medical_record')
                    ->orWhere('record_type', 'prescription')
                    ->orWhere('record_type', 'medical_checkup');
            })
            ->with('assignedDoctor')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'records' => $records
        ]);
    }

    public function cancelAppointment($id)
    {
        $user = Auth::user();

        // Find the appointment
        $appointment = PatientRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->first();

        if (!$appointment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Appointment not found or you do not have permission to cancel it'
            ], 404);
        }

        // Check if appointment can be cancelled (must be pending or confirmed)
        if (!in_array($appointment->status, ['pending', 'confirmed'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'This appointment cannot be cancelled'
            ], 400);
        }

        try {
            // Begin transaction
            DB::beginTransaction();

            // Update the status
            $appointment->status = 'cancelled';
            $appointment->save();

            // Also update the corresponding entry in the appointments table if it exists
            $appointmentRecord = Appointment::where('reference_number', 'APP' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT))
                ->first();

            if ($appointmentRecord) {
                $appointmentRecord->status = 'cancelled';
                $appointmentRecord->save();
            }

            // Create notification for the doctor
            if ($appointment->assigned_doctor_id) {
                Notification::create([
                    'user_id' => $appointment->assigned_doctor_id,
                    'type' => Notification::TYPE_APPOINTMENT_CANCELLED,
                    'title' => 'Appointment Cancelled',
                    'message' => "Patient {$user->name} has cancelled their appointment scheduled for " . date('F j, Y', strtotime($appointment->appointment_date)),
                    'related_id' => $appointment->id,
                    'related_type' => 'appointment',
                    'data' => [
                        'appointment_id' => $appointment->id,
                        'patient_id' => $user->id,
                        'patient_name' => $user->name,
                        'appointment_date' => $appointment->appointment_date,
                    ]
                ]);
            }

            // Commit the transaction
            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Appointment cancelled successfully'
            ]);
        } catch (\Exception $e) {
            // Rollback if there's an error
            DB::rollBack();

            Log::error('Error cancelling appointment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'appointment_id' => $id,
                'user_id' => $user->id
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to cancel appointment. Please try again.'
            ], 500);
        }
    }

    // List lab results
    public function listLabResults()
    {
        $user = Auth::user();

        // Get lab records from PatientRecord table
        $labRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->latest('updated_at')
            ->paginate(10);

        // Find patient record linked to this user
        $patient = Patient::where('user_id', $user->id)->first();

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

        return response()->json([
            'status' => 'success',
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

        return response()->json([
            'status' => 'success',
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
                    'specialty' => $doctor->doctorProfile?->specialization ?? '',
                    'profile_image' => $doctor->doctorProfile?->profile_image ?
                        (str_starts_with($doctor->doctorProfile->profile_image, 'images/')
                            ? asset($doctor->doctorProfile->profile_image)
                            : asset('storage/' . $doctor->doctorProfile->profile_image))
                        : null,
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

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'doctors' => $doctors,
            'notifications' => $notifications,
        ]);
    }

    // Get user profile
    public function getProfile()
    {
        $user = Auth::user();

        return response()->json([
            'status' => 'success',
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

        $validator = validator($request->all(), [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update user data in the database
        User::where('id', $user->id)->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully'
        ]);
    }

    // Store a new lab appointment request
    public function storeLabAppointment(Request $request)
    {
        $user = Auth::user();

        $validator = validator($request->all(), [
            'assigned_doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after:yesterday',
            'appointment_time' => 'required',
            'lab_type' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Begin transaction
        DB::beginTransaction();

        try {
            $record = new PatientRecord();
            $record->patient_id = $user->id;
            $record->assigned_doctor_id = $request->assigned_doctor_id;
            $record->record_type = 'laboratory';
            $record->appointment_date = $request->appointment_date;
            $record->status = 'pending';

            $details = [
                'lab_type' => $request->lab_type,
                'appointment_time' => $request->appointment_time,
                'notes' => $request->notes ?? '',
                'requested_by' => 'patient',
                'request_date' => now()->toDateString(),
            ];

            $record->details = json_encode($details);
            $record->save();

            // Create notification for the doctor
            Notification::create([
                'user_id' => $request->assigned_doctor_id,
                'type' => Notification::TYPE_APPOINTMENT_REQUEST,
                'title' => 'New Lab Test Request',
                'message' => "Patient {$user->name} has requested a lab test on " . date('F j, Y', strtotime($request->appointment_date)),
                'related_id' => $record->id,
                'related_type' => 'laboratory',
                'data' => [
                    'lab_id' => $record->id,
                    'patient_id' => $user->id,
                    'patient_name' => $user->name,
                    'appointment_date' => $request->appointment_date,
                ]
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Laboratory appointment request submitted successfully. You will be notified once it is confirmed.',
                'data' => [
                    'appointment_id' => $record->id
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to save lab appointment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'status' => 'error',
                'message' => config('app.debug') ?
                    'Failed to save appointment: ' . $e->getMessage() :
                    'Failed to save appointment. Please try again.'
            ], 500);
        }
    }

    // View specific lab result
    public function viewLabResults($id)
    {
        $user = Auth::user();

        $record = PatientRecord::where('id', $id)
            ->where('patient_id', $user->id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'record' => $record
        ]);
    }

    // View specific doctor
    public function viewDoctor($id)
    {
        $doctor = User::where('user_role', User::ROLE_DOCTOR)
            ->with(['doctorProfile', 'services' => function ($query) {
                $query->where('is_active', true);
            }, 'schedules' => function ($query) {
                $query->where('is_available', true)
                    ->where('is_approved', true);
            }])
            ->findOrFail($id);

        // Get available dates based on doctor schedules
        $availableDates = [];

        if ($doctor->schedules) {
            foreach ($doctor->schedules as $schedule) {
                $availableSlots = $schedule->getAvailableSlotsCount();

                $scheduleData = [
                    'id' => $schedule->id,
                    'day' => $schedule->day_of_week,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'available_slots' => $availableSlots,
                    'is_fully_booked' => $schedule->isFullyBooked(),
                ];

                // Include schedule_date if it exists
                if ($schedule->schedule_date) {
                    $scheduleData['schedule_date'] = $schedule->schedule_date->format('Y-m-d');
                }

                $availableDates[] = $scheduleData;
            }
        }

        return response()->json([
            'status' => 'success',
            'doctor' => $doctor,
            'availableDates' => $availableDates,
            'user' => Auth::user(),
        ]);
    }

    // Get booked time slots for a specific doctor and date
    public function getBookedTimeSlots(Request $request)
    {
        $validator = validator($request->all(), [
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('Fetching booked time slots', [
                'doctor_id' => $request->doctor_id,
                'date' => $request->date
            ]);

            // Find all appointments for this doctor on the selected date
            $bookedAppointments = PatientRecord::where('assigned_doctor_id', $request->doctor_id)
                ->whereDate('appointment_date', $request->date)
                ->whereIn('status', ['pending', 'confirmed']) // Only include pending and confirmed appointments
                ->get();

            Log::info('Found appointments', [
                'count' => $bookedAppointments->count(),
                'appointments' => $bookedAppointments->pluck('id')->toArray()
            ]);

            // Extract the appointment times from the details JSON
            $bookedTimeSlots = [];
            foreach ($bookedAppointments as $appointment) {
                $details = json_decode($appointment->details, true);
                if (isset($details['appointment_time'])) {
                    // Ensure consistent HH:MM format
                    $timeStr = $details['appointment_time'];
                    $time = date('H:i', strtotime($timeStr));
                    $bookedTimeSlots[] = $time;

                    Log::info('Appointment time parsed', [
                        'original' => $timeStr,
                        'formatted' => $time
                    ]);
                }
            }

            // Get doctor's schedule for this day
            $dayOfWeek = date('l', strtotime($request->date)); // Get day name (Monday, Tuesday, etc.)

            $schedule = DoctorSchedule::where('doctor_id', $request->doctor_id)
                ->where(function ($query) use ($request, $dayOfWeek) {
                    // Match either by specific date or recurring day of week
                    $query->where('schedule_date', $request->date)
                        ->orWhere('day_of_week', $dayOfWeek);
                })
                ->where('is_available', true)
                ->first();

            Log::info('Found schedule', ['schedule' => $schedule]);

            // Return schedule information for frontend to generate time slots
            $scheduleInfo = null;
            if ($schedule) {
                $scheduleInfo = [
                    'id' => $schedule->id,
                    'start_time' => date('H:i', strtotime($schedule->start_time)),
                    'end_time' => date('H:i', strtotime($schedule->end_time)),
                    'break_start' => $schedule->break_start ? date('H:i', strtotime($schedule->break_start)) : null,
                    'break_end' => $schedule->break_end ? date('H:i', strtotime($schedule->break_end)) : null,
                ];
            }

            Log::info('Returning booked times', [
                'bookedTimeSlots' => array_unique($bookedTimeSlots),
                'schedule' => $scheduleInfo
            ]);

            return response()->json([
                'status' => 'success',
                'bookedTimeSlots' => array_unique($bookedTimeSlots),
                'schedule' => $scheduleInfo
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving booked time slots', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error retrieving booked time slots: ' . $e->getMessage()
            ], 500);
        }
    }

    // Download lab result file
    public function downloadLabResult($id)
    {
        try {
            // Trim 'lab_' prefix if it exists in the ID
            if (Str::startsWith($id, 'lab_')) {
                $id = Str::replaceFirst('lab_', '', $id);
            }

            // Find patient record linked to this user
            $user = Auth::user();
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                Log::error('Patient record not found for download', ['user_id' => $user->id]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Patient record not found'
                ], 404);
            }

            // Find the lab result
            $labResult = \App\Models\LabResult::where('id', $id)
                ->where('patient_id', $patient->id)
                ->first();

            if (!$labResult) {
                Log::error('Lab result not found', ['id' => $id, 'patient_id' => $patient->id]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Lab result not found'
                ], 404);
            }

            // Check if file exists in storage
            if (!Storage::exists($labResult->file_path)) {
                Log::error('Lab result file not found in storage', [
                    'id' => $labResult->id,
                    'file_path' => $labResult->file_path
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'The lab result file could not be found'
                ], 404);
            }

            // Set the content type based on the file extension
            $extension = pathinfo($labResult->file_path, PATHINFO_EXTENSION);
            $contentType = 'application/pdf';
            if (in_array($extension, ['jpg', 'jpeg'])) {
                $contentType = 'image/jpeg';
            } elseif ($extension === 'png') {
                $contentType = 'image/png';
            }

            // Generate a filename
            $filename = $labResult->test_type . '_results.' . $extension;

            // For mobile apps, we need a publicly accessible URL
            // Copy to public storage
            $publicPath = 'public/lab_downloads/' . $filename;

            // Ensure directory exists
            if (!Storage::exists('public/lab_downloads')) {
                Storage::makeDirectory('public/lab_downloads');
            }

            // Copy the file
            Storage::copy($labResult->file_path, $publicPath);

            // Get the URL
            $fileUrl = url('storage/lab_downloads/' . $filename);

            return response()->json([
                'status' => 'success',
                'file_url' => $fileUrl,
                'file_name' => $filename,
                'content_type' => $contentType
            ]);
        } catch (\Exception $e) {
            Log::error('Error downloading lab result', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Error downloading lab result: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display all notifications
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotifications()
    {
        $user = Auth::user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark notification as read
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
    }

    /**
     * Mark all notifications as read
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Get unread notifications count
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'status' => 'success',
            'count' => $count
        ]);
    }

    /**
     * Get recent notifications
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRecent()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'notifications' => $notifications,
            'unread_count' => Notification::where('user_id', Auth::id())
                ->whereNull('read_at')
                ->count()
        ]);
    }

    public function uploadMedicalRecords(Request $request)
    {
        try {
            Log::info('Upload attempt started', [
                'user_id' => Auth::id(),
                'request_has_files' => $request->hasFile('files'),
                'request_has_base64' => $request->has('base64_files')
            ]);

            // Method 1: Handle direct file uploads
            if ($request->hasFile('files')) {
                return $this->handleDirectFileUpload($request);
            }

            // Method 2: Handle files sent as base64 data
            if ($request->has('base64_files')) {
                return $this->handleBase64FileUpload($request);
            }

            // No files found in the request
            return response()->json([
                'success' => false,
                'message' => 'No files were found in the request.',
            ], 422);
        } catch (\Exception $e) {
            Log::error('File upload error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'exception' => $e,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during file upload: ' . $e->getMessage(),
                'error_details' => env('APP_DEBUG', false) ? $e->getTrace() : null
            ], 500);
        }
    }

    /**
     * Handle base64 encoded file uploads.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    private function handleBase64FileUpload(Request $request)
    {
        $uploadedFiles = [];
        $base64Files = $request->input('base64_files');

        if (!is_array($base64Files)) {
            $base64Files = [$base64Files];
        }

        Log::info('Processing base64 file upload', [
            'files_count' => count($base64Files),
            'user_id' => Auth::id()
        ]);

        // Ensure the directory exists
        $uploadDir = 'medical-records/' . Auth::id();
        $fullPath = storage_path('app/public/' . $uploadDir);

        if (!file_exists($fullPath)) {
            if (!mkdir($fullPath, 0755, true)) {
                Log::error('Failed to create directory', [
                    'path' => $fullPath,
                    'user_id' => Auth::id()
                ]);
                throw new \Exception('Failed to create upload directory');
            }
            Log::info('Created directory for uploads', ['path' => $fullPath]);
        }

        foreach ($base64Files as $fileData) {
            // Extract base64 data and file info
            $matches = [];
            if (preg_match('/^data:(.+);base64,(.+)$/', $fileData['data'], $matches)) {
                $mimeType = $matches[1];
                $base64Data = $matches[2];
                $decodedData = base64_decode($base64Data);

                if ($decodedData === false) {
                    Log::error('Failed to decode base64 data', [
                        'user_id' => Auth::id(),
                        'mime_type' => $mimeType
                    ]);
                    throw new \Exception('Invalid base64 data');
                }

                // Get extension from mime type
                $extensions = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'application/pdf' => 'pdf',
                    'application/msword' => 'doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                ];

                $extension = $extensions[$mimeType] ?? 'bin';
                $filename = Str::random(40) . '.' . $extension;

                // Store the decoded file
                $path = $uploadDir . '/' . $filename;

                try {
                    $saved = Storage::disk('public')->put($path, $decodedData);

                    if (!$saved) {
                        Log::error('Failed to store base64 file', [
                            'path' => $path,
                            'user_id' => Auth::id()
                        ]);
                        throw new \Exception('Failed to store base64 file');
                    }

                    // Verify the file was actually saved
                    $savedFilePath = storage_path('app/public/' . $path);
                    if (!file_exists($savedFilePath)) {
                        Log::error('File not found after storage', [
                            'saved_path' => $savedFilePath
                        ]);
                        throw new \Exception('File was not saved properly');
                    }

                    Log::info('Base64 file stored successfully', [
                        'path' => $path,
                        'size' => strlen($decodedData),
                        'mime_type' => $mimeType
                    ]);

                    // Generate URL using proper method based on configuration
                    $url = url('storage/' . $path);

                    $uploadedFiles[] = [
                        'name' => $fileData['name'] ?? $filename,
                        'path' => $path,
                        'url' => $url,
                        'size' => strlen($decodedData),
                        'type' => $mimeType,
                    ];
                } catch (\Exception $e) {
                    Log::error('Error storing base64 file', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            } else {
                Log::warning('Invalid base64 data format', [
                    'user_id' => Auth::id()
                ]);
            }
        }

        Log::info('Base64 file upload completed successfully', [
            'files_count' => count($uploadedFiles)
        ]);

        return response()->json([
            'success' => true,
            'files' => $uploadedFiles,
            'message' => 'Base64 files uploaded successfully.',
        ]);
    }

    /**
     * Handle direct file uploads.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    private function handleDirectFileUpload(Request $request)
    {
        $uploadedFiles = [];
        $files = $request->file('files');

        // Handle both single file and array of files
        if (!is_array($files)) {
            $files = [$files];
        }

        Log::info('Processing direct file upload', [
            'files_count' => count($files),
            'user_id' => Auth::id()
        ]);

        // Ensure the directory exists
        $uploadDir = 'medical-records/' . Auth::id();
        $fullPath = storage_path('app/public/' . $uploadDir);

        if (!file_exists($fullPath)) {
            if (!mkdir($fullPath, 0755, true)) {
                Log::error('Failed to create directory', [
                    'path' => $fullPath,
                    'user_id' => Auth::id()
                ]);
                throw new \Exception('Failed to create upload directory');
            }
            Log::info('Created directory for uploads', ['path' => $fullPath]);
        }

        foreach ($files as $file) {
            // Basic validation
            if (!$file->isValid()) {
                Log::warning('Invalid file detected', [
                    'original_name' => $file->getClientOriginalName(),
                    'error' => $file->getError()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'One or more files are invalid.',
                ], 422);
            }

            // Create a unique filename
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

            try {
                // Store file in the public disk for easier access
                $path = $file->storeAs(
                    $uploadDir,
                    $filename,
                    'public'
                );

                Log::info('File stored successfully', [
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize()
                ]);

                if (!$path) {
                    throw new \Exception('Failed to store file: ' . $file->getClientOriginalName());
                }

                // Verify the file was actually saved
                $savedFilePath = storage_path('app/public/' . $path);
                if (!file_exists($savedFilePath)) {
                    Log::error('File not found after storage', [
                        'saved_path' => $savedFilePath
                    ]);
                    throw new \Exception('File was not saved properly: ' . $file->getClientOriginalName());
                }

                // Generate URL using proper method based on configuration
                $url = url('storage/' . $path);

                $uploadedFiles[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'url' => $url,
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            } catch (\Exception $e) {
                Log::error('Error storing file', [
                    'original_name' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                throw $e;
            }
        }

        Log::info('File upload completed successfully', [
            'files_count' => count($uploadedFiles)
        ]);

        return response()->json([
            'success' => true,
            'files' => $uploadedFiles,
            'message' => 'Files uploaded successfully.',
        ]);
    }

    public function getDoctorSchedules($doctorId = null)
    {
        try {
            // Add detailed logging
            Log::info('Getting doctor schedules', [
                'doctor_id' => $doctorId,
                'user_id' => Auth::id()
            ]);

            // If doctor ID is specified, get schedules for just that doctor
            if ($doctorId) {
                $doctor = User::where('id', $doctorId)
                    ->where('user_role', User::ROLE_DOCTOR)
                    ->first();

                if (!$doctor) {
                    Log::warning('Doctor not found', ['doctor_id' => $doctorId]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Doctor not found'
                    ], 404);
                }

                $schedules = DoctorSchedule::where('doctor_id', $doctorId)
                    ->where('is_available', true) // Only get available schedules
                    ->orderBy('day_of_week')
                    ->get()
                    ->map(function ($schedule) {
                        // Ensure time format is consistent (HH:MM format)
                        return [
                            'id' => $schedule->id,
                            'doctor_id' => $schedule->doctor_id,
                            'day_of_week' => $schedule->day_of_week,
                            'start_time' => date('H:i', strtotime($schedule->start_time)),
                            'end_time' => date('H:i', strtotime($schedule->end_time)),
                            'is_available' => $schedule->is_available,
                            'max_appointments' => $schedule->max_appointments,
                            'schedule_date' => $schedule->schedule_date ? $schedule->schedule_date->format('Y-m-d') : null,
                            'break_start' => $schedule->break_start ? date('H:i', strtotime($schedule->break_start)) : null,
                            'break_end' => $schedule->break_end ? date('H:i', strtotime($schedule->break_end)) : null,
                        ];
                    });

                Log::info('Doctor schedules retrieved', [
                    'doctor_id' => $doctorId,
                    'schedules_count' => count($schedules),
                    'schedules' => $schedules
                ]);

                return response()->json([
                    'status' => 'success',
                    'schedules' => $schedules,
                ]);
            }

            // Rest of the method for getting all doctor schedules...
        } catch (\Exception $e) {
            Log::error('Error fetching doctor schedules', [
                'doctor_id' => $doctorId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching doctor schedules: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function cleanupTempFile(Request $request)
    {
        try {
            $tempFile = $request->input('temp_file');
            if (!$tempFile) {
                return response()->json(['status' => 'error', 'message' => 'No temp file specified']);
            }

            $tempPath = 'public/temp_downloads/' . $tempFile;
            if (Storage::exists($tempPath)) {
                Storage::delete($tempPath);
                return response()->json(['status' => 'success', 'message' => 'Temporary file deleted']);
            }

            return response()->json(['status' => 'error', 'message' => 'File not found']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
