<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixMigrations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrations:fix';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix migration issues by removing problematic migrations';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Checking migrations table...');

        // Check if the problematic migration exists
        $exists = DB::table('migrations')
            ->where('migration', '2024_05_12_142600_add_columns_to_doctor_schedules_table')
            ->exists();

        if ($exists) {
            // Remove the problematic migration
            DB::table('migrations')
                ->where('migration', '2024_05_12_142600_add_columns_to_doctor_schedules_table')
                ->delete();

            $this->info('Problematic migration removed from migrations table.');
        } else {
            $this->info('Problematic migration not found in migrations table.');
        }

        return Command::SUCCESS;
    }
}
