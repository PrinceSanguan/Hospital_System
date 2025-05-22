<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */    public function handle(Request $request, Closure $next): Response
    {
        // Get the current user (if authenticated)
        $user = Auth::user();
        
        // If a user is logged in, log their activity
        if ($user) {
            $route = $request->route()->getName() ?? 'unknown';
            
            // Extract the base route name (e.g., 'admin.logs.show' -> 'logs.show')
            $parts = explode('.', $route);
            $action = count($parts) > 1 ? implode('.', array_slice($parts, 1)) : $route;
              // Determine the specific action for logs route
            if ($action === 'logs') {
                $actionDescription = 'viewed logs list';
            } elseif ($action === 'logs.show') {
                $actionDescription = 'viewed log file';
            } elseif ($action === 'logs.download') {
                $actionDescription = 'downloaded log file';
            } elseif ($action === 'logs.destroy') {
                $actionDescription = 'deleted log file';
            } else {
                $actionDescription = 'accessed ' . $route;
            }
            
            // Log the activity with user information
            Log::channel('daily')->info('User activity', [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'ip' => $request->ip(),
                'route' => $route,
                'action' => $actionDescription,
                'method' => $request->method(),
                'event_type' => 'USER_ACTIVITY',
                'path' => $request->path()
            ]);
        }
        
        return $next($request);
    }
}
