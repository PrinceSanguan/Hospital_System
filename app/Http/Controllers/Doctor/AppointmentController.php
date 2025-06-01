<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use App\Models\Notification;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class AppointmentController extends Controller
{
    /**
     * Display the doctor's appointments
     */
    public function index()
    {
        $user = Auth::user();

        // Get all appointments for this doctor - get both pending and confirmed
        $appointments = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->whereIn('status', [PatientRecord::STATUS_PENDING, 'confirmed', PatientRecord::STATUS_COMPLETED])
            ->with('patient')
            ->orderBy('appointment_date', 'desc')
            ->get();

        // Process appointment details to extract additional information
        $appointments->each(function ($appointment) {
            if ($appointment->details) {
                $details = json_decode($appointment->details, true);
                if (isset($details['appointment_time'])) {
                    $appointment->appointment_time = $details['appointment_time'];
                }
                if (isset($details['reason'])) {
                    $appointment->reason = $details['reason'];
                }
                if (isset($details['notes'])) {
                    $appointment->notes = $details['notes'];
                }
            }
        });

        return Inertia::render('Doctor/Appointments', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointments' => $appointments,
        ]);
    }

    /**
     * Show appointment details
     */
    public function show($id)
    {
        $user = Auth::user();
        $appointment = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient')
            ->findOrFail($id);

        // Get patient uploaded files if they exist
        $patientId = $appointment->patient_id;
        $uploadedFiles = [];

        // First check for files in the appointment details
        if ($appointment->details) {
            $details = is_string($appointment->details) ? json_decode($appointment->details, true) : $appointment->details;

            if (is_array($details) && isset($details['uploaded_files']) && is_array($details['uploaded_files'])) {
                Log::info('Found uploaded files in appointment details', [
                    'appointment_id' => $appointment->id,
                    'files_count' => count($details['uploaded_files']),
                    'files_data' => $details['uploaded_files']
                ]);
                $uploadedFiles = $details['uploaded_files'];
            } else {
                Log::info('No uploaded files found in appointment details or invalid format', [
                    'appointment_id' => $appointment->id,
                    'details_type' => gettype($details),
                    'has_uploaded_files_key' => is_array($details) && isset($details['uploaded_files']),
                    'uploaded_files_type' => is_array($details) && isset($details['uploaded_files']) ? gettype($details['uploaded_files']) : 'not_set'
                ]);
            }
        }

        // Only use physical files as fallback if no files are found in the appointment details
        if (empty($uploadedFiles)) {
            // Don't check all patient files - this was causing incorrect files to be shown
            // Only add fallback logic if we're reasonably sure these files belong to this appointment
            // For example, check for files created around the same time as the appointment
            $appointmentDate = new \DateTime($appointment->created_at);
            $uploadPath = 'medical-records/' . $patientId;

            if (Storage::disk('public')->exists($uploadPath)) {
                $files = Storage::disk('public')->files($uploadPath);

                foreach ($files as $file) {
                    $filename = basename($file);
                    // Check if file was created within 1 hour of the appointment creation
                    $fileLastModified = Storage::disk('public')->lastModified($file);
                    $fileDate = new \DateTime();
                    $fileDate->setTimestamp($fileLastModified);

                    $interval = $appointmentDate->diff($fileDate);
                    $hoursDiff = $interval->h + ($interval->days * 24);

                    // Only include files created within a reasonable timeframe of this appointment
                    if ($hoursDiff <= 1) {
                        $extension = pathinfo($filename, PATHINFO_EXTENSION);
                        $size = Storage::disk('public')->size($file);
                        $url = url('storage/' . $file);

                        $uploadedFiles[] = [
                            'name' => $filename,
                            'path' => $file,
                            'url' => $url,
                            'size' => $size,
                            'type' => $this->getMimeTypeFromExtension($extension),
                        ];
                    }
                }
            }
        }

        return Inertia::render('Doctor/AppointmentDetails', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointment' => $appointment,
            'patientFiles' => $uploadedFiles
        ]);
    }

    /**
     * Helper function to get mime type from file extension
     */
    private function getMimeTypeFromExtension($extension)
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
        ];

        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }

    /**
     * Update appointment status (approve or decline)
     */
    public function updateStatus(Request $request)
    {
        $request->validate([
            'appointment_id' => 'required|exists:patient_records,id',
            'status' => 'required|in:confirmed,cancelled,completed',
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        $appointment = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient')
            ->findOrFail($request->appointment_id);

        // Get the original status before updating
        $originalStatus = $appointment->status;

        // Update appointment status
        if ($request->status === 'confirmed') {
            $appointment->status = 'confirmed';

            // Decrement max_appointments in the doctor's schedule
            $this->updateDoctorScheduleSlot($appointment, -1);
        } else if ($request->status === 'completed') {
            // Explicitly set status to completed
            $appointment->status = 'completed';

            // If this was not already completed, add completion notes
            if ($originalStatus !== 'completed') {
                $details = is_string($appointment->details) ? json_decode($appointment->details, true) : [];
                if (!is_array($details)) {
                    $details = [];
                }
                $details['completed_at'] = now()->format('Y-m-d H:i:s');
                $details['completed_by'] = $user->name;
                $appointment->details = json_encode($details);
            }
        } else if ($request->status === 'cancelled' && $originalStatus === 'confirmed') {
            $appointment->status = $request->status;

            // If cancelling a previously confirmed appointment, increment max_appointments back
            $this->updateDoctorScheduleSlot($appointment, 1);
        } else {
            $appointment->status = $request->status;
        }

        // Add doctor notes if provided
        if ($request->notes) {
            $details = is_string($appointment->details) ? json_decode($appointment->details, true) : [];
            if (!is_array($details)) {
                $details = [];
            }
            $details['doctor_notes'] = $request->notes;
            $appointment->details = json_encode($details);
        }

        // Log the update for debugging
        Log::info('Doctor updating appointment status:', [
            'appointment_id' => $appointment->id,
            'old_status' => $originalStatus,
            'new_status' => $appointment->status,
        ]);

        $appointment->save();

        // Create notification for the patient
        if ($appointment->patient && ($request->status === 'confirmed' || $request->status === 'cancelled')) {
            $notificationType = $request->status === 'confirmed'
                ? Notification::TYPE_APPOINTMENT_CONFIRMED
                : Notification::TYPE_APPOINTMENT_CANCELLED;

            $title = $request->status === 'confirmed'
                ? 'Appointment Confirmed'
                : 'Appointment Cancelled';

            $message = $request->status === 'confirmed'
                ? "Your appointment with Dr. {$user->name} on " . date('F j, Y', strtotime($appointment->appointment_date)) . " has been confirmed."
                : "Your appointment with Dr. {$user->name} on " . date('F j, Y', strtotime($appointment->appointment_date)) . " has been cancelled.";

            if ($request->notes) {
                $message .= " Note: " . $request->notes;
            }

            Notification::create([
                'user_id' => $appointment->patient->id,
                'type' => $notificationType,
                'title' => $title,
                'message' => $message,
                'related_id' => $appointment->id,
                'related_type' => 'appointment',
                'data' => [
                    'appointment_id' => $appointment->id,
                    'doctor_id' => $user->id,
                    'doctor_name' => $user->name,
                    'appointment_date' => $appointment->appointment_date,
                    'status' => $request->status,
                ]
            ]);
        }

        // If it's an Inertia request, return to the same page with updated data
        if ($request->inertia()) {
            // Reload appointment with relations
            $appointment = PatientRecord::where('id', $appointment->id)
                ->with('patient')
                ->first();

            // Get patient uploaded files if they exist
            $patientId = $appointment->patient_id;
            $uploadedFiles = [];

            // Check if the patient has uploaded any files
            $uploadPath = 'medical-records/' . $patientId;
            if (Storage::disk('public')->exists($uploadPath)) {
                $files = Storage::disk('public')->files($uploadPath);

                foreach ($files as $file) {
                    $filename = basename($file);
                    $extension = pathinfo($filename, PATHINFO_EXTENSION);
                    $size = Storage::disk('public')->size($file);
                    $url = asset('storage/' . $file);

                    $uploadedFiles[] = [
                        'name' => $filename,
                        'path' => $file,
                        'url' => $url,
                        'size' => $size,
                        'type' => $this->getMimeTypeFromExtension($extension),
                    ];
                }
            }

            return Inertia::render('Doctor/AppointmentDetails', [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'appointment' => $appointment,
                'patientFiles' => $uploadedFiles,
                'success' => 'Appointment status updated successfully'
            ]);
        }

        // For regular (non-Inertia) requests
        if ($request->wantsJson()) {
            return response()->json([
                'appointment' => $appointment,
                'success' => 'Appointment status updated successfully'
            ]);
        }

        return redirect()->back()->with('success', 'Appointment status updated successfully');
    }

    /**
     * Update the doctor schedule slot by incrementing or decrementing max_appointments
     */
    private function updateDoctorScheduleSlot(PatientRecord $appointment, int $change)
    {
        try {
            $appointmentDateTime = Carbon::parse($appointment->appointment_date);
            $dayOfWeek = $appointmentDateTime->dayOfWeek;
            $dateString = $appointmentDateTime->format('Y-m-d');

            // Extract time from appointment details if available
            $appointmentTime = null;
            if ($appointment->details) {
                $details = json_decode($appointment->details, true);
                if (isset($details['appointment_time'])) {
                    $appointmentTime = $details['appointment_time'];
                }
            }

            // Parse appointment time if available, otherwise use the date's time
            $timeToMatch = $appointmentTime
                ? Carbon::parse($appointmentTime)->format('H:i:s')
                : $appointmentDateTime->format('H:i:s');

            // Try to find a matching schedule
            // First, look for a specific date schedule
            $schedule = DoctorSchedule::where('doctor_id', $appointment->assigned_doctor_id)
                ->where('specific_date', $dateString)
                ->where(function($query) use ($timeToMatch) {
                    $query->whereRaw("? BETWEEN start_time AND end_time", [$timeToMatch]);
                })->first();

            // If not found, look for a recurring schedule for this day of week
            if (!$schedule) {
                $schedule = DoctorSchedule::where('doctor_id', $appointment->assigned_doctor_id)
                    ->where('day_of_week', $dayOfWeek)
                    ->whereNull('specific_date')
                    ->where(function($query) use ($timeToMatch) {
                        $query->whereRaw("? BETWEEN start_time AND end_time", [$timeToMatch]);
                    })->first();
            }

            if ($schedule) {
                // Ensure max_appointments doesn't go below 0
                $newValue = max(0, $schedule->max_appointments + $change);
                $schedule->max_appointments = $newValue;
                $schedule->save();

                Log::info('Updated doctor schedule max_appointments', [
                    'schedule_id' => $schedule->id,
                    'previous_value' => $schedule->max_appointments - $change,
                    'new_value' => $schedule->max_appointments,
                    'appointment_id' => $appointment->id
                ]);
            } else {
                Log::warning('Could not find matching schedule for appointment', [
                    'appointment_id' => $appointment->id,
                    'appointment_date' => $appointment->appointment_date,
                    'day_of_week' => $dayOfWeek,
                    'time' => $timeToMatch
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error updating doctor schedule slot', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new appointment for a patient
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after:now',
            'details' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Verify this patient exists and has the patient role
        $patient = User::where('id', $request->patient_id)
            ->where('user_role', User::ROLE_PATIENT)
            ->first();

        if (!$patient) {
            return back()->withErrors(['patient_id' => 'Invalid patient selected'])->withInput();
        }

        $appointment = new PatientRecord();
        $appointment->patient_id = $request->patient_id;
        $appointment->assigned_doctor_id = Auth::id();
        $appointment->record_type = PatientRecord::TYPE_MEDICAL_CHECKUP;
        $appointment->status = PatientRecord::STATUS_PENDING;
        $appointment->appointment_date = $request->appointment_date;
        $appointment->details = $request->details;
        $appointment->save();

        // Create notification for the patient
        Notification::create([
            'user_id' => $request->patient_id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
            'title' => 'New Appointment Scheduled',
            'message' => 'You have a new appointment scheduled on ' . $appointment->appointment_date->format('M d, Y h:i A'),
            'related_id' => $appointment->id,
            'related_type' => 'appointment',
        ]);

        return redirect()->route('doctor.appointments.index')
            ->with('success', 'Appointment created successfully');
    }

    /**
     * Get pending appointments for notification
     */
    public function getPendingAppointments()
    {
        $user = Auth::user();

        $pendingAppointments = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->where('status', PatientRecord::STATUS_PENDING)
            ->with('patient')
            ->orderBy('appointment_date', 'asc')
            ->get();

        // Get all appointment time details from the details JSON field
        $pendingAppointments->each(function ($appointment) {
            if ($appointment->details) {
                $details = json_decode($appointment->details, true);
                if (isset($details['appointment_time'])) {
                    $appointment->appointment_time = $details['appointment_time'];
                }
                if (isset($details['reason'])) {
                    $appointment->reason = $details['reason'];
                }
            }
        });

        return response()->json([
            'pendingAppointments' => $pendingAppointments
        ]);
    }

    /**
     * Show form to create a new appointment
     */
    public function create()
    {
        $user = Auth::user();

        // Get patients assigned to this doctor for dropdown
        $patients = PatientRecord::where('assigned_doctor_id', $user->id)
            ->distinct('patient_id')
            ->with('patient')
            ->get()
            ->pluck('patient')
            ->unique('id')
            ->values();

        return Inertia::render('Doctor/Appointments', [
            'user' => $user,
            'patients' => $patients,
            'createMode' => true
        ]);
    }

    /**
     * Show calendar view of appointments
     */
    public function calendar()
    {
        $user = Auth::user();

        // Get appointments for calendar view - get all statuses for calendar visibility
        $appointments = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->whereIn('status', [PatientRecord::STATUS_PENDING, 'confirmed', 'cancelled', PatientRecord::STATUS_COMPLETED])
            ->with('patient')
            ->orderBy('appointment_date', 'asc')
            ->get();

        // Process appointment details to extract appointment times and reasons
        $appointments->each(function ($appointment) {
            if ($appointment->details) {
                $details = json_decode($appointment->details, true);
                if (isset($details['appointment_time'])) {
                    $appointment->appointment_time = $details['appointment_time'];
                }
                if (isset($details['reason'])) {
                    $appointment->reason = $details['reason'];
                }
            }
        });

        return Inertia::render('Doctor/Appointments', [
            'user' => $user,
            'appointments' => $appointments,
            'calendarMode' => true
        ]);
    }

    /**
     * Display the doctor's consultation history
     */
    public function consultationHistory()
    {
        $user = Auth::user();

        // Get completed appointments for this doctor
        $consultations = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->where('status', PatientRecord::STATUS_COMPLETED)
            ->with('patient')
            ->orderBy('appointment_date', 'desc')
            ->get();

        // Process consultation details
        $consultations->each(function ($consultation) {
            if ($consultation->details) {
                $details = json_decode($consultation->details, true);
                if (isset($details['appointment_time'])) {
                    $consultation->appointment_time = $details['appointment_time'];
                }
                if (isset($details['reason'])) {
                    $consultation->reason = $details['reason'];
                }
                if (isset($details['notes'])) {
                    $consultation->notes = $details['notes'];
                }
                if (isset($details['completed_at'])) {
                    $consultation->completed_at = $details['completed_at'];
                }
                if (isset($details['vital_signs'])) {
                    $consultation->vital_signs = $details['vital_signs'];
                }
            }

            // Include vital signs if they exist as a separate field
            if ($consultation->vital_signs && is_string($consultation->vital_signs)) {
                $consultation->vital_signs = json_decode($consultation->vital_signs, true);
            }
        });

        return Inertia::render('Doctor/ConsultationHistory', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'consultations' => $consultations,
        ]);
    }
}
