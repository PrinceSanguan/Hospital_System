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

        // Process records to extract diagnoses
        $records->getCollection()->transform(function ($record) {
            // Try to extract diagnosis from details if it's stored as JSON
            try {
                $detailsArray = json_decode($record->details, true);
                if (is_array($detailsArray) && isset($detailsArray['diagnosis'])) {
                    $record->diagnosis = $detailsArray['diagnosis'];
                }
            } catch (\Exception $e) {
                // Not a valid JSON or no diagnosis field
            }

            return $record;
        });

        // Get unique patient list for this doctor (for filter dropdown and record creation)
        $patients = User::where('user_role', User::ROLE_PATIENT)
            ->whereIn('id', function($query) use ($user) {
                $query->select('patient_id')
                      ->from('patient_records')
                      ->where('assigned_doctor_id', $user->id)
                      ->distinct();
            })
            ->get(['id', 'name', 'email']);

        return Inertia::render('Doctor/Records', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'medicalRecords' => $records,
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
            ->findOrFail($id);

        $patient = User::findOrFail($record->patient_id);

        return Inertia::render('Doctor/RecordView', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
            ],
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

        // Ensure we use the correct record type constant values from PatientRecord model
        // This is to ensure consistency between what doctors create and what patients see
        switch ($request->record_type) {
            case 'medical_record':
                $record->record_type = PatientRecord::TYPE_MEDICAL_RECORD;
                break;
            case 'laboratory':
                $record->record_type = PatientRecord::TYPE_LABORATORY;
                break;
            case 'medical_checkup':
                $record->record_type = PatientRecord::TYPE_MEDICAL_CHECKUP;
                break;
            default:
                $record->record_type = $request->record_type;
        }

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
        try {
            $record = PatientRecord::where('assigned_doctor_id', Auth::id())
                ->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'details' => 'required|string',
                'status' => 'sometimes|required|in:completed,pending,cancelled',
                'lab_results' => 'nullable|array',
                'vital_signs' => 'nullable|array',
                'prescriptions' => 'nullable|array',
                'reference_number' => 'nullable|string',
                'appointment_date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
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

            if ($request->filled('reference_number')) {
                $record->reference_number = $request->reference_number;
            }

            if ($request->filled('appointment_date')) {
                // Make sure the date is in the correct format for the database
                try {
                    $date = \Carbon\Carbon::parse($request->appointment_date)->toDateString();
                    $record->appointment_date = $date;
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid date format. Please use YYYY-MM-DD format.',
                        'error' => $e->getMessage()
                    ], 422);
                }
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

            // Return JSON response instead of redirecting
            return response()->json([
                'success' => true,
                'message' => 'Record updated successfully',
                'record' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating record',
                'error' => $e->getMessage()
            ], 500);
        }
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
     * Display the record creation form
     */
    public function create()
    {
        $user = Auth::user();

        // Get patients assigned to this doctor
        $patients = User::where('user_role', User::ROLE_PATIENT)
            ->whereIn('id', function($query) use ($user) {
                $query->select('patient_id')
                      ->from('patient_records')
                      ->where('assigned_doctor_id', $user->id)
                      ->distinct();
            })
            ->get(['id', 'name', 'email']);

        return Inertia::render('Doctor/RecordCreate', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'patients' => $patients,
            'recordTypes' => [
                ['value' => 'medical_record', 'label' => 'Medical Record'],
                ['value' => 'laboratory', 'label' => 'Laboratory Results'],
                ['value' => 'medical_checkup', 'label' => 'Medical Checkup'],
            ],
            'statusOptions' => [
                ['value' => 'completed', 'label' => 'Completed'],
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'cancelled', 'label' => 'Cancelled'],
            ],
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

    /**
     * Print a medical certificate for a record
     */
    public function printRecord($id)
    {
        $user = Auth::user();
        $record = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient', 'assignedDoctor')
            ->findOrFail($id);

        return Inertia::render('Doctor/PrintRecord', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
        ]);
    }

    /**
     * Print only prescriptions for a record
     */
    public function printPrescriptions($id)
    {
        $user = Auth::user();
        $record = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with('patient', 'assignedDoctor')
            ->findOrFail($id);

        return Inertia::render('Doctor/PrintPrescriptions', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
        ]);
    }

    /**
     * Show the form for editing a record
     */
    public function edit($id)
    {
        $user = Auth::user();
        $record = PatientRecord::where('assigned_doctor_id', $user->id)
            ->findOrFail($id);

        $patient = User::findOrFail($record->patient_id);

        return Inertia::render('Doctor/RecordEdit', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
            ],
        ]);
    }
}
