<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixDoctorScheduleTimeFormat extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-doctor-schedule-time-format';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix the time format in doctor schedules to ensure HH:MM format';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing doctor schedule time formats...');

        // First we'll modify any existing records with invalid time formats
        $schedules = DB::table('doctor_schedules')->get();
        $updatedCount = 0;

        foreach ($schedules as $schedule) {
            $startTime = $schedule->start_time;
            $endTime = $schedule->end_time;
            $originalStartTime = $startTime;
            $originalEndTime = $endTime;

            // Fix the time format to be HH:MM
            if ($startTime) {
                if (strpos($startTime, 'T') !== false) {
                    // Handle ISO format like "2023-05-02T09:00:00"
                    $parts = explode('T', $startTime);
                    if (isset($parts[1])) {
                        $timeParts = explode(':', $parts[1]);
                        $startTime = $timeParts[0] . ':' . $timeParts[1];
                    }
                } elseif (strpos($startTime, ' ') !== false) {
                    // Handle format like "2023-05-02 09:00:00"
                    $parts = explode(' ', $startTime);
                    if (isset($parts[1])) {
                        $timeParts = explode(':', $parts[1]);
                        $startTime = $timeParts[0] . ':' . $timeParts[1];
                    }
                }
            } else {
                $startTime = "09:00";
            }

            if ($endTime) {
                if (strpos($endTime, 'T') !== false) {
                    // Handle ISO format
                    $parts = explode('T', $endTime);
                    if (isset($parts[1])) {
                        $timeParts = explode(':', $parts[1]);
                        $endTime = $timeParts[0] . ':' . $timeParts[1];
                    }
                } elseif (strpos($endTime, ' ') !== false) {
                    // Handle standard format
                    $parts = explode(' ', $endTime);
                    if (isset($parts[1])) {
                        $timeParts = explode(':', $parts[1]);
                        $endTime = $timeParts[0] . ':' . $timeParts[1];
                    }
                }
            } else {
                $endTime = "17:00";
            }

            // Update the record with the fixed time format if there were changes
            if ($startTime !== $originalStartTime || $endTime !== $originalEndTime) {
                DB::table('doctor_schedules')
                    ->where('id', $schedule->id)
                    ->update([
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                    ]);

                $updatedCount++;
                $this->info("Updated schedule ID {$schedule->id}: $originalStartTime → $startTime, $originalEndTime → $endTime");
            }
        }

        $this->info("Fixed $updatedCount of " . count($schedules) . " doctor schedules.");
    }
}
