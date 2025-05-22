<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Attempt login using Auth
        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();

            // Check if user is a patient
            if ($user->user_role != 'patient') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Only patients can access this endpoint'
                ], 403);
            }
            
            // Log the API login event
            \Illuminate\Support\Facades\Log::channel('daily')->info('API User login', [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'event_type' => 'API_LOGIN'
            ]);

            // Revoke old tokens (optional but recommended)
            $user->tokens()->delete();

            // Create a new sanctum token
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role,
                ],
                'token' => $token,  // Return token to client
                'redirect_to' => '/patient/dashboard'
            ]);
        }

        // If login fails
        return response()->json([
            'status' => 'error',
            'message' => 'Invalid email or password'
        ], 401);
    }
}
