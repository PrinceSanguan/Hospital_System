<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Display the patient's profile.
     */
    public function index()
    {
        $user = Auth::user();

        // Get patient's appointments
        $appointments = PatientRecord::where('patient_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_CHECKUP)
            ->with('assignedDoctor:id,name')
            ->orderBy('appointment_date', 'desc')
            ->get();

        // Get patient's medical records
        $medicalRecords = PatientRecord::where('patient_id', $user->id)
            ->where('record_type', PatientRecord::TYPE_MEDICAL_RECORD)
            ->with('assignedDoctor:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Patient/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'appointments' => $appointments,
            'medicalRecords' => $medicalRecords,
            'registrationDate' => $user->created_at,
        ]);
    }

    /**
     * Display the form for editing the patient's profile.
     */
    public function edit()
    {
        $user = Auth::user();

        return Inertia::render('Patient/ProfileEdit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
        ]);
    }

    /**
     * Update the patient's profile.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        // Update user data using the User model
        User::where('id', $user->id)->update([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
        ]);

        // If password was provided, update it separately
        if (isset($validatedData['password'])) {
            User::where('id', $user->id)->update([
                'password' => bcrypt($validatedData['password']),
            ]);
        }

        return redirect()->route('patient.my-profile.index')
            ->with('success', 'Profile updated successfully');
    }
}
