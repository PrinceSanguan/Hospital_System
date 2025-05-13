<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LabRecordsController extends Controller
{
    /**
     * Display a listing of laboratory records
     */
    public function index()
    {
        $user = Auth::user();

        $labRecords = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('record_type', 'laboratory')
            ->latest('updated_at')
            ->paginate(10);

        return Inertia::render('ClinicalStaff/LabRecords', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'labRecords' => $labRecords,
        ]);
    }

    /**
     * Show the form for creating a new lab record
     */
    public function create()
    {
        $user = Auth::user();
        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('ClinicalStaff/LabRecordsAdd', [
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
     * Store a newly created lab record
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'details' => 'nullable|string',
            'lab_type' => 'required|string',
            'status' => 'required|string',
        ]);

        $record = new PatientRecord();
        $record->patient_id = $validated['patient_id'];
        $record->assigned_doctor_id = $validated['assigned_doctor_id'];
        $record->record_type = 'laboratory';
        $record->appointment_date = $validated['appointment_date'];
        $record->status = $validated['status'];

        // Store lab-specific details as JSON
        $details = [
            'lab_type' => $validated['lab_type'],
            'appointment_time' => $request->input('appointment_time'),
            'notes' => $request->input('notes'),
            'instructions' => $request->input('instructions'),
            'additional_info' => $request->input('additional_info'),
        ];

        $record->details = json_encode($details);
        $record->save();

        return redirect()->route('staff.lab.records')
            ->with('success', 'Laboratory appointment created successfully');
    }

    /**
     * Display the specified lab record
     */
    public function show($id)
    {
        $user = Auth::user();
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('id', $id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        return Inertia::render('ClinicalStaff/LabRecordsView', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
        ]);
    }

    /**
     * Show the form for editing the specified lab record
     */
    public function edit($id)
    {
        $user = Auth::user();
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('id', $id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        return Inertia::render('ClinicalStaff/LabRecordsEdit', [
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
     * Update the specified lab record
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'lab_type' => 'required|string',
            'status' => 'required|string',
        ]);

        $record = PatientRecord::where('id', $id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        $record->patient_id = $validated['patient_id'];
        $record->assigned_doctor_id = $validated['assigned_doctor_id'];
        $record->appointment_date = $validated['appointment_date'];
        $record->status = $validated['status'];

        // Update lab-specific details
        $details = json_decode($record->details, true) ?: [];
        $details['lab_type'] = $validated['lab_type'];
        $details['appointment_time'] = $request->input('appointment_time');
        $details['notes'] = $request->input('notes');
        $details['instructions'] = $request->input('instructions');
        $details['additional_info'] = $request->input('additional_info');
        $details['results'] = $request->input('results');

        $record->details = json_encode($details);
        $record->save();

        return redirect()->route('staff.lab.records')
            ->with('success', 'Laboratory record updated successfully');
    }

    /**
     * Update the results of a lab record
     */
    public function updateResults(Request $request, $id)
    {
        $validated = $request->validate([
            'results' => 'required|string',
            'status' => 'required|string',
        ]);

        $record = PatientRecord::where('id', $id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        $details = json_decode($record->details, true) ?: [];
        $details['results'] = $validated['results'];
        $details['result_date'] = Carbon::now()->toDateString();

        $record->details = json_encode($details);
        $record->status = $validated['status'];
        $record->save();

        return redirect()->route('staff.lab.records')
            ->with('success', 'Laboratory results updated successfully');
    }

    /**
     * Remove the specified lab record
     */
    public function destroy($id)
    {
        $record = PatientRecord::where('id', $id)
            ->where('record_type', 'laboratory')
            ->firstOrFail();

        $record->delete();

        return redirect()->route('staff.lab.records')
            ->with('success', 'Laboratory record deleted successfully');
    }

    /**
     * Get pending laboratory appointments
     */
    public function pending()
    {
        $pendingLabRecords = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('record_type', 'laboratory')
            ->where('status', 'pending')
            ->latest('appointment_date')
            ->paginate(10);

        return response()->json($pendingLabRecords);
    }

    /**
     * Download lab results as PDF
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function downloadResults($id)
    {
        try {
            $labRecord = \App\Models\PatientRecord::where('id', $id)
                ->where('record_type', 'laboratory_test')
                ->with(['patient', 'assignedDoctor'])
                ->firstOrFail();

            // Get the lab result data
            $data = [
                'record' => $labRecord,
                'patient' => $labRecord->patient,
                'doctor' => $labRecord->assignedDoctor,
                'results' => json_decode($labRecord->lab_results ?? '{}', true),
                'date' => now()->format('F d, Y'),
                'hospital_name' => 'Choros Medical Center',
                'hospital_address' => '123 Medical Drive, Healthcare City',
                'hospital_contact' => '+1 234 567 8900',
            ];

            // Generate PDF filename
            $filename = 'lab_results_' . $labRecord->id . '_' . date('Ymd') . '.pdf';

            // Create PDF view
            $pdf = \PDF::loadView('pdf.lab_results', $data);

            // Return the PDF as a download
            return $pdf->download($filename);
        } catch (\Exception $e) {
            \Log::error('Error generating lab results PDF: ' . $e->getMessage());
            return back()->with('error', 'Error generating PDF. Please try again later.');
        }
    }
}
