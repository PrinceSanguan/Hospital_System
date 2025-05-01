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
    public function index()
    {
        $user = Auth::user();

        $records = PatientRecord::with(['patient', 'assignedDoctor'])
            ->orderBy('appointment_date', 'desc')
            ->paginate(10);

        $recordTypes = PatientRecord::distinct('record_type')->pluck('record_type');
        $statusOptions = PatientRecord::distinct('status')->pluck('status');

        $patients = User::where('user_role', User::ROLE_PATIENT)->get(['id', 'name', 'email']);
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get(['id', 'name', 'email']);

        return Inertia::render('Admin/RecordsManagement', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'records' => $records,
            'recordTypes' => $recordTypes,
            'statusOptions' => $statusOptions,
            'patients' => $patients,
            'doctors' => $doctors,
            'filters' => request()->only(['search', 'type', 'status']),
            'pagination' => [
                'current_page' => $records->currentPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
                'last_page' => $records->lastPage(),
            ],
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        $patients = User::where('user_role', User::ROLE_PATIENT)->get(['id', 'name', 'email']);
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get(['id', 'name', 'email']);

        return Inertia::render('Admin/RecordForm', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
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

    /**
     * Show a specific record
     */
    public function show($id)
    {
        $user = Auth::user();
        $record = PatientRecord::with(['patient', 'assignedDoctor'])->findOrFail($id);

        return Inertia::render('Admin/PatientRecordDetails', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'record' => $record,
        ]);
    }
}
