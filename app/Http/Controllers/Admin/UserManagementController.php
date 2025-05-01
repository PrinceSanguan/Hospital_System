<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserManagementController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = User::query();

        // Apply filters
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('user_role', $request->role);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(10);

        $roles = [
            User::ROLE_PATIENT,
            User::ROLE_DOCTOR,
            User::ROLE_CLINICAL_STAFF,
            User::ROLE_ADMIN
        ];

        return Inertia::render('Admin/UserManagement', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $user = Auth::user();

        $roles = [
            User::ROLE_PATIENT,
            User::ROLE_DOCTOR,
            User::ROLE_CLINICAL_STAFF,
            User::ROLE_ADMIN
        ];

        return Inertia::render('Admin/UserForm', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'user_role' => ['required', Rule::in([
                    User::ROLE_ADMIN,
                    User::ROLE_DOCTOR,
                    User::ROLE_CLINICAL_STAFF,
                    User::ROLE_PATIENT,
                ])],
            ]);

            $validatedData['password'] = Hash::make($validatedData['password']);

            User::create($validatedData);

            return redirect()->route('admin.users.index')
                ->with('success', 'User created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create user: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $authUser = Auth::user();

        $roles = [
            User::ROLE_PATIENT,
            User::ROLE_DOCTOR,
            User::ROLE_CLINICAL_STAFF,
            User::ROLE_ADMIN
        ];

        return Inertia::render('Admin/UserForm', [
            'user' => [
                'name' => $authUser->name,
                'email' => $authUser->email,
                'role' => $authUser->user_role,
            ],
            'editUser' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                'user_role' => ['required', Rule::in([
                    User::ROLE_ADMIN,
                    User::ROLE_DOCTOR,
                    User::ROLE_CLINICAL_STAFF,
                    User::ROLE_PATIENT,
                ])],
            ]);

            // Only update password if provided
            if ($request->filled('password')) {
                $request->validate([
                    'password' => 'required|string|min:8|confirmed',
                ]);
                $validatedData['password'] = Hash::make($request->password);
            }

            $user->update($validatedData);

            return redirect()->route('admin.users.index')
                ->with('success', 'User updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to update user: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully');
    }
}
