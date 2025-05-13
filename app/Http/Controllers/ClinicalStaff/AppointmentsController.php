<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\Receipt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
            // Get all appointments with patient and doctor information
            $appointments = Appointment::with(['patient', 'doctor'])
                ->orderBy('appointment_date', 'desc')
                ->get()
                ->map(function ($appointment) {
                    // Debug appointment data
                    Log::info('Processing appointment:', [
                        'id' => $appointment->id,
                        'patient_id' => $appointment->patient_id,
                        'doctor_id' => $appointment->doctor_id,
                        'has_patient' => $appointment->patient ? 'yes' : 'no',
                        'has_doctor' => $appointment->doctor ? 'yes' : 'no'
                    ]);

                    // Check if patient relation exists
                    $patient = Patient::find($appointment->patient_id);
                    if (!$patient) {
                        Log::warning('Appointment #' . $appointment->id . ' has no associated patient');
                        return null;
                    }

                    // Get doctor information
                    $doctor = null;
                    if ($appointment->doctor_id) {
                        $doctor = \App\Models\Doctor::find($appointment->doctor_id);
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

                    return [
                        'id' => $appointment->id,
                        'reference_number' => $appointment->reference_number ?? ('APP-' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT)),
                        'patient' => $patient,
                        'doctor' => $doctor,
                        'record_type' => $appointment->record_type ?? 'doctor_appointment',
                        'appointment_date' => $appointment->appointment_date,
                        'status' => $appointment->status,
                        'details' => json_encode($detailsArray),
                        'reason' => $appointment->reason ?? ($detailsArray['reason'] ?? 'Not specified'),
                        'appointment_type' => $detailsArray['appointment_type'] ?? 'Consultation'
                    ];
                })
                ->filter() // Remove any null entries
                ->values(); // Re-index the array

            return Inertia::render('ClinicalStaff/Appointments', [
                'user' => Auth::user(),
                'appointments' => $appointments
            ]);
        } catch (\Exception $e) {
            Log::error('Error in AppointmentsController@index: ' . $e->getMessage());
            return Inertia::render('ClinicalStaff/Appointments', [
                'user' => Auth::user(),
                'appointments' => []
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
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,completed,cancelled',
        ]);

        $appointment = Appointment::findOrFail($id);
        $appointment->status = $validated['status'];
        $appointment->save();

        return redirect()->back()->with('success', 'Appointment status updated successfully');
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
}
