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
            // Check database connection
            $connection = DB::connection()->getPdo();
            Log::info("Connected to database: " . config('database.default'));

            // Validate request
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6|confirmed',
                'date_of_birth' => 'required|date|before:today',
                'gender' => 'required|in:male,female,other',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
            ]);

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

                // Create a new patient record
                $this->createPatient($user, [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'gender' => $validated['gender'],
                ]);

                // Commit transaction
                DB::commit();

                // Redirect to login or dashboard
                return redirect()->route('auth.login')->with('success', 'Account created successfully! Please log in to continue.');

            } catch (\Exception $e) {
                // Rollback transaction if there was an error
                DB::rollBack();
                Log::error('Registration error: ' . $e->getMessage());

                return back()->withErrors([
                    'database' => 'An error occurred while creating your account. Please try again.'
                ])->withInput();
            }
        } catch (\Exception $e) {
            Log::error('Database connection error: ' . $e->getMessage());

            return back()->withErrors([
                'database' => 'Unable to connect to the database. Please try again later.'
            ])->withInput();
        }
    }

    protected function createPatient($user, $data)
    {
        $latestPatient = Patient::latest('id')->first();
        $nextId = $latestPatient ? $latestPatient->id + 1 : 1;
        $referenceNumber = 'PAT' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

        return Patient::create([
            'user_id' => $user->id,
            'reference_number' => $referenceNumber,
            'name' => $data['name'],
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'contact_number' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
        ]);
    }
}
