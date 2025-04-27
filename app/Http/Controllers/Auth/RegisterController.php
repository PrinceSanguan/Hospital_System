<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class RegisterController extends Controller
{
    // Show the registration form
    public function index()
    {
        // Pass available roles for registration (excluding admin)
        $availableRoles = [
            User::ROLE_PATIENT => 'Patient',
            User::ROLE_CLINICAL_STAFF => 'Clinical Staff',
            User::ROLE_DOCTOR => 'Doctor/Manager',
        ];

        return Inertia::render('Auth/Register', [
            'availableRoles' => $availableRoles
        ]);
    }

    // Store registration data
    public function store(Request $request)
    {
        // Validate request
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'user_role' => 'required|in:patient,clinical_staff,doctor',
        ]);

        // Create a new user
        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_role' => $request->user_role,
        ]);

        // Redirect to login or dashboard
        return redirect()->route('auth.login')->with('success', 'Account created successfully! Please log in to continue.');
    }
}
