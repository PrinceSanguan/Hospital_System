<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MedicalRecordsController extends Controller
{
    /**
     * Display a listing of medical records
     */
    public function index()
    {
        $user = Auth::user();

        $medicalRecords = PatientRecord::with(['patient', 'assignedDoctor'])
            ->latest('updated_at')
            ->paginate(10);

        return Inertia::render('ClinicalStaff/MedicalRecords', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'medicalRecords' => $medicalRecords,
        ]);
    }

    /**
     * Show the form for creating a new medical record
     */
    public function create()
    {
        $user = Auth::user();
        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('ClinicalStaff/MedicalRecordsAdd', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'patients' => $patients,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Store a newly created medical record
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'required|exists:users,id',
            'record_type' => 'required|string',
            'appointment_date' => 'required|date',
            'status' => 'required|string',
            'details' => 'nullable|string',
        ]);

        $record = new PatientRecord();
        $record->patient_id = $validated['patient_id'];
        $record->assigned_doctor_id = $validated['assigned_doctor_id'];
        $record->record_type = $validated['record_type'];
        $record->appointment_date = $validated['appointment_date'];
        $record->status = $validated['status'];

        // Store vital signs and prescriptions in their dedicated columns
        if ($request->has('vital_signs')) {
            $record->vital_signs = $request->input('vital_signs');
        }

        if ($request->has('prescriptions')) {
            $record->prescriptions = $request->input('prescriptions');
        }

        // Handle medical record details
        if ($request->has('diagnosis') || $request->has('notes')) {
            $details = [
                'appointment_time' => $request->input('appointment_time'),
                'diagnosis' => $request->input('diagnosis'),
                'notes' => $request->input('notes'),
                'followup_date' => $request->input('followup_date'),
            ];

            $record->details = json_encode($details);
        } else {
            $record->details = $validated['details'] ?? '{}';
        }

        $record->save();

        return redirect()->route('staff.clinical.info')
            ->with('success', 'Medical record created successfully');
    }

    /**
     * Display the specified medical record
     */
    public function show($id)
    {
        $user = Auth::user();
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('ClinicalStaff/MedicalRecordsView', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
        ]);
    }

    /**
     * Show the form for editing the specified medical record
     */
    public function edit($id)
    {
        $user = Auth::user();
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('id', $id)
            ->firstOrFail();

        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('ClinicalStaff/MedicalRecordsEdit', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
            'patients' => $patients,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Update the specified medical record
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'required|exists:users,id',
            'record_type' => 'required|string',
            'appointment_date' => 'required|date',
            'status' => 'required|string',
        ]);

        $record = PatientRecord::where('id', $id)
            ->firstOrFail();

        $record->patient_id = $validated['patient_id'];
        $record->assigned_doctor_id = $validated['assigned_doctor_id'];
        $record->record_type = $validated['record_type'];
        $record->appointment_date = $validated['appointment_date'];
        $record->status = $validated['status'];

        // Update vital signs and prescriptions in their dedicated columns
        if ($request->has('vital_signs')) {
            $record->vital_signs = $request->input('vital_signs');
        }

        if ($request->has('prescriptions')) {
            $record->prescriptions = $request->input('prescriptions');
        }

        // Handle medical record details
        if ($request->has('diagnosis') || $request->has('notes') || $request->has('appointment_time') || $request->has('followup_date')) {
            $details = json_decode($record->details, true) ?: [];

            $details['appointment_time'] = $request->input('appointment_time', $details['appointment_time'] ?? null);
            $details['diagnosis'] = $request->input('diagnosis', $details['diagnosis'] ?? '');
            $details['notes'] = $request->input('notes', $details['notes'] ?? '');
            $details['followup_date'] = $request->input('followup_date', $details['followup_date'] ?? null);

            $record->details = json_encode($details);
        } elseif ($request->has('details')) {
            $record->details = $request->input('details');
        }

        $record->save();

        return redirect()->route('staff.clinical.info')
            ->with('success', 'Medical record updated successfully');
    }

    /**
     * Remove the specified medical record
     */
    public function destroy($id)
    {
        $record = PatientRecord::where('id', $id)
            ->firstOrFail();

        $record->delete();

        return redirect()->route('staff.clinical.info')
            ->with('success', 'Medical record deleted successfully');
    }

    /**
     * Get patient's medical history
     */
    public function patientHistory($patientId)
    {
        $patient = User::where('id', $patientId)
            ->where('user_role', User::ROLE_PATIENT)
            ->firstOrFail();

        $records = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $patientId)
            ->latest('appointment_date')
            ->get();

        return Inertia::render('ClinicalStaff/PatientHistory', [
            'user' => [
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
                'role' => Auth::user()->user_role,
            ],
            'patient' => $patient,
            'records' => $records,
        ]);
    }
}
