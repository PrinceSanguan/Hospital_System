<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\LabResult;
use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LabResultsController extends Controller
{
    public function index(Request $request)
    {
        $query = LabResult::with('patient');

        // Filter by patient if requested
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        $labResults = $query->latest()->paginate(10);

        // If viewing for a specific patient
        $patient = null;
        if ($request->filled('patient_id')) {
            $patient = Patient::find($request->patient_id);
        }

        return Inertia::render('ClinicalStaff/LabResults', [
            'labResults' => $labResults,
            'patient' => $patient,
            'isPatientView' => (bool) $request->filled('patient_id')
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'test_type' => 'required|string|max:255',
            'test_date' => 'required|date',
            'scan_file' => 'required|file|max:10240', // 10MB max
            'notes' => 'nullable|string',
        ]);

        // Store the file
        $path = $request->file('scan_file')->store('lab_results');

        $labResult = LabResult::create([
            'patient_id' => $validated['patient_id'],
            'test_type' => $validated['test_type'],
            'test_date' => $validated['test_date'],
            'file_path' => $path,
            'notes' => $validated['notes'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Lab result uploaded successfully');
    }

    public function show(LabResult $labResult)
    {
        return Inertia::render('ClinicalStaff/LabResultDetail', [
            'labResult' => $labResult->load('patient'),
        ]);
    }

    public function download(LabResult $labResult)
    {
        return Storage::download($labResult->file_path, Str::slug($labResult->test_type) . '_' . $labResult->id . '.pdf');
    }

    public function destroy(LabResult $labResult)
    {
        // Delete the file from storage
        if (Storage::exists($labResult->file_path)) {
            Storage::delete($labResult->file_path);
        }

        $labResult->delete();

        return redirect()->back()->with('success', 'Lab result deleted successfully');
    }
}
