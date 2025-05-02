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

class RecordsController extends Controller
{
    /**
     * Display all records for the doctor's patients
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Build query
        $query = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient');

        // Apply filters if provided
        if ($request->filled('record_type') && $request->record_type !== 'all') {
            $query->where('record_type', $request->record_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->orWhere('details', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Apply sorting
        $sortField = $request->sort ?? 'created_at';
        $sortDirection = $request->direction ?? 'desc';

        if ($sortField === 'patient_name') {
            $query->join('users', 'patient_records.patient_id', '=', 'users.id')
                  ->orderBy('users.name', $sortDirection)
                  ->select('patient_records.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        // Get records paginated
        $records = $query->paginate(10)->withQueryString();

        // Get unique patient list for this doctor (for filter dropdown)
        $patients = PatientRecord::where('assigned_doctor_id', $user->id)
            ->distinct('patient_id')
            ->with('patient')
            ->get()
            ->pluck('patient')
            ->unique('id')
            ->values();

        return Inertia::render('Doctor/Records', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'records' => $records,
            'patients' => $patients,
            'filters' => [
                'search' => $request->search,
                'record_type' => $request->record_type,
                'status' => $request->status,
                'sort' => $sortField,
                'direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Display a specific record
     */
    public function show($id)
    {
        $user = Auth::user();
        $record = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient')
            ->findOrFail($id);

        return Inertia::render('Doctor/RecordDetails', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
        ]);
    }

    /**
     * Store a new record (medical or lab)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'record_type' => 'required|in:medical_record,laboratory,medical_checkup',
            'details' => 'required|string',
            'appointment_date' => 'required|date',
            'status' => 'required|in:completed,pending,cancelled',
            'lab_results' => 'nullable|array',
            'vital_signs' => 'nullable|array',
            'prescriptions' => 'nullable|array',
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

        // Verify this patient is assigned to the current doctor
        $isPatientAssigned = PatientRecord::where('patient_id', $request->patient_id)
            ->where('assigned_doctor_id', Auth::id())
            ->exists();

        if (!$isPatientAssigned) {
            // If not already assigned, create the first record assigning the patient
            // Or return error if you want to enforce existing assignment
            // return back()->withErrors(['patient_id' => 'This patient is not assigned to you'])->withInput();
        }

        $record = new PatientRecord();
        $record->patient_id = $request->patient_id;
        $record->assigned_doctor_id = Auth::id();
        $record->record_type = $request->record_type;
        $record->status = $request->status;
        $record->details = $request->details;
        $record->appointment_date = $request->appointment_date;

        if ($request->filled('lab_results')) {
            $record->lab_results = $request->lab_results;
        }

        if ($request->filled('vital_signs')) {
            $record->vital_signs = $request->vital_signs;
        }

        if ($request->filled('prescriptions')) {
            $record->prescriptions = $request->prescriptions;
        }

        $record->save();

        // Create notification for the patient
        Notification::create([
            'user_id' => $request->patient_id,
            'type' => $request->record_type === 'laboratory' ?
                Notification::TYPE_LAB_RESULTS_AVAILABLE :
                Notification::TYPE_MEDICAL_RECORD_UPDATED,
            'title' => $request->record_type === 'laboratory' ?
                'New Lab Results Available' :
                'Medical Record Updated',
            'message' => $request->record_type === 'laboratory' ?
                'Your lab results are now available. Please check your records.' :
                'Your medical record has been updated. Please check your records.',
            'related_id' => $record->id,
            'related_type' => 'record',
        ]);

        return redirect()->route('doctor.patients.show', $request->patient_id)
            ->with('success', 'Record created successfully');
    }

    /**
     * Update an existing record
     */
    public function update(Request $request, $id)
    {
        $record = PatientRecord::where('assigned_doctor_id', Auth::id())
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'details' => 'required|string',
            'status' => 'sometimes|required|in:completed,pending,cancelled',
            'lab_results' => 'nullable|array',
            'vital_signs' => 'nullable|array',
            'prescriptions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $record->details = $request->details;

        if ($request->filled('status')) {
            $record->status = $request->status;
        }

        if ($request->filled('lab_results')) {
            $record->lab_results = $request->lab_results;
        }

        if ($request->filled('vital_signs')) {
            $record->vital_signs = $request->vital_signs;
        }

        if ($request->filled('prescriptions')) {
            $record->prescriptions = $request->prescriptions;
        }

        $record->save();

        // Create notification for the patient
        Notification::create([
            'user_id' => $record->patient_id,
            'type' => Notification::TYPE_MEDICAL_RECORD_UPDATED,
            'title' => 'Medical Record Updated',
            'message' => 'Your medical record has been updated. Please check your records.',
            'related_id' => $record->id,
            'related_type' => 'record',
        ]);

        return redirect()->route('doctor.patients.show', $record->patient_id)
            ->with('success', 'Record updated successfully');
    }

    /**
     * Delete a record
     */
    public function destroy($id)
    {
        $record = PatientRecord::where('assigned_doctor_id', Auth::id())
            ->findOrFail($id);

        $patientId = $record->patient_id;
        $record->delete();

        return redirect()->route('doctor.patients.show', $patientId)
            ->with('success', 'Record deleted successfully');
    }

    /**
     * Show form to create a new medical record
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

        return Inertia::render('Doctor/RecordCreate', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'patients' => $patients,
        ]);
    }

    /**
     * Get a patient's records
     */
    public function getPatientRecords($patientId)
    {
        $user = Auth::user();

        // Ensure the patient is assigned to this doctor
        $records = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($records);
    }
}
