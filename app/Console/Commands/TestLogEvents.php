<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class TestLogEvents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:test-events {--count=5 : Number of test events to generate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate test login and logout events for testing logs visualization';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $count = $this->option('count');
        $this->info("Generating {$count} login and logout events...");
        
        $roles = ['admin', 'doctor', 'clinical_staff', 'patient'];
        $users = User::whereIn('user_role', $roles)->limit(10)->get();

        if ($users->isEmpty()) {
            $this->error('No users found for testing!');
            return 1;
        }

        $this->info('Found ' . $users->count() . ' users for testing.');
        
        // Generate login events
        $bar = $this->output->createProgressBar($count * 2);
        $bar->start();
        
        for ($i = 0; $i < $count; $i++) {
            // Get a random user
            $user = $users->random();
            
            // Generate a login event
            $this->generateLoginEvent($user);
            $bar->advance();
            
            // Wait a second between events
            sleep(1);
            
            // Generate a logout event for the same user
            $this->generateLogoutEvent($user);
            $bar->advance();
            
            // Wait a second between events
            sleep(1);
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("Successfully generated {$count} login and logout events.");
        
        return 0;
    }
    
    /**
     * Generate a login event for a user
     *
     * @param \App\Models\User $user
     * @return void
     */
    protected function generateLoginEvent(User $user)
    {
        Log::channel('daily')->info('User login', [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->user_role,
            'ip' => '127.0.0.' . rand(1, 255),
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'event_type' => 'LOGIN'
        ]);
    }
    
    /**
     * Generate a logout event for a user
     *
     * @param \App\Models\User $user
     * @return void
     */
    protected function generateLogoutEvent(User $user)
    {
        Log::channel('daily')->info('User logout', [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->user_role,
            'ip' => '127.0.0.' . rand(1, 255),
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'event_type' => 'LOGOUT'
        ]);
    }
}
