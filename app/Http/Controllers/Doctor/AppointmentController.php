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
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        $appointment = PatientRecord::where('assigned_doctor_id', $user->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:completed,cancelled',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $oldStatus = $appointment->status;
        $appointment->status = $request->status;

        if ($request->filled('notes')) {
            $details = $appointment->details ?? [];
            $details = is_array($details) ? $details : [];
            $details[] = [
                'date' => now()->toDateTimeString(),
                'note' => $request->notes,
                'by' => $user->name,
            ];
            $appointment->details = $details;
        }

        $appointment->save();

        // Create notification for the patient
        if ($oldStatus !== $request->status) {
            $notificationType = $request->status === 'completed'
                ? Notification::TYPE_APPOINTMENT_CONFIRMED
                : Notification::TYPE_APPOINTMENT_CANCELLED;

            $notificationTitle = $request->status === 'completed'
                ? 'Appointment Confirmed'
                : 'Appointment Cancelled';

            $notificationMessage = $request->status === 'completed'
                ? "Your appointment on " . $appointment->appointment_date->format('M d, Y h:i A') . " has been confirmed."
                : "Your appointment on " . $appointment->appointment_date->format('M d, Y h:i A') . " has been cancelled.";

            Notification::create([
                'user_id' => $appointment->patient_id,
                'type' => $notificationType,
                'title' => $notificationTitle,
                'message' => $notificationMessage,
                'related_id' => $appointment->id,
                'related_type' => 'appointment',
            ]);
        }

        return redirect()->route('doctor.appointments.index')
            ->with('success', 'Appointment status updated successfully');
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
