<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;

class PatientsController extends Controller
{
    /**
     * Find a patient by ID
     *
     * @param int $id
     * @return JsonResponse
     */
    public function find($id): JsonResponse
    {
        try {
            $patient = Patient::findOrFail($id);
            return response()->json([
                'success' => true,
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'reference_number' => $patient->reference_number,
                    // Add other patient fields as needed
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found'
            ], 404);
        }
    }

    /**
     * Get a patient's appointments
     *
     * @param int $id
     * @return JsonResponse
     */
    public function appointments($id): JsonResponse
    {
        try {
            $patient = Patient::findOrFail($id);

            $appointments = Appointment::where('patient_id', $patient->id)
                ->orderBy('appointment_date', 'desc')
                ->get()
                ->map(function($appointment) {
                    return [
                        'id' => $appointment->id,
                        'appointment_date' => $appointment->appointment_date,
                        'status' => $appointment->status,
                        'reason' => $appointment->reason ?: 'Consultation',
                    ];
                });

            return response()->json([
                'success' => true,
                'appointments' => $appointments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving appointments: ' . $e->getMessage()
            ], 500);
        }
    }
}
