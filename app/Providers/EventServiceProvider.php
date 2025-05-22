<?php

namespace App\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // Add other event listeners here
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        // Listen for successful login events
        Event::listen(function (Login $event) {
            Log::channel('daily')->info('Login event', [
                'user_id' => $event->user->id,
                'name' => $event->user->name,
                'email' => $event->user->email,
                'role' => $event->user->user_role,
                'guard' => $event->guard,
                'event_type' => 'LOGIN_EVENT'
            ]);
        });
        
        // Listen for logout events
        Event::listen(function (Logout $event) {
            if ($event->user) {
                Log::channel('daily')->info('Logout event', [
                    'user_id' => $event->user->id,
                    'name' => $event->user->name,
                    'email' => $event->user->email,
                    'role' => $event->user->user_role,
                    'guard' => $event->guard,
                    'event_type' => 'LOGOUT_EVENT'
                ]);
            }
        });
        
        // Listen for failed login attempts
        Event::listen(function (Failed $event) {
            if (isset($event->credentials['email'])) {
                Log::channel('daily')->warning('Login failed', [
                    'email' => $event->credentials['email'],
                    'guard' => $event->guard,
                    'event_type' => 'LOGIN_FAILED'
                ]);
            }
        });
    }
}
