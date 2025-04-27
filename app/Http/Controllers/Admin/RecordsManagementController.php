<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class RecordsManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = PatientRecord::with(['patient', 'assignedDoctor'])
            ->orderBy('created_at', 'desc');

        // Add filtering logic here if needed
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->whereHas('patient', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%');
                });
            });
        }

        if ($request->has('record_type') && $request->record_type !== 'all') {
            $query->where('record_type', $request->record_type);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $records = $query->paginate(10);

        // Get all record types
        $recordTypes = ['medical_checkup', 'laboratory', 'prescription', 'consultation'];

        // Get all status options
        $statusOptions = ['pending', 'completed', 'cancelled'];

        // Get all patients
        $patients = User::where('user_role', User::ROLE_PATIENT)
            ->get(['id', 'name', 'email']);

        // Get all doctors
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/RecordsManagement', [
            'records' => $records,
            'recordTypes' => $recordTypes,
            'statusOptions' => $statusOptions,
            'patients' => $patients,
            'doctors' => $doctors,
            'filters' => $request->only(['search', 'record_type', 'status']),
        ]);
    }

    public function create()
    {
        // Get all record types
        $recordTypes = ['medical_checkup', 'laboratory', 'prescription', 'consultation'];

        // Get all status options
        $statusOptions = ['pending', 'completed', 'cancelled'];

        // Get all patients
        $patients = User::where('user_role', User::ROLE_PATIENT)
            ->get(['id', 'name', 'email']);

        // Get all doctors
        $doctors = User::where('user_role', User::ROLE_DOCTOR)
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/RecordsManagement', [
            'creating' => true,
            'recordTypes' => $recordTypes,
            'statusOptions' => $statusOptions,
            'patients' => $patients,
            'doctors' => $doctors,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'nullable|exists:users,id',
            'record_type' => 'required|string',
            'status' => 'required|string',
            'appointment_date' => 'required|date',
            'details' => 'nullable|string',
            'lab_results' => 'nullable|json',
        ]);

        PatientRecord::create($request->all());

        return redirect()->route('admin.records.index')->with('success', 'Record created successfully');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            'assigned_doctor_id' => 'nullable|exists:users,id',
            'record_type' => 'required|string',
            'status' => 'required|string',
            'appointment_date' => 'required|date',
            'details' => 'nullable|string',
            'lab_results' => 'nullable|json',
        ]);

        $record = PatientRecord::findOrFail($id);
        $record->update($request->all());

        return redirect()->route('admin.records.index')->with('success', 'Record updated successfully');
    }

    public function destroy($id)
    {
        $record = PatientRecord::findOrFail($id);
        $record->delete();

        return redirect()->route('admin.records.index')->with('success', 'Record deleted successfully');
    }
}
