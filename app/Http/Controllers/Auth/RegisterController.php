<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RegisterController extends Controller
{
    // Show the registration form
    public function index()
    {
        // Users will automatically be registered as patients
        return Inertia::render('Auth/Register');
    }

    // Store registration data
    public function store(Request $request)
    {
        try {
            // Check database connection and log the database information
            $connection = DB::connection()->getPdo();
            $dbDriver = config('database.default');
            Log::info("Connected to database driver: " . $dbDriver);
            Log::info("Database name: " . config("database.connections.{$dbDriver}.database"));

            // Validate request
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'email' => 'required|email|unique:users,email',
                    'password' => 'required|min:6|confirmed',
                    'date_of_birth' => 'required|date|before:today',
                    'gender' => 'required|in:male,female,other',
                    'phone' => 'required|string|max:20',
                    'address' => 'required|string|max:500',
                ]);

                Log::info("Validation passed", ['email' => $validated['email']]);
            } catch (ValidationException $e) {
                Log::error("Validation failed", [
                    'errors' => $e->errors(),
                ]);
                throw $e;
            }

            // Start transaction to ensure both user and patient are created or neither
            DB::beginTransaction();

            try {
                // Create a new user with patient role
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($validated['password']),
                    'user_role' => User::ROLE_PATIENT, // Automatically set as patient
                ]);

                Log::info("User created successfully", ['user_id' => $user->id]);

                // Create a new patient record
                $patient = $this->createPatient($user, [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'gender' => $validated['gender'],
                ]);

                Log::info("Patient record created successfully", ['patient_id' => $patient->id]);

                // Commit transaction
                DB::commit();
                Log::info("Transaction committed successfully");

                // Redirect to login or dashboard
                return redirect()->route('auth.login')->with('success', 'Account created successfully! Please log in to continue.');

            } catch (\Exception $e) {
                // Rollback transaction if there was an error
                DB::rollBack();
                Log::error('Registration error: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);

                return back()->withErrors([
                    'database' => 'An error occurred while creating your account: ' . $e->getMessage()
                ])->withInput();
            }
        } catch (\Exception $e) {
            Log::error('Database connection error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'database' => 'Unable to connect to the database: ' . $e->getMessage()
            ])->withInput();
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

            // Log the patient data being created
            Log::info('Attempting to create patient', $patientData);

            // Create the patient and log for debugging
            $patient = Patient::create($patientData);
            Log::info('Patient created successfully', ['patient_id' => $patient->id]);

            return $patient;
        } catch (\Exception $e) {
            Log::error('Error creating patient: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e; // Re-throw to be caught by the transaction
        }
    }
}
