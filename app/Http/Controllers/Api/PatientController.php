<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PatientController extends Controller
{
    /**
     * Search for patients by name or reference number
     */
    public function search(Request $request)
    {
        try {
            $term = $request->input('term');
            $exact = $request->boolean('exact', false);

            Log::info('Patient search request', [
                'term' => $term,
                'exact' => $exact
            ]);

            $query = Patient::query();

            if ($exact && preg_match('/^PAT\d{6}$/i', $term)) {
                // If it's an exact reference number search, prioritize exact matches
                $query->where('reference_number', $term)
                      ->orWhere('reference_number', strtoupper($term))
                      ->orWhere('reference_number', strtolower($term));
            } else {
                // General search
                $query->where(function($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                      ->orWhere('reference_number', 'like', "%{$term}%");
                });
            }

            $patients = $query->select('id', 'name', 'reference_number')
                              ->limit(10)
                              ->get();

            Log::info('Patient search results', [
                'count' => $patients->count(),
                'results' => $patients->toArray()
            ]);

            return response()->json([
                'success' => true,
                'patients' => $patients,
                'count' => $patients->count(),
                'match_type' => $exact ? 'exact' : 'partial'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in patient search', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Server error during search'], 500);
        }
    }

    /**
     * Get appointments for a specific patient
     */
    public function getAppointments(Request $request, $patientId)
    {
        $appointments = Appointment::where('patient_id', $patientId)
                                   ->where('status', 'completed')
                                   ->orderBy('appointment_date', 'desc')
                                   ->get();

        return response()->json([
            'success' => true,
            'appointments' => $appointments
        ]);
    }
}
