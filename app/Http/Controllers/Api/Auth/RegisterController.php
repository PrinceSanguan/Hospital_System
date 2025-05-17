<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class RegisterController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Check database connection
            $connection = DB::connection()->getPdo();

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6|confirmed',
                'date_of_birth' => 'required|date|before:today',
                'gender' => 'required|in:male,female,other',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Start transaction
            DB::beginTransaction();

            try {
                // Create a new user with patient role
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'user_role' => User::ROLE_PATIENT,
                ]);

                // Create a new patient record
                $patient = $this->createPatient($user, [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'gender' => $validated['gender'],
                ]);

                // Commit transaction
                DB::commit();

                // Return success response for API
                return response()->json([
                    'status' => 'success',
                    'message' => 'Registration successful!',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->user_role,
                    ],
                    'patient' => [
                        'id' => $patient->id,
                        'reference_number' => $patient->reference_number
                    ],
                    'redirect_to' => '/register'
                ], 201);
            } catch (\Exception $e) {
                // Rollback transaction if there was an error
                DB::rollBack();
                Log::error('Registration error: ' . $e->getMessage());

                return response()->json([
                    'status' => 'error',
                    'message' => 'Registration failed',
                    'error' => $e->getMessage()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Database connection error: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Database connection error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    protected function createPatient($user, $data)
    {
        try {
            $latestPatient = Patient::latest('id')->first();
            $nextId = $latestPatient ? $latestPatient->id + 1 : 1;
            $referenceNumber = 'PAT' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

            // Create patient data
            $patientData = [
                'user_id' => $user->id,
                'reference_number' => $referenceNumber,
                'name' => $data['name'],
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'contact_number' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
            ];

            // Create the patient
            $patient = Patient::create($patientData);
            return $patient;
        } catch (\Exception $e) {
            Log::error('Error creating patient: ' . $e->getMessage());
            throw $e;
        }
    }
}
