<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class PatientController extends Controller
{
    /**
     * Display a listing of the doctor's patients
     */
    public function index()
    {
        $user = Auth::user();

        // Get patients assigned to this doctor
        $patients = PatientRecord::where('assigned_doctor_id', $user->id)
            ->distinct('patient_id')
            ->with('patient')
            ->get()
            ->pluck('patient')
            ->unique('id')
            ->values();

        return Inertia::render('Doctor/Patients', [
            'user' => $user,
            'patients' => $patients
        ]);
    }

    /**
     * Display patient details
     */
    public function show($id)
    {
        $user = Auth::user();
        $patient = User::findOrFail($id);

        // Check if this patient is assigned to the doctor
        $isAssigned = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('patient_id', $id)
            ->exists();

        if (!$isAssigned) {
            return redirect()->route('doctor.patients.index')
                ->with('error', 'You do not have permission to view this patient.');
        }

        // Fetch patient records for this doctor only
        $patientRecords = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('patient_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Group records by type for easier access in the frontend
        $groupedRecords = [
            'all' => $patientRecords,
            'medical_records' => $patientRecords->filter(function($record) {
                return $record->record_type === PatientRecord::TYPE_MEDICAL_RECORD;
            }),
            'checkups' => $patientRecords->filter(function($record) {
                return $record->record_type === PatientRecord::TYPE_MEDICAL_CHECKUP;
            }),
            'lab_results' => $patientRecords->filter(function($record) {
                return $record->record_type === PatientRecord::TYPE_LABORATORY;
            }),
            'pending' => $patientRecords->filter(function($record) {
                return $record->status === PatientRecord::STATUS_PENDING;
            }),
            'completed' => $patientRecords->filter(function($record) {
                return $record->status === PatientRecord::STATUS_COMPLETED;
            }),
        ];

        // Add additional patient information if needed
        $patientData = [
            'id' => $patient->id,
            'name' => $patient->name,
            'email' => $patient->email,
            'created_at' => $patient->created_at,
            'patientRecords' => $patientRecords,
            'recordStats' => [
                'total' => $patientRecords->count(),
                'pending' => $groupedRecords['pending']->count(),
                'completed' => $groupedRecords['completed']->count(),
            ],
            'groupedRecords' => $groupedRecords,
        ];

        return Inertia::render('Doctor/PatientView', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'patient' => $patientData
        ]);
    }

    /**
     * Register a new patient
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'medical_history' => 'nullable|string',
            'allergies' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Generate a random password for the user
        $password = Str::random(12);

        // Create the new patient user
        $patient = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($password),
            'user_role' => User::ROLE_PATIENT,
        ]);

        // Create an initial record connecting the patient to the doctor
        $details = "Initial patient registration.\n";
        if ($request->medical_history) {
            $details .= "\nMedical History: " . $request->medical_history;
        }
        if ($request->allergies) {
            $details .= "\nAllergies: " . $request->allergies;
        }

        $patientRecord = PatientRecord::create([
            'patient_id' => $patient->id,
            'assigned_doctor_id' => Auth::id(),
            'record_type' => PatientRecord::TYPE_MEDICAL_RECORD,
            'status' => PatientRecord::STATUS_COMPLETED,
            'details' => $details,
            'appointment_date' => now(),
        ]);

        // Store additional patient data if needed
        // You could create a separate PatientProfile model to store these fields
        // For now, we can store them in the details field of the PatientRecord

        // TODO: Send email to patient with their account details (optional)

        return redirect()->route('doctor.patients.index')
            ->with('success', 'Patient registered successfully');
    }

    /**
     * Update patient information
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $patient = User::findOrFail($id);

        // Verify this patient is assigned to the doctor
        $isAuthorized = PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('patient_id', $patient->id)
            ->exists();

        if (!$isAuthorized) {
            abort(403, 'Unauthorized');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($patient->id)
            ],
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $patient->name = $request->name;
        $patient->email = $request->email;

        if ($request->filled('password')) {
            $patient->password = Hash::make($request->password);
        }

        $patient->save();

        return redirect()->route('doctor.patients.show', $patient->id)
            ->with('success', 'Patient information updated successfully');
    }

    /**
     * Delete a patient association
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $patient = User::findOrFail($id);

        // Delete all records connecting this patient to the doctor
        PatientRecord::where('assigned_doctor_id', $user->id)
            ->where('patient_id', $patient->id)
            ->delete();

        return redirect()->route('doctor.patients.index')
            ->with('success', 'Patient removed successfully');
    }

    public function search(Request $request)
    {
        $user = Auth::user();
        $searchTerm = $request->get('search', '');

        $patients = [];

        if ($searchTerm) {
            // Search for patients assigned to this doctor by name or email
            $patientIds = PatientRecord::where('assigned_doctor_id', $user->id)
                ->distinct('patient_id')
                ->pluck('patient_id');

            $patients = User::whereIn('id', $patientIds)
                ->where(function($query) use ($searchTerm) {
                    $query->where('name', 'like', "%{$searchTerm}%")
                        ->orWhere('email', 'like', "%{$searchTerm}%");
                })
                ->get();
        }

        return Inertia::render('Doctor/PatientSearch', [
            'user' => $user,
            'searchTerm' => $searchTerm,
            'patients' => $patients
        ]);
    }
}
