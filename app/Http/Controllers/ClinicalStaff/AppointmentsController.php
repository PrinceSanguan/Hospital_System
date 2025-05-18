<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\Receipt;
use App\Models\LabResult;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AppointmentsController extends Controller
{
    /**
     * Display a listing of the appointments.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        try {
            // Clear cache to ensure fresh data (for MySQL)
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("SET SESSION query_cache_type=0");
            }

            // Get all appointments with patient information
            $appointments = Appointment::select('appointments.*')
                ->join('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.assigned_doctor_id', '=', 'doctors.id')
                ->orderBy('appointments.appointment_date', 'desc')
                ->get();

            // Debug appointment data
            Log::info('Retrieved appointments count:', ['count' => $appointments->count()]);

            $formattedAppointments = $appointments->map(function ($appointment) {
                try {
                    // Get patient information
                    $patient = Patient::find($appointment->patient_id);
                    if (!$patient) {
                        Log::warning('Appointment #' . $appointment->id . ' has no associated patient');
                        return null;
                    }

                    // Get doctor information
                    $doctor = null;
                    if ($appointment->assigned_doctor_id) {
                        $doctor = User::find($appointment->assigned_doctor_id);
                    }

                    // Parse additional details (handle null or invalid JSON)
                    $detailsArray = [];
                    if ($appointment->details) {
                        if (is_string($appointment->details)) {
                            try {
                                $detailsArray = json_decode($appointment->details, true) ?: [];
                            } catch (\Exception $e) {
                                $detailsArray = [];
                                Log::error('Error parsing appointment details: ' . $e->getMessage());
                            }
                        } else {
                            $detailsArray = (array) $appointment->details;
                        }
                    }

                    // Format the appointment for display
                    return [
                        'id' => $appointment->id,
                        'reference_number' => $appointment->reference_number ?? ('APP-' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT)),
                        'patient' => [
                            'id' => $patient->id,
                            'name' => $patient->name,
                            'reference_number' => $patient->reference_number ?? null,
                        ],
                        'doctor' => $doctor ? [
                            'id' => $doctor->id,
                            'name' => $doctor->name,
                        ] : null,
                        'record_type' => $appointment->record_type ?? 'doctor_appointment',
                        'appointment_date' => $appointment->appointment_date,
                        'status' => $appointment->status,
                        'reason' => $appointment->reason ?? ($detailsArray['reason'] ?? 'Not specified'),
                        'details' => $detailsArray,
                        'has_lab_results' => \App\Models\LabResult::where('patient_id', $patient->id)->exists(),
                        'has_medical_record' => true,
                    ];
                } catch (\Exception $e) {
                    Log::error('Error processing appointment #' . $appointment->id . ': ' . $e->getMessage());
                    return null;
                }
            })
            ->filter() // Remove any null entries
            ->values(); // Re-index the array

            Log::info('Formatted appointments count:', ['count' => $formattedAppointments->count()]);

            return Inertia::render('ClinicalStaff/Appointments', [
                'user' => Auth::user(),
                'appointments' => $formattedAppointments
            ]);
        } catch (\Exception $e) {
            Log::error('Error in AppointmentsController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('ClinicalStaff/Appointments', [
                'user' => Auth::user(),
                'appointments' => [],
                'error' => 'Failed to load appointments. Please try refreshing the page.'
            ]);
        }
    }

    /**
     * Display the specified appointment.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        // Get appointment with related data
        $appointment = Appointment::with(['patient', 'doctor'])
            ->findOrFail($id);

        return Inertia::render('ClinicalStaff/AppointmentDetail', [
            'appointment' => $appointment,
            'user' => Auth::user()
        ]);
    }

    /**
     * Update the specified appointment status.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'status' => 'required|string|in:pending,confirmed,completed,cancelled',
                'notes' => 'nullable|string',
            ]);

            // Find appointment
            $appointment = Appointment::findOrFail($id);
            $oldStatus = $appointment->status;
            $newStatus = $validated['status'];

            // Update appointment status
            $appointment->status = $newStatus;
            if (isset($validated['notes']) && !empty($validated['notes'])) {
                // Parse existing details
                $details = [];
                if ($appointment->details) {
                    if (is_string($appointment->details)) {
                        $details = json_decode($appointment->details, true) ?: [];
                    } else {
                        $details = (array) $appointment->details;
                    }
                }

                // Add status change note
                $details['status_notes'] = $validated['notes'];
                $details['status_updated_by'] = 'staff';
                $details['status_updated_at'] = now()->format('Y-m-d H:i:s');

                $appointment->details = json_encode($details);
            }
            $appointment->save();

            // Also update the corresponding record in patient_records table (if exists)
            // First, extract the record ID from the reference number if available
            $recordId = null;
            if ($appointment->reference_number && preg_match('/APP(\d+)/', $appointment->reference_number, $matches)) {
                $recordId = intval($matches[1]);
            }

            if ($recordId) {
                $patientRecord = \App\Models\PatientRecord::find($recordId);
                if ($patientRecord) {
                    $patientRecord->status = $newStatus;
                    $patientRecord->save();

                    Log::info('Updated corresponding patient record', [
                        'appointment_id' => $id,
                        'patient_record_id' => $recordId,
                        'status' => $newStatus
                    ]);
                }
            }

            // Create notifications if the status changed to confirmed
            if ($oldStatus !== 'confirmed' && $newStatus === 'confirmed') {
                // Get patient info
                $patient = \App\Models\Patient::find($appointment->patient_id);
                if ($patient && $patient->user_id) {
                    // Notify patient
                    \App\Models\Notification::create([
                        'user_id' => $patient->user_id,
                        'type' => 'appointment_confirmed',
                        'title' => 'Appointment Confirmed',
                        'message' => 'Your appointment scheduled for ' . date('F j, Y', strtotime($appointment->appointment_date)) . ' has been confirmed.',
                        'related_id' => $appointment->id,
                        'related_type' => 'appointment',
                        'data' => json_encode([
                            'appointment_id' => $appointment->id,
                            'appointment_date' => $appointment->appointment_date,
                            'confirmed_by' => 'staff'
                        ])
                    ]);
                }

                // Notify doctor if assigned
                if ($appointment->assigned_doctor_id) {
                    \App\Models\Notification::create([
                        'user_id' => $appointment->assigned_doctor_id,
                        'type' => 'appointment_confirmed_by_staff',
                        'title' => 'Appointment Confirmed By Staff',
                        'message' => 'Staff confirmed an appointment for ' . ($patient ? $patient->name : 'a patient') . ' on ' . date('F j, Y', strtotime($appointment->appointment_date)) . '.',
                        'related_id' => $appointment->id,
                        'related_type' => 'appointment',
                        'data' => json_encode([
                            'appointment_id' => $appointment->id,
                            'appointment_date' => $appointment->appointment_date,
                            'patient_id' => $appointment->patient_id,
                            'confirmed_by' => 'staff'
                        ])
                    ]);
                }
            }

            DB::commit();

            $statusMessage = ucfirst($newStatus);

            // Handle API requests
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => "Appointment {$statusMessage} successfully",
                    'appointment' => $appointment
                ]);
            }

            // Handle normal requests
            return redirect()->back()->with('success', "Appointment {$statusMessage} successfully");


            DB::rollBack();
            Log::error('Error updating appointment status', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Handle API requests
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update appointment status. Please try again.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to update appointment status. Please try again.');
        }
    }

    /**
     * Generate a PDF for the appointment.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function generatePdf($id)
    {
        $appointment = Appointment::with(['patient', 'doctor'])->findOrFail($id);

        // Logic to generate PDF would go here
        // For now, we'll just return a basic response
        return response()->json([
            'message' => 'PDF generation function will be implemented here',
            'appointment_id' => $id
        ]);
    }

    /**
     * Create a receipt for an appointment.
     *
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function createReceipt($id)
    {
        $appointment = Appointment::with('patient')->findOrFail($id);

        // Check if appointment already has a receipt
        $existingReceipt = Receipt::where('appointment_id', $appointment->id)->first();

        if ($existingReceipt) {
            return redirect()->route('staff.receipts.show', $existingReceipt->id)
                ->with('info', 'This appointment already has a receipt');
        }

        // Add parameter to trigger auto-opening receipt creation dialog
        return redirect()->route('staff.receipts.index', [
            'open_create' => true,
            'patient_id' => $appointment->patient_id,
            'appointment_id' => $appointment->id
        ]);
    }

    /**
     * Show the form for editing the specified appointment.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {
        $appointment = Appointment::with(['patient', 'doctor'])->findOrFail($id);

        return Inertia::render('ClinicalStaff/AppointmentEdit', [
            'appointment' => $appointment,
            'user' => Auth::user()
        ]);
    }

    /**
     * Update the specified appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:users,id',
            'appointment_date' => 'required|date',
            'status' => 'required|string|in:pending,confirmed,completed,cancelled',
            'reason' => 'required|string|max:255',
            'details' => 'nullable|array',
        ]);

        $appointment = Appointment::findOrFail($id);

        // Update basic fields
        $appointment->patient_id = $validated['patient_id'];
        $appointment->assigned_doctor_id = $validated['doctor_id'];
        $appointment->appointment_date = $validated['appointment_date'];
        $appointment->status = $validated['status'];

        // Update details field with reason
        $details = $validated['details'] ?? [];
        $details['reason'] = $validated['reason'];
        $appointment->details = json_encode($details);

        $appointment->save();

        return redirect()->route('staff.appointments.index')
            ->with('success', 'Appointment updated successfully');
    }

    /**
     * Get lab results for a specific appointment.
     *
     * @param int $id
     * @return \Inertia\Response
     */
    public function getLabResults($id)
    {
        try {
            // Find the appointment
            $appointment = Appointment::with('patient')->findOrFail($id);

            // Get all lab results for this patient
            $labResults = LabResult::where('patient_id', $appointment->patient_id)
                ->orderBy('test_date', 'desc')
                ->get();

            return Inertia::render('ClinicalStaff/LabResults', [
                'user' => Auth::user(),
                'labResults' => [
                    'data' => $labResults
                ],
                'patient' => $appointment->patient,
                'isPatientView' => true,
                'appointmentId' => $id
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AppointmentsController@getLabResults: ' . $e->getMessage(), [
                'appointment_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('staff.appointments.index')
                ->with('error', 'Failed to retrieve lab results. ' . $e->getMessage());
        }
    }
}
