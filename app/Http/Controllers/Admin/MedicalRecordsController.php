<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class MedicalRecordsController extends Controller
{
    /**
     * Display a listing of medical records
     */
    public function index()
    {
        $user = Auth::user();

        $medicalRecords = PatientRecord::with(['patient', 'assignedDoctor'])
            ->whereNot(function($query) {
                // Exclude records that are associated with pending appointments
                $query->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
                      ->where('status', PatientRecord::STATUS_PENDING);
            })
            ->latest('updated_at')
            ->paginate(10);

        return Inertia::render('Admin/MedicalRecords', [
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
     * Show the form for creating a new medical record
     */
    public function create()
    {
        $user = Auth::user();
        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('Admin/MedicalRecordForm', [
            'user' => [
                'id' => $user->id,
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

        return redirect()->route('admin.medical-records')
            ->with('success', 'Medical record created successfully');
    }

    /**
     * Display the specified medical record
     */
    public function show($id)
    {
        $user = Auth::user();
        $record = PatientRecord::with(['patient', 'assignedDoctor.doctorProfile'])
            ->findOrFail($id);

        // Check if this is a pending appointment
        $isPending = $record->record_type === PatientRecord::TYPE_MEDICAL_CHECKUP &&
                     $record->status === PatientRecord::STATUS_PENDING;

        // Get all doctors to help with doctor information display
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->with('doctorProfile')
            ->get();

        return Inertia::render('Admin/MedicalRecordsView', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
            'doctors' => $doctors,
            'isPending' => $isPending,
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

        // Check if this is a pending appointment - if so, don't allow editing
        if ($record->record_type === PatientRecord::TYPE_MEDICAL_CHECKUP &&
            $record->status === PatientRecord::STATUS_PENDING) {
            return redirect()->route('admin.medical-records')
                ->with('error', 'Medical records for pending appointments cannot be edited until the appointment is accepted.');
        }

        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('Admin/MedicalRecordsEdit', [
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

        // Check if this is a pending appointment - if so, don't allow updating
        if ($record->record_type === PatientRecord::TYPE_MEDICAL_CHECKUP &&
            $record->status === PatientRecord::STATUS_PENDING) {
            return redirect()->route('admin.medical-records')
                ->with('error', 'Medical records for pending appointments cannot be updated until the appointment is accepted.');
        }

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

        return redirect()->route('admin.medical-records')
            ->with('success', 'Medical record updated successfully');
    }

    /**
     * Save prescriptions to the Prescription model
     */
    private function savePrescriptions($prescriptions, $patientId, $doctorId, $recordId, $date)
    {
        // Delete existing prescriptions for this record to avoid duplicates
        Prescription::where('record_id', $recordId)->delete();

        // Make sure prescriptions is an array
        if (!is_array($prescriptions)) {
            try {
                $prescriptions = json_decode($prescriptions, true);
            } catch (\Exception $e) {
                Log::error("Failed to parse prescriptions: " . $e->getMessage());
                return;
            }
        }

        foreach ($prescriptions as $prescription) {
            // Skip empty prescriptions
            if (empty($prescription['medication'])) {
                continue;
            }

            try {
                Prescription::create([
                    'patient_id' => $patientId,
                    'record_id' => $recordId,
                    'doctor_id' => $doctorId,
                    'medication' => $prescription['medication'],
                    'dosage' => $prescription['dosage'] ?? '',
                    'frequency' => $prescription['frequency'] ?? '',
                    'duration' => $prescription['duration'] ?? '',
                    'instructions' => $prescription['instructions'] ?? '',
                    'prescription_date' => $date,
                    'reference_number' => 'RX-' . time() . '-' . rand(1000, 9999),
                    'status' => 'active',
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to save prescription: " . $e->getMessage());
            }
        }
    }

    /**
     * Download prescription as PDF
     */
    public function downloadPrescription($id)
    {
        try {
            $prescription = Prescription::with(['patient', 'doctor', 'record'])
                ->findOrFail($id);

            $data = [
                'prescription' => $prescription,
                'hospital' => [
                    'name' => 'FamCare Medical Center',
                    'address' => '123 Healthcare Blvd, Medical City',
                    'phone' => '+1 (555) 123-4567',
                    'email' => 'info@famcare.example',
                ],
            ];

            $pdf = Pdf::loadView('pdfs.prescription', $data);
            return $pdf->download('prescription_' . $prescription->reference_number . '.pdf');
        } catch (\Exception $e) {
            Log::error("Failed to generate prescription PDF: " . $e->getMessage());
            return back()->with('error', 'Failed to download prescription');
        }
    }

    /**
     * Get prescriptions for a medical record
     */
    public function getPrescriptions($recordId)
    {
        $prescriptions = Prescription::where('record_id', $recordId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($prescriptions);
    }

    /**
     * Remove the specified medical record
     */
    public function destroy($id)
    {
        $record = PatientRecord::findOrFail($id);
        $record->delete();

        // Also delete associated prescriptions
        Prescription::where('record_id', $id)->delete();

        return redirect()->route('admin.medical-records')
            ->with('success', 'Medical record deleted successfully');
    }

    /**
     * Get patient medical history
     */
    public function patientHistory($patientId)
    {
        $records = PatientRecord::with(['assignedDoctor'])
            ->where('patient_id', $patientId)
            ->orderBy('appointment_date', 'desc')
            ->get();

        return response()->json($records);
    }

    /**
     * Generate a PDF for the medical record
     */
    public function generatePdf($id)
    {
        try {
            $record = PatientRecord::with(['patient', 'assignedDoctor'])->findOrFail($id);

            // Get patient information
            $patient = $record->patient;
            if (!$patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Patient information not found'
                ], 404);
            }

            // Get doctor information
            $doctor = $record->assignedDoctor;

            // Parse details
            $details = [];
            if ($record->details) {
                if (is_string($record->details)) {
                    $details = json_decode($record->details, true) ?: [];
                } else {
                    $details = (array) $record->details;
                }

                // Recursively parse any nested JSON objects
                $details = $this->parseNestedJsonObjects($details);
            }

            // Format data for PDF
            $data = [
                'record' => [
                    'id' => $record->id,
                    'record_type' => ucfirst(str_replace('_', ' ', $record->record_type)),
                    'date' => $record->appointment_date,
                    'formatted_date' => date('F j, Y', strtotime($record->appointment_date)),
                    'status' => $record->status,
                    'created_at' => $record->created_at->format('Y-m-d H:i:s'),
                ],
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone ?? '',
                    'birthdate' => $patient->birthdate ?? '',
                    'gender' => $patient->gender ?? '',
                ],
                'doctor' => $doctor ? [
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                ] : null,
                'hospital' => [
                    'name' => 'FamCare Medical Center',
                    'address' => '123 Healthcare Blvd, Medical City',
                    'phone' => '+1 (555) 123-4567',
                    'email' => 'info@famcare.example',
                ],
                'details' => $details
            ];

            // Generate PDF using DOMPDF
            $pdf = Pdf::loadView('pdfs.medical_record', $data);

            // Return the PDF for download
            return $pdf->download('medical_record_' . $record->id . '.pdf');
        } catch (\Exception $e) {
            Log::error('Error generating PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recursively parse any JSON strings in an array
     *
     * @param array $data
     * @return array
     */
    private function parseNestedJsonObjects(array $data): array
    {
        foreach ($data as $key => $value) {
            // Check if value is a string and looks like JSON
            if (is_string($value) && (substr($value, 0, 1) === '{' || substr($value, 0, 1) === '[')) {
                $decoded = json_decode($value, true);
                // Only replace if it's valid JSON
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $data[$key] = $decoded;
                    // Recursively check the decoded array for more JSON strings
                    $data[$key] = $this->parseNestedJsonObjects($decoded);
                }
            } elseif (is_array($value)) {
                // Recursively check nested arrays
                $data[$key] = $this->parseNestedJsonObjects($value);
            }
        }

        return $data;
    }
}
