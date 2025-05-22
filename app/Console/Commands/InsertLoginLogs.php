<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use App\Models\User;
use Faker\Factory as Faker;

class InsertLoginLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:insert-logins {count=10 : Number of login/logout pairs to generate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Insert login/logout events into logs for testing';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $count = $this->argument('count');
        $faker = Faker::create();
        $this->info("Generating {$count} login/logout pairs...");

        // Get some real users if available
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->error('No users found in the database for testing!');
            return 1;
        }
        
        $this->info('Found ' . $users->count() . ' users to use for login events.');
        
        $bar = $this->output->createProgressBar($count * 2); // Login and logout for each count
        $bar->start();
        
        // Random time windows to spread out login events
        $timeWindows = [
            ['start' => 8, 'end' => 10],  // Morning login time
            ['start' => 12, 'end' => 14], // Lunch time
            ['start' => 16, 'end' => 19], // Evening
        ];
        
        for ($i = 0; $i < $count; $i++) {
            // Pick a random user
            $user = $users->random();
            
            // Choose a random window for this user's login
            $window = $faker->randomElement($timeWindows);
            
            // Create a random login time within the window
            $loginHour = $faker->numberBetween($window['start'], $window['end']);
            $loginMinute = $faker->numberBetween(0, 59);
            
            // Calculate a random session time (10 minutes to 8 hours)
            $sessionMinutes = $faker->numberBetween(10, 480);
            
            // Format login and logout times
            $loginTimestamp = Carbon::today()->setTime($loginHour, $loginMinute);
            $logoutTimestamp = (clone $loginTimestamp)->addMinutes($sessionMinutes);
            
            // Generate IP and user agent
            $ip = $faker->ipv4;
            $userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
            ];
            $userAgent = $faker->randomElement($userAgents);
            
            // Generate login event
            $this->logLoginEvent($user, $ip, $userAgent, $loginTimestamp);
            $bar->advance();

            // Give a small pause to make sure timestamps are sequential
            usleep(10000); // 10ms
            
            // Generate logout event
            $this->logLogoutEvent($user, $ip, $userAgent, $logoutTimestamp);
            $bar->advance();
            
            // Give another pause between pairs of events
            usleep(10000); // 10ms
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('Successfully generated login/logout events!');

        return 0;
    }
    
    /**
     * Log a login event
     *
     * @param \App\Models\User $user
     * @param string $ip
     * @param string $userAgent
     * @param \Carbon\Carbon $timestamp
     * @return void
     */
    protected function logLoginEvent($user, $ip, $userAgent, $timestamp)
    {
        $message = "User login";
        $context = [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->user_role,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'event_type' => 'LOGIN'
        ];
        
        $this->writeLogEntry('info', $message, $context, $timestamp);
    }
    
    /**
     * Log a logout event
     *
     * @param \App\Models\User $user
     * @param string $ip
     * @param string $userAgent
     * @param \Carbon\Carbon $timestamp
     * @return void
     */
    protected function logLogoutEvent($user, $ip, $userAgent, $timestamp)
    {
        $message = "User logout";
        $context = [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->user_role,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'event_type' => 'LOGOUT'
        ];
        
        $this->writeLogEntry('info', $message, $context, $timestamp);
    }
    
    /**
     * Write a log entry directly to the log file
     *
     * @param string $level
     * @param string $message
     * @param array $context
     * @param \Carbon\Carbon $timestamp
     * @return void
     */
    protected function writeLogEntry($level, $message, $context, $timestamp)
    {
        $dateFormat = 'Y-m-d H:i:s';
        $timestampStr = $timestamp->format($dateFormat);
        
        // Format: [timestamp] channel.LEVEL: Message {"json":"context"}
        $logLine = "[{$timestampStr}] local.".strtoupper($level).": {$message} ".json_encode($context).PHP_EOL;
        
        // Write directly to today's log file
        $logFile = storage_path('logs/laravel-'.date('Y-m-d').'.log');
        file_put_contents($logFile, $logLine, FILE_APPEND);
    }
}
