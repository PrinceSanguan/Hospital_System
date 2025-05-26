<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AppointmentsController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        try {
            // Clear cache to ensure fresh data (for MySQL)
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("SET SESSION query_cache_type=0");
            }

            // Get all appointments with patient information
            $appointmentData = Appointment::select('appointments.*')
                ->join('patients', 'appointments.patient_id', '=', 'patients.id')
                ->leftJoin('users as doctors', 'appointments.assigned_doctor_id', '=', 'doctors.id')
                ->orderBy('appointments.appointment_date', 'desc')
                ->get();

            $appointments = $appointmentData->map(function ($appointment) {
                try {
                    // Get patient information
                    $patient = Patient::find($appointment->patient_id);
                    if (!$patient) {
                        Log::warning('Appointment #' . $appointment->id . ' has no associated patient');
                        return null;
                    }

                    // Get doctor information
                    $doctor = null;
                    if ($appointment->assigned_doctor_id) {
                        $doctor = User::find($appointment->assigned_doctor_id);
                    }

                    // Parse details
                    $details = [];
                    if ($appointment->details) {
                        if (is_string($appointment->details)) {
                            $details = json_decode($appointment->details, true) ?: [];
                        }
                    }

                    $time = isset($details['appointment_time']) ? $details['appointment_time'] : '';
                    $reason = $appointment->reason ?? (isset($details['reason']) ? $details['reason'] : '');

                    // Generate a reference number
                    $refNumber = $appointment->reference_number ?? ('APP' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT));

                    return [
                        'id' => $appointment->id,
                        'ref' => $refNumber,
                        'date' => Carbon::parse($appointment->appointment_date)->format('M d, Y'),
                        'time' => $time,
                        'patient' => [
                            'id' => $patient->id,
                            'name' => $patient->name,
                            'doctor' => $doctor ? 'Dr. ' . $doctor->name : '',
                        ],
                        'reason' => $reason,
                        'status' => $appointment->status,
                    ];
                } catch (\Exception $e) {
                    Log::error('Error processing appointment data: ' . $e->getMessage());
                    return null;
                }
            })->filter()->values();

            // Get status options for filter
            $statusOptions = Appointment::distinct('status')->pluck('status');

            // Get appointment types for filter
            $appointmentTypes = Appointment::distinct('record_type')->pluck('record_type');
        } catch (\Exception $e) {
            Log::error('Error fetching appointments: ' . $e->getMessage());
            $appointments = collect([]);
            $statusOptions = collect(['pending', 'confirmed', 'cancelled', 'completed']);
            $appointmentTypes = collect(['doctor_appointment', 'lab_appointment']);
        }

        return Inertia::render('Admin/Appointments', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointments' => $appointments,
            'statusOptions' => $statusOptions,
            'appointmentTypes' => $appointmentTypes,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,confirmed,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Find appointment
            $appointment = Appointment::findOrFail($id);
            $oldStatus = $appointment->status;
            $newStatus = $request->status;

            // Update appointment status
            $appointment->status = $newStatus;

            // Update details if notes provided
            if ($request->filled('notes')) {
                // Parse existing details
                $details = [];
                if ($appointment->details) {
                    if (is_string($appointment->details)) {
                        $details = json_decode($appointment->details, true) ?: [];
                    } else {
                        $details = (array) $appointment->details;
                    }
                }

                // Add status change note
                $details['status_notes'] = $request->notes;
                $details['status_updated_by'] = 'admin';
                $details['status_updated_at'] = now()->format('Y-m-d H:i:s');

                $appointment->details = json_encode($details);
            }

            $appointment->save();

            DB::commit();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => "Appointment {$newStatus} successfully",
                    'appointment' => $appointment
                ]);
            }

            return redirect()->route('admin.appointments')->with('success', "Appointment {$newStatus} successfully");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating appointment status: ' . $e->getMessage());

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update appointment status',
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to update appointment status');
        }
    }    public function show($id)
    {
        $user = Auth::user();

        try {
            // Get appointment details
            $appointment = Appointment::with('patient')->findOrFail($id);

            // Get patient information
            $patient = Patient::find($appointment->patient_id);
            if (!$patient) {
                Log::warning('Appointment #' . $appointment->id . ' has no associated patient');
                return redirect()->route('admin.appointments')->with('error', 'Patient information not found');
            }

            // Get doctor information
            $doctor = null;
            if ($appointment->assigned_doctor_id) {
                $doctor = User::find($appointment->assigned_doctor_id);
            }
              // Parse details
            $details = [];
            if ($appointment->details) {
                if (is_string($appointment->details)) {
                    $details = json_decode($appointment->details, true) ?: [];
                } else {
                    $details = (array) $appointment->details;
                }
                  // Check if medical_records exists and is a string
                if (isset($details['medical_records']) && is_string($details['medical_records'])) {
                    // Try to decode the medical_records specifically
                    $medicalRecords = json_decode($details['medical_records'], true);

                    // If valid JSON, replace the string with the array
                    if (json_last_error() === JSON_ERROR_NONE && is_array($medicalRecords)) {
                        $details['medical_records'] = $medicalRecords;

                        // Log successful parsing of medical records
                        Log::info('Successfully parsed medical_records JSON for appointment: ' . $id);
                    } else {
                        // Log failed attempt to parse medical records
                        Log::warning('Failed to parse medical_records as JSON for appointment: ' . $id . '. Error: ' . json_last_error_msg());

                        // Create a structured array with the raw value as notes
                        $details['medical_records'] = [
                            'notes' => $details['medical_records'],
                            'diagnosis' => '',
                            'treatment' => '',
                            'prescription' => '',
                            'follow_up' => '',
                            'history' => '',
                            'lab_results' => []
                        ];
                    }
                }

                // Recursively check for string-encoded JSON objects
                $details = $this->parseNestedJsonObjects($details);
            }

            // Format appointment data
            $formattedAppointment = [
                'id' => $appointment->id,
                'reference_number' => $appointment->reference_number ?? ('APP' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT)),
                'date' => Carbon::parse($appointment->appointment_date)->format('M d, Y'),
                'time' => isset($details['appointment_time']) ? $details['appointment_time'] : '',
                'reason' => $appointment->reason ?? (isset($details['reason']) ? $details['reason'] : ''),
                'status' => $appointment->status,
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'birthdate' => $patient->birthdate ? Carbon::parse($patient->birthdate)->format('M d, Y') : null,
                    'gender' => $patient->gender,
                ],
                'doctor' => $doctor ? [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                ] : null,
                'details' => $details,
                'created_at' => Carbon::parse($appointment->created_at)->format('M d, Y h:i A'),
                'updated_at' => Carbon::parse($appointment->updated_at)->format('M d, Y h:i A'),
            ];

            return Inertia::render('Admin/AppointmentDetails', [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'appointment' => $formattedAppointment,
            ]);
        } catch (\Exception $e) {
            Log::error('Error showing appointment details: ' . $e->getMessage());
            return redirect()->route('admin.appointments')->with('error', 'Failed to load appointment details');
        }
    }    /**
     * Generate a PDF for the appointment
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function generatePdf($id)
    {
        try {
            $appointment = Appointment::with(['patient'])->findOrFail($id);

            // Get patient information
            $patient = Patient::find($appointment->patient_id);
            if (!$patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Patient information not found'
                ], 404);
            }

            // Get doctor information
            $doctor = null;
            if ($appointment->assigned_doctor_id) {
                $doctor = User::find($appointment->assigned_doctor_id);
            }
              // Parse details
            $details = [];
            if ($appointment->details) {
                if (is_string($appointment->details)) {
                    $details = json_decode($appointment->details, true) ?: [];
                } else {
                    $details = (array) $appointment->details;
                }

                // Check if medical_records exists and is a string
                if (isset($details['medical_records']) && is_string($details['medical_records'])) {
                    // Try to decode the medical_records specifically
                    $medicalRecords = json_decode($details['medical_records'], true);

                    // If valid JSON, replace the string with the array
                    if (json_last_error() === JSON_ERROR_NONE && is_array($medicalRecords)) {
                        $details['medical_records'] = $medicalRecords;

                        // Log successful parsing of medical records
                        Log::info('Successfully parsed medical_records JSON for PDF generation: ' . $id);
                    } else {
                        // Log failed attempt to parse medical records
                        Log::warning('Failed to parse medical_records as JSON for PDF generation: ' . $id . '. Error: ' . json_last_error_msg());
                    }
                }

                // Recursively parse any nested JSON strings
                $details = $this->parseNestedJsonObjects($details);
            }

            // Format data for PDF
            $data = [
                'appointment' => [
                    'id' => $appointment->id,
                    'reference_number' => $appointment->reference_number ?? ('APP' . str_pad($appointment->id, 6, '0', STR_PAD_LEFT)),
                    'date' => $appointment->appointment_date,
                    'formatted_date' => date('F j, Y', strtotime($appointment->appointment_date)),
                    'time' => isset($details['appointment_time']) ? $details['appointment_time'] : '',
                    'reason' => $appointment->reason ?? (isset($details['reason']) ? $details['reason'] : ''),
                    'status' => $appointment->status,
                    'created_at' => $appointment->created_at->format('Y-m-d H:i:s'),
                ],
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'birthdate' => $patient->birthdate,
                    'gender' => $patient->gender,
                ],
                'doctor' => $doctor ? [
                    'name' => $doctor->name,
                    'email' => $doctor->email,
                ] : null,
                'hospital' => [
                    'name' => 'General Hospital',
                    'address' => '123 Main Street, City',
                    'phone' => '+1 234 567 8900',
                    'email' => 'info@generalhospital.com',
                ],
                'details' => $details
            ];

            // Generate PDF using DOMPDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.appointment', $data);

            // Return the PDF for download
            return $pdf->download('appointment_' . $appointment->id . '.pdf');
        } catch (\Exception $e) {
            Log::error('Error generating PDF: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->delete();

            return redirect()->route('admin.appointments')->with('success', 'Appointment deleted successfully');
        } catch (\Exception $e) {
            Log::error('Error deleting appointment: ' . $e->getMessage());
            return redirect()->route('admin.appointments')->with('error', 'Failed to delete appointment');
        }
    }

    /**
     * Recursively parse any JSON strings in an array
     *
     * @param array $data
     * @return array
     */    private function parseNestedJsonObjects(array $data): array
    {
        foreach ($data as $key => $value) {
            // Special handling for medical_records field
            if ($key === 'medical_records') {
                // Always try to decode medical_records if it's a string
                if (is_string($value)) {
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $data[$key] = $decoded;
                        Log::info('Successfully decoded medical_records JSON');
                    } else {
                        Log::warning('Failed to decode medical_records JSON: ' . json_last_error_msg() . ' - Value: ' . substr($value, 0, 100));
                        // Try to clean up the string if it might be a double-encoded JSON
                        $cleanedValue = str_replace('\"', '"', $value);
                        $cleanedValue = preg_replace('/^"(.*)"$/', '$1', $cleanedValue);

                        $decoded = json_decode($cleanedValue, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            $data[$key] = $decoded;
                            Log::info('Successfully decoded medical_records JSON after cleanup');
                        } else {
                            // If it's still a JSON string after parsing attempts, try to convert it to an array
                            try {
                                // Create a structured array with the string value
                                $data[$key] = [
                                    'notes' => $value,
                                    'manually_parsed' => true
                                ];
                                Log::info('Converted medical_records to a structured array');
                            } catch (\Exception $e) {
                                Log::error('Error converting medical_records: ' . $e->getMessage());
                            }
                        }
                    }
                }
            }
            // Check if value is a string and looks like JSON
            else if (is_string($value) && (substr($value, 0, 1) === '{' || substr($value, 0, 1) === '[')) {
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

    /**
     * Debug method to inspect appointment details structure
     * Accessible via /admin/appointments/debug/{id}
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function debugAppointment($id)
    {
        try {
            $appointment = Appointment::findOrFail($id);

            // Parse details
            $details = [];
            if ($appointment->details) {
                if (is_string($appointment->details)) {
                    $details = json_decode($appointment->details, true) ?: [];
                } else {
                    $details = (array) $appointment->details;
                }

                // First try to parse medical_records directly
                if (isset($details['medical_records']) && is_string($details['medical_records'])) {
                    Log::info('medical_records before parsing: ' . $details['medical_records']);

                    $medicalRecords = json_decode($details['medical_records'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($medicalRecords)) {
                        $details['medical_records'] = $medicalRecords;
                        Log::info('medical_records successfully parsed');
                    } else {
                        Log::warning('Failed to parse medical_records: ' . json_last_error_msg());
                    }
                }

                // Then apply the recursive parsing
                $parsed = $this->parseNestedJsonObjects($details);

                // Check if medical_records is still a string after parsing
                if (isset($parsed['medical_records']) && is_string($parsed['medical_records'])) {
                    Log::warning('medical_records is still a string after parsing');
                } else if (isset($parsed['medical_records']) && is_array($parsed['medical_records'])) {
                    Log::info('medical_records was successfully converted to an array');
                }
            }

            // Return detailed information about the structure
            return response()->json([
                'raw_details' => $appointment->details,
                'parsed_details' => $details,
                'medical_records_type' => isset($details['medical_records']) ? gettype($details['medical_records']) : 'not_set',
                'medical_records' => isset($details['medical_records']) ? $details['medical_records'] : null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
