<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class GuestMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // Get the authenticated user
                $user = Auth::guard($guard)->user();

                // Redirect based on user role using the constants from User model
                switch ($user->user_role) {
                    case User::ROLE_ADMIN:
                        return redirect()->route('admin.dashboard');
                    case User::ROLE_DOCTOR:
                        return redirect()->route('doctor.dashboard');
                    case User::ROLE_CLINICAL_STAFF:
                        return redirect()->route('staff.dashboard');
                    case User::ROLE_PATIENT:
                        return redirect()->route('patient.dashboard');
                    default:
                        return redirect()->route('dashboard');
                }
            }
        }

        return $next($request);
    }
}
