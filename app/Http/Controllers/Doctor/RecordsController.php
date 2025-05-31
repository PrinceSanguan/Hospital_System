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

        // Redirect to clinical info page instead of patient page
        return redirect()->route('doctor.clinical.info')
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

            // Check if the status is being changed to 'completed'
            $statusChangedToCompleted = false;
            if ($request->filled('status')) {
                $statusChangedToCompleted = $request->status === 'completed' && $record->status !== 'completed';
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

            // Create notifications for clinical staff if the record was completed
            if ($statusChangedToCompleted) {
                // Get all clinical staff users
                $clinicalStaff = User::where('user_role', User::ROLE_CLINICAL_STAFF)->get();

                foreach ($clinicalStaff as $staff) {
                    Notification::create([
                        'user_id' => $staff->id,
                        'type' => Notification::TYPE_MEDICAL_RECORD_COMPLETED,
                        'title' => 'Medical Record Completed',
                        'message' => 'A medical record has been completed by Dr. ' . Auth::user()->name . '. Patient: ' . User::find($record->patient_id)->name,
                        'related_id' => $record->id,
                        'related_type' => 'record',
                    ]);
                }
            }

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
                'id' => $user->id,
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

    /**
     * Show medical records (clinical info) for the doctor's patients only
     */
    public function clinicalInfo(Request $request)
    {
        $user = Auth::user();

        // Build query - only for records assigned to this doctor
        $query = PatientRecord::where('assigned_doctor_id', $user->id)
            ->with(['patient', 'assignedDoctor']);

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

        // Get records paginated, sorted by latest updated
        $medicalRecords = $query->latest('updated_at')->paginate(10);

        return Inertia::render('Doctor/MedicalRecords', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'medicalRecords' => $medicalRecords,
        ]);
    }

    /**
     * View a specific medical record, only if it belongs to one of the doctor's patients
     */
    public function viewMedicalRecord($id)
    {
        $user = Auth::user();

        // Find the record, ensuring it belongs to this doctor's patients
        $record = PatientRecord::with(['patient', 'assignedDoctor.doctorProfile'])
            ->where('assigned_doctor_id', $user->id)
            ->findOrFail($id);

        // Get all doctors to help with doctor information display
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with('doctorProfile')
            ->get();

        return Inertia::render('Doctor/MedicalRecordsView', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Edit a medical record, only if it belongs to one of the doctor's patients
     */
    public function editMedicalRecord($id)
    {
        $user = Auth::user();

        // Find the record, ensuring it belongs to this doctor's patients
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('assigned_doctor_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        // Get patients and doctors lists for the form
        $patients = User::where('user_role', User::ROLE_PATIENT)
            ->whereIn('id', function($query) use ($user) {
                $query->select('patient_id')
                    ->from('patient_records')
                    ->where('assigned_doctor_id', $user->id)
                    ->distinct();
            })
            ->get();

        $doctors = User::where('id', $user->id)
            ->get(); // Only this doctor should be in the list

        return Inertia::render('Doctor/MedicalRecordsEdit', [
            'user' => [
                'id' => $user->id,
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
     * Update a medical record, only if it belongs to one of the doctor's patients
     */
    public function updateMedicalRecord(Request $request, $id)
    {
        // Validate request data
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'required|exists:users,id',
            'record_type' => 'required|string',
            'appointment_date' => 'required|date',
            'status' => 'required|string',
        ]);

        // Ensure the doctor can only update their own records
        $doctor_id = Auth::id();
        if ($validated['assigned_doctor_id'] != $doctor_id) {
            return redirect()->back()->with('error', 'You can only assign records to yourself');
        }

        // Find the record and ensure it belongs to this doctor
        $record = PatientRecord::where('id', $id)
            ->where('assigned_doctor_id', $doctor_id)
            ->firstOrFail();

        // Update record fields
        $record->patient_id = $validated['patient_id'];
        $record->assigned_doctor_id = $validated['assigned_doctor_id']; // Should be the doctor's ID
        $record->record_type = $validated['record_type'];
        $record->appointment_date = $validated['appointment_date'];
        $record->status = $validated['status'];

        // Update vital signs if provided
        if ($request->has('vital_signs')) {
            $record->vital_signs = $request->input('vital_signs');
        }

        // Update prescriptions if provided
        if ($request->has('prescriptions')) {
            $record->prescriptions = $request->input('prescriptions');

            // Save prescriptions to the prescriptions table
            $this->savePrescriptions(
                $request->input('prescriptions'),
                $validated['patient_id'],
                $validated['assigned_doctor_id'],
                $id,
                $validated['appointment_date']
            );
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

        return redirect()->route('doctor.clinical.info')
            ->with('success', 'Medical record updated successfully');
    }

    /**
     * Get prescriptions for a record
     */
    public function getPrescriptions($recordId)
    {
        // Ensure the record belongs to one of this doctor's patients
        $doctor_id = Auth::id();
        $record = PatientRecord::where('id', $recordId)
            ->where('assigned_doctor_id', $doctor_id)
            ->firstOrFail();

        $prescriptions = \App\Models\Prescription::where('record_id', $recordId)
            ->where('doctor_id', $doctor_id)
            ->get();

        return response()->json($prescriptions);
    }

    /**
     * Download a prescription
     */
    public function downloadPrescription($id)
    {
        // Ensure the prescription belongs to one of this doctor's patients
        $doctor_id = Auth::id();
        $prescription = \App\Models\Prescription::where('id', $id)
            ->where('doctor_id', $doctor_id)
            ->firstOrFail();

        $patient = User::findOrFail($prescription->patient_id);
        $doctor = User::findOrFail($prescription->doctor_id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.prescription', [
            'prescription' => $prescription,
            'patient' => $patient,
            'doctor' => $doctor,
        ]);

        return $pdf->download('prescription_' . $prescription->id . '.pdf');
    }

    /**
     * Helper method to save prescriptions to the Prescription model
     */
    private function savePrescriptions($prescriptions, $patientId, $doctorId, $recordId, $date)
    {
        // Delete existing prescriptions for this record to avoid duplicates
        \App\Models\Prescription::where('record_id', $recordId)->delete();

        // Make sure prescriptions is an array
        if (!is_array($prescriptions)) {
            try {
                $prescriptions = json_decode($prescriptions, true);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to parse prescriptions: " . $e->getMessage());
                return;
            }
        }

        foreach ($prescriptions as $prescription) {
            // Skip empty prescriptions
            if (empty($prescription['medication'])) {
                continue;
            }

            try {
                \App\Models\Prescription::create([
                    'patient_id' => $patientId,
                    'record_id' => $recordId,
                    'doctor_id' => $doctorId,
                    'medication' => $prescription['medication'],
                    'dosage' => $prescription['dosage'] ?? '',
                    'frequency' => $prescription['frequency'] ?? '',
                    'duration' => $prescription['duration'] ?? '',
                    'instructions' => $prescription['instructions'] ?? '',
                    'quantity' => $prescription['quantity'] ?? '',
                    'prescription_date' => $date,
                    'reference_number' => 'RX-' . time() . '-' . rand(1000, 9999),
                    'status' => 'active',
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to save prescription: " . $e->getMessage());
            }
        }
    }

    /**
     * Get patient's past records for consultation history
     */
    public function getPatientPastRecords($patientId)
    {
        $user = Auth::user();

        // Ensure the doctor has access to this patient's records
        $hasAccess = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('patient_id', $patientId)
            ->exists();

        if (!$hasAccess) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        // Get the most recent records for this patient
        $records = PatientRecord::where('patient_id', $patientId)
            ->where('assigned_doctor_id', $user->id)
            ->whereNotIn('record_type', [PatientRecord::TYPE_MEDICAL_CHECKUP]) // Exclude regular appointments
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Process records to extract diagnoses and findings
        $records->transform(function ($record) {
            $data = [
                'id' => $record->id,
                'record_type' => $record->record_type,
                'appointment_date' => $record->appointment_date,
            ];

            // Extract vital signs if available
            if ($record->vital_signs) {
                $data['vital_signs'] = is_string($record->vital_signs)
                    ? json_decode($record->vital_signs, true)
                    : $record->vital_signs;
            }

            // Try to extract diagnosis and findings from details if stored as JSON
            try {
                $detailsArray = is_string($record->details)
                    ? json_decode($record->details, true)
                    : $record->details;

                if (is_array($detailsArray)) {
                    if (isset($detailsArray['diagnosis'])) {
                        $data['diagnosis'] = $detailsArray['diagnosis'];
                    }
                    if (isset($detailsArray['findings'])) {
                        $data['findings'] = $detailsArray['findings'];
                    }
                }
            } catch (\Exception $e) {
                // Not a valid JSON or no fields of interest
            }

            return $data;
        });

        return response()->json(['records' => $records]);
    }
}
