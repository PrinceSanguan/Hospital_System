<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\RecordRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RecordRequestController extends Controller
{
    /**
     * Display a listing of the patient's record requests
     */
    public function index()
    {
        $user = Auth::user();

        $requests = RecordRequest::where('patient_id', $user->id)
            ->with(['approver'])
            ->latest()
            ->paginate(10);

        // Get the IDs of approved requests to allow access to records
        $approvedRequestIds = RecordRequest::where('patient_id', $user->id)
            ->where('status', RecordRequest::STATUS_APPROVED)
            ->where(function($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->pluck('record_id')
            ->toArray();

        return Inertia::render('Patient/RecordRequests', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'requests' => $requests,
            'approvedRequestIds' => $approvedRequestIds,
        ]);
    }

    /**
     * Show request form for a new record access request
     */
    public function create(Request $request)
    {
        $user = Auth::user();
        $type = $request->query('type', 'medical_record');

        // Get medical records that belong to the patient
        $medicalRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where(function($query) {
                $query->where('record_type', 'medical_record')
                    ->orWhere('record_type', 'medical_checkup');
            })
            ->latest('appointment_date')
            ->get();

        // Get lab records that belong to the patient
        $labRecords = PatientRecord::with('assignedDoctor')
            ->where('patient_id', $user->id)
            ->where('record_type', 'lab_record')
            ->latest('created_at')
            ->get();

        return Inertia::render('Patient/CreateRecordRequest', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'medicalRecords' => $medicalRecords,
            'labRecords' => $labRecords,
            'initialRecordType' => $type,
        ]);
    }

    /**
     * Store a new record access request
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'record_type' => 'required|in:medical_record,lab_record',
            'record_id' => 'required|integer|exists:patient_records,id',
            'request_reason' => 'required|string|max:500',
        ]);

        // Verify the requested record belongs to the patient
        $record = PatientRecord::where('id', $validated['record_id'])
            ->where('patient_id', $user->id)
            ->firstOrFail();

        // Check if there's already a pending or approved request for this record
        $existingRequest = RecordRequest::where('patient_id', $user->id)
            ->where('record_id', $validated['record_id'])
            ->where('record_type', $validated['record_type'])
            ->where(function($query) {
                $query->where('status', RecordRequest::STATUS_PENDING)
                    ->orWhere(function($q) {
                        $q->where('status', RecordRequest::STATUS_APPROVED)
                            ->where(function($subq) {
                                $subq->whereNull('expires_at')
                                    ->orWhere('expires_at', '>', now());
                            });
                    });
            })
            ->first();

        if ($existingRequest) {
            if ($existingRequest->status === RecordRequest::STATUS_PENDING) {
                return redirect()->back()->with('error', 'You already have a pending request for this record.');
            } else {
                return redirect()->back()->with('error', 'You already have access to this record.');
            }
        }

        // Create the new record request
        RecordRequest::create([
            'patient_id' => $user->id,
            'record_type' => $validated['record_type'],
            'record_id' => $validated['record_id'],
            'request_reason' => $validated['request_reason'],
            'status' => RecordRequest::STATUS_PENDING,
        ]);

        return redirect()->route('patient.records.requests.index')
            ->with('success', 'Your record access request has been submitted and is pending approval.');
    }

    /**
     * View an approved record
     */
    public function viewApprovedRecord($id)
    {
        $user = Auth::user();

        // Find the approved request
        $request = RecordRequest::where('id', $id)
            ->where('patient_id', $user->id)
            ->where('status', RecordRequest::STATUS_APPROVED)
            ->where(function($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        // Get the corresponding record
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('id', $request->record_id)
            ->firstOrFail();

        // Determine which view to render based on record type
        if ($request->record_type === RecordRequest::TYPE_MEDICAL) {
            return Inertia::render('Patient/ViewMedicalRecord', [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'record' => $record,
                'request' => $request,
            ]);
        } else {
            return Inertia::render('Patient/ViewLabRecord', [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'record' => $record,
                'request' => $request,
            ]);
        }
    }
}
