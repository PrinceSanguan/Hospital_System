<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminMiddleware
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

        // Check if authenticated user has admin role
        $user = Auth::user();
        if ($user->user_role !== User::ROLE_ADMIN) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Access denied. Admin privileges required',
                ], 403);
            }

            // Redirect to home with error message
            return redirect()->route('home')
                ->with('error', 'Access denied. Admin privileges required');
        }

        // Share navigation data with all admin views
        Inertia::share([
            'admin' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->user_role
                ],
                'navigation' => [
                    'current' => $request->route()->getName(),
                    'items' => [
                        [
                            'name' => 'Dashboard',
                            'route' => 'admin.dashboard',
                            'icon' => 'dashboard'
                        ],
                        [
                            'name' => 'Appointments',
                            'route' => 'admin.appointments',
                            'icon' => 'appointments'
                        ],
                        [
                            'name' => 'Doctor Schedule',
                            'route' => 'admin.doctor-schedules',
                            'icon' => 'appointments'
                        ],

                        [
                            'name' => 'Medical Records',
                            'route' => 'admin.medical-records',
                            'icon' => 'medical'
                        ],
                        [
                            'name' => 'Receipts',
                            'route' => 'admin.receipts',
                            'icon' => 'receipts'
                        ],
                        [
                            'name' => 'User Management',
                            'route' => 'admin.users.index',
                            'icon' => 'users'
                        ],
                        [
                            'name' => 'Reports',
                            'route' => 'admin.reports.index',
                            'icon' => 'reports'
                        ],
                        [
                            'name' => 'Settings',
                            'route' => 'admin.settings',
                            'icon' => 'settings'
                        ]
                    ]
                ]
            ]
        ]);

        return $next($request);
    }
}
