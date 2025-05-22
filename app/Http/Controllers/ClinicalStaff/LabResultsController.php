<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\LabResult;
use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'test_type' => 'required|string|max:255',
                'test_date' => 'required|date',
                'scan_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'notes' => 'nullable|string',
            ]);

            if (!$request->hasFile('scan_file') || !$request->file('scan_file')->isValid()) {
                return response()->json(['message' => 'File upload failed. Please try again.'], 422);
            }

            $file = $request->file('scan_file');
            $extension = $file->getClientOriginalExtension();
            $filename = 'lab_result_' . time() . '_' . Str::random(10) . '.' . $extension;

            $publicPath = 'lab_result';
            $destinationPath = public_path($publicPath);

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            if (!$file->move($destinationPath, $filename)) {
                Log::error('Failed to move uploaded file');
                return response()->json(['message' => 'Failed to move uploaded file.'], 500);
            }

            $relativePath = $publicPath . '/' . $filename;

            $labResult = LabResult::create([
                'patient_id' => $validated['patient_id'],
                'test_type' => $validated['test_type'],
                'test_date' => $validated['test_date'],
                'file_path' => $relativePath,
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id()
            ]);

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Lab result uploaded successfully', 'lab_result' => $labResult], 200);
            }

            return redirect()->back()->with('success', 'Lab result uploaded successfully');
        } catch (\Exception $e) {
            Log::error('Lab result upload error: ' . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to upload lab result: ' . $e->getMessage());
        }
    }

    public function show(LabResult $labResult)
    {
        // Include file information for the frontend
        $fileInfo = [
            'path' => $labResult->file_path,
            'extension' => pathinfo($labResult->file_path, PATHINFO_EXTENSION),
            'filename' => pathinfo($labResult->file_path, PATHINFO_FILENAME),
            'filesize' => Storage::exists($labResult->file_path) ? Storage::size($labResult->file_path) : 0,
        ];

        return Inertia::render('ClinicalStaff/LabResultDetail', [
            'labResult' => array_merge($labResult->load('patient')->toArray(), ['file_info' => $fileInfo]),
        ]);
    }

    /**
     * Display the file in the browser
     */
    public function view(LabResult $labResult)
    {
        try {
            $publicFilePath = public_path($labResult->file_path);

            if (!file_exists($publicFilePath)) {
                Log::error('File not found: ' . $publicFilePath);
                abort(404, 'File not found');
            }

            $extension = pathinfo($publicFilePath, PATHINFO_EXTENSION);
            $mimeType = match (strtolower($extension)) {
                'pdf' => 'application/pdf',
                'jpg', 'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                default => 'application/octet-stream'
            };

            return response()->file($publicFilePath, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . basename($publicFilePath) . '"'
            ]);
        } catch (\Exception $e) {
            Log::error('File view error: ' . $e->getMessage());
            abort(500, 'Error viewing file');
        }
    }

    /**
     * Download the file
     */
    public function download(LabResult $labResult)
    {
        try {
            Log::info('Download request for lab result ID: ' . $labResult->id);
            Log::info('File path from database: ' . $labResult->file_path);

            if (empty($labResult->file_path)) {
                abort(404, 'File path not found');
            }

            $publicFilePath = public_path($labResult->file_path);
            Log::info('Full file path: ' . $publicFilePath);

            if (!file_exists($publicFilePath)) {
                Log::error('File not found at: ' . $publicFilePath);
                abort(404, 'File not found');
            }

            $extension = pathinfo($publicFilePath, PATHINFO_EXTENSION);
            $filename = Str::slug($labResult->test_type) . '_' . $labResult->id . '.' . $extension;

            return response()->download($publicFilePath, $filename);
        } catch (\Exception $e) {
            Log::error('File download error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            abort(500, 'Error downloading file: ' . $e->getMessage());
        }
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

    /**
     * Get direct URL for the file
     */
    public function getPublicUrl(LabResult $labResult)
    {
        try {
            $publicFilePath = public_path($labResult->file_path);

            if (!file_exists($publicFilePath)) {
                return response()->json(['error' => 'File not found'], 404);
            }

            $extension = pathinfo($labResult->file_path, PATHINFO_EXTENSION);
            $publicUrl = url($labResult->file_path);
            $mimeType = mime_content_type($publicFilePath);

            return response()->json([
                'url' => $publicUrl,
                'filename' => Str::slug($labResult->test_type) . '_' . $labResult->id . '.' . $extension,
                'mime_type' => $mimeType,
                'is_pdf' => strtolower($extension) === 'pdf'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getPublicUrl: ' . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    /**
     * Direct download method with full error reporting
     */
    public function directDownload(LabResult $labResult)
    {
        try {
            Log::info('Direct download request for lab result ID: ' . $labResult->id);
            Log::info('File path from database: ' . $labResult->file_path);

            if (empty($labResult->file_path)) {
                abort(404, 'File path not found');
            }

            $publicFilePath = public_path($labResult->file_path);
            Log::info('Full file path: ' . $publicFilePath);

            if (!file_exists($publicFilePath)) {
                Log::error('File not found at: ' . $publicFilePath);
                abort(404, 'File not found');
            }

            $extension = pathinfo($publicFilePath, PATHINFO_EXTENSION);
            $filename = Str::slug($labResult->test_type) . '_' . $labResult->id . '.' . $extension;

            return response()->download($publicFilePath, $filename);
        } catch (\Exception $e) {
            Log::error('Error in directDownload: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            abort(500, 'Error downloading file: ' . $e->getMessage());
        }
    }
}
