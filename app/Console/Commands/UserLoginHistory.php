<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class UserLoginHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:login-history 
                            {--date= : Optional specific date in Y-m-d format} 
                            {--role= : Filter by user role}
                            {--user= : Filter by username}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display user login history from log files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = $this->option('date');
        $role = $this->option('role');
        $user = $this->option('user');
        
        $logPath = storage_path('logs');
        
        // Get all log files or specific date log
        if ($date) {
            $files = [File::glob($logPath . '/laravel-' . $date . '.log')];
            if (empty($files[0])) {
                $this->error("No log file found for date: $date");
                return 1;
            }
        } else {
            $files = File::glob($logPath . '/laravel-*.log');
        }
        
        $this->info('Parsing log files for login events...');
        $this->newLine();
        
        $headers = ['Date/Time', 'Event', 'User', 'Email', 'Role', 'IP'];
        $loginData = [];
        
        // Process each log file
        foreach ($files as $file) {
            if (!File::exists($file)) {
                continue;
            }
            
            $content = File::get($file);
            
            // Extract login events
            $pattern = '/\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\].*?(?:User login|User logout|Login event|Logout event).*?(\{.*?\})(?=\[\d{4}-\d{2}-\d{2}|\z)/s';
            
            if (preg_match_all($pattern, $content, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    $datetime = $match[1];
                    $jsonData = json_decode($match[2], true);
                    
                    if (!$jsonData) {
                        continue;
                    }
                    
                    // Apply filters
                    if ($role && (!isset($jsonData['role']) || $jsonData['role'] !== $role)) {
                        continue;
                    }
                    
                    if ($user && (!isset($jsonData['name']) || stripos($jsonData['name'], $user) === false)) {
                        continue;
                    }
                    
                    $eventType = $jsonData['event_type'] ?? 'UNKNOWN';
                    $userName = $jsonData['name'] ?? 'N/A';
                    $userEmail = $jsonData['email'] ?? 'N/A';
                    $userRole = $jsonData['role'] ?? 'N/A';
                    $ip = $jsonData['ip'] ?? 'N/A';
                    
                    $loginData[] = [
                        'datetime' => $datetime,
                        'event' => $eventType,
                        'user' => $userName,
                        'email' => $userEmail,
                        'role' => $userRole,
                        'ip' => $ip
                    ];
                }
            }
        }
        
        // Sort by datetime (newest first)
        usort($loginData, function($a, $b) {
            return strtotime($b['datetime']) - strtotime($a['datetime']);
        });
        
        // Display the table
        if (count($loginData) > 0) {
            $this->table($headers, $loginData);
            $this->info('Total entries found: ' . count($loginData));
        } else {
            $this->warn('No login events found matching your criteria.');
        }
        
        return 0;
    }
}
