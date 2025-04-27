<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class PatientMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthorized access',
                ], 401);
            }

            // Redirect to login with error message
            return redirect()->route('auth.login')
                ->with('error', 'Please login to access this page');
        }

        // Check if authenticated user has patient role
        $user = Auth::user();
        if ($user->user_role !== User::ROLE_PATIENT) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Access denied. This area is for patients only',
                ], 403);
            }

            // Redirect to home with error message
            return redirect()->route('home')
                ->with('error', 'Access denied. This area is for patients only');
        }

        return $next($request);
    }
}
