<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filter by role if provided
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('user_role', $request->role);
        }

        // Search by name or email
        if ($request->has('search') && $request->search !== '') {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // Get paginated results
        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/UserManagement', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
            'roles' => [
                'all' => 'All Roles',
                User::ROLE_ADMIN => 'Admin',
                User::ROLE_DOCTOR => 'Doctor',
                User::ROLE_CLINICAL_STAFF => 'Clinical Staff',
                User::ROLE_PATIENT => 'Patient',
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        return Inertia::render('Admin/UserForm', [
            'roles' => [
                User::ROLE_ADMIN => 'Admin',
                User::ROLE_DOCTOR => 'Doctor',
                User::ROLE_CLINICAL_STAFF => 'Clinical Staff',
                User::ROLE_PATIENT => 'Patient',
            ],
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
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
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        return Inertia::render('Admin/UserForm', [
            'user' => $user,
            'roles' => [
                User::ROLE_ADMIN => 'Admin',
                User::ROLE_DOCTOR => 'Doctor',
                User::ROLE_CLINICAL_STAFF => 'Clinical Staff',
                User::ROLE_PATIENT => 'Patient',
            ],
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
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
                'password' => 'required|string|min:8',
            ]);
            $validatedData['password'] = Hash::make($request->password);
        }

        $user->update($validatedData);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully');
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
