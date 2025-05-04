<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\RecordRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RecordRequestsController extends Controller
{
    /**
     * Display a listing of all record requests
     */
    public function index()
    {
        $user = Auth::user();

        $requests = RecordRequest::with(['patient', 'approver'])
            ->latest()
            ->paginate(15);

        $pendingCount = RecordRequest::where('status', RecordRequest::STATUS_PENDING)->count();

        return Inertia::render('ClinicalStaff/RecordRequests', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'requests' => $requests,
            'pendingCount' => $pendingCount,
        ]);
    }

    /**
     * Show the detailed record request
     */
    public function show($id)
    {
        $user = Auth::user();
        $request = RecordRequest::with(['patient', 'approver'])->findOrFail($id);

        // Get the requested record details
        $record = PatientRecord::with(['patient', 'assignedDoctor'])
            ->where('id', $request->record_id)
            ->firstOrFail();

        return Inertia::render('ClinicalStaff/RecordRequestDetail', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'request' => $request,
            'record' => $record,
        ]);
    }

    /**
     * Approve a record request
     */
    public function approve(Request $request, $id)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'expires_at' => 'nullable|date|after:now',
        ]);

        $recordRequest = RecordRequest::findOrFail($id);

        // Only pending requests can be approved
        if ($recordRequest->status !== RecordRequest::STATUS_PENDING) {
            return redirect()->back()->with('error', 'Only pending requests can be approved.');
        }

        // Update the request status
        $recordRequest->status = RecordRequest::STATUS_APPROVED;
        $recordRequest->approved_by = $user->id;
        $recordRequest->approved_at = now();

        // Set expiration date if provided
        if (isset($validated['expires_at'])) {
            $recordRequest->expires_at = $validated['expires_at'];
        }

        $recordRequest->save();

        return redirect()->route('staff.record-requests.index')
            ->with('success', 'Record request has been approved.');
    }

    /**
     * Deny a record request
     */
    public function deny(Request $request, $id)
    {
        $validated = $request->validate([
            'denied_reason' => 'required|string|max:500',
        ]);

        $recordRequest = RecordRequest::findOrFail($id);

        // Only pending requests can be denied
        if ($recordRequest->status !== RecordRequest::STATUS_PENDING) {
            return redirect()->back()->with('error', 'Only pending requests can be denied.');
        }

        // Update the request status
        $recordRequest->status = RecordRequest::STATUS_DENIED;
        $recordRequest->denied_reason = $validated['denied_reason'];
        $recordRequest->save();

        return redirect()->route('staff.record-requests.index')
            ->with('success', 'Record request has been denied.');
    }

    /**
     * Display pending requests dashboard
     */
    public function pendingRequests()
    {
        $user = Auth::user();

        $pendingRequests = RecordRequest::with(['patient'])
            ->where('status', RecordRequest::STATUS_PENDING)
            ->latest()
            ->get();

        return Inertia::render('ClinicalStaff/PendingRecordRequests', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'pendingRequests' => $pendingRequests,
        ]);
    }

    /**
     * Display medical record requests
     */
    public function medicalRequests()
    {
        $user = Auth::user();

        $requests = RecordRequest::with(['patient', 'approver'])
            ->where('record_type', RecordRequest::TYPE_MEDICAL)
            ->latest()
            ->paginate(15);

        $pendingCount = RecordRequest::where('status', RecordRequest::STATUS_PENDING)
            ->where('record_type', RecordRequest::TYPE_MEDICAL)
            ->count();

        return Inertia::render('ClinicalStaff/RecordRequests', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'requests' => $requests,
            'pendingCount' => $pendingCount,
            'requestType' => 'medical',
            'title' => 'Medical Record Requests',
        ]);
    }

    /**
     * Display laboratory record requests
     */
    public function labRequests()
    {
        $user = Auth::user();

        $requests = RecordRequest::with(['patient', 'approver'])
            ->where('record_type', RecordRequest::TYPE_LAB)
            ->latest()
            ->paginate(15);

        $pendingCount = RecordRequest::where('status', RecordRequest::STATUS_PENDING)
            ->where('record_type', RecordRequest::TYPE_LAB)
            ->count();

        return Inertia::render('ClinicalStaff/RecordRequests', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'requests' => $requests,
            'pendingCount' => $pendingCount,
            'requestType' => 'lab',
            'title' => 'Laboratory Record Requests',
        ]);
    }
}
