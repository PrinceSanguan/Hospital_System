<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * These schedules are run in a single, continuous, process.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
    
    /**
     * The commands to be registered.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\UserLoginHistory::class,
        \App\Console\Commands\GenerateLoginLogs::class,
        \App\Console\Commands\TestLogEvents::class,
        \App\Console\Commands\InsertLoginLogs::class,
    ];
        Commands\GenerateLoginLogs::class,
    ];

    protected $commands = [
        Commands\CheckTableExists::class,
        // ... other commands ...
    ];
}
