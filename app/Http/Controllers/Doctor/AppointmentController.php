<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    /**
     * Display the doctor's appointments
     */
    public function index()
    {
        $user = Auth::user();

        // Get all appointments for this doctor
        $appointments = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->with('patient')
            ->orderBy('appointment_date', 'desc')
            ->get();

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

        return Inertia::render('Doctor/AppointmentDetails', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointment' => $appointment,
        ]);
    }

    /**
     * Update appointment status (approve or decline)
     */
    public function updateStatus(Request $request)
    {
        $request->validate([
            'appointment_id' => 'required|exists:patient_records,id',
            'status' => 'required|in:confirmed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        $appointment = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient')
            ->findOrFail($request->appointment_id);

        // Update appointment status
        $appointment->status = $request->status;

        // Add doctor notes if provided
        if ($request->notes) {
            $notes = $appointment->details ? $appointment->details . "\n\nDoctor's Note: " . $request->notes : "Doctor's Note: " . $request->notes;
            $appointment->details = $notes;
        }

        $appointment->save();

        // Create notification for the patient
        if ($appointment->patient) {
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

        return redirect()->back()->with('success', 'Appointment status updated successfully');
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

        // Get appointments for calendar view
        $appointments = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->with('patient')
            ->orderBy('appointment_date', 'asc')
            ->get();

        return Inertia::render('Doctor/Appointments', [
            'user' => $user,
            'appointments' => $appointments,
            'calendarMode' => true
        ]);
    }
}
