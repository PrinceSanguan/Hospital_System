<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class GenerateLoginLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:generate-test-data {count=10 : Number of log entries to generate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate test login log data for testing the logs viewer';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = (int)$this->argument('count');
        $this->info("Generating {$count} test login log entries...");
        
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->error('No users found in the database.');
            return 1;
        }
        
        $eventTypes = ['LOGIN', 'LOGOUT', 'LOGIN_EVENT', 'LOGOUT_EVENT', 'LOGIN_FAILED'];
        $ips = ['192.168.1.1', '10.0.0.5', '172.16.0.10', '127.0.0.1', '45.56.78.90'];
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
        ];
        
        $bar = $this->output->createProgressBar($count);
        $bar->start();
        
        for ($i = 0; $i < $count; $i++) {
            $user = $users->random();
            $eventType = $eventTypes[array_rand($eventTypes)];
            $ip = $ips[array_rand($ips)];
            $userAgent = $userAgents[array_rand($userAgents)];
            
            // Generate a random date within the last 30 days
            $randomDate = now()->subDays(rand(0, 30))->subHours(rand(0, 24))->subMinutes(rand(0, 60));
            
            // Mock the timestamp in the log message
            $timestamp = $randomDate->format('Y-m-d H:i:s');
            
            $message = $eventType === 'LOGIN_FAILED' ? 'Login failed' : 'User ' . strtolower(str_replace('_EVENT', '', $eventType));
            
            // Log with context
            Log::channel('daily')->info($message, [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
                'ip' => $ip,
                'user_agent' => $userAgent,
                'event_type' => $eventType,
                'timestamp' => $timestamp // This won't affect the actual log timestamp but is included in the JSON data
            ]);
            
            $bar->advance();
            
            // Small delay to avoid rate limiting
            usleep(50000); // 50ms
        }
        
        $bar->finish();
        $this->newLine(2);
        $this->info('Test login log entries generated successfully.');
        
        return 0;
    }
}
