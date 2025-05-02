<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First we'll modify any existing records with invalid time formats
        $schedules = DB::table('doctor_schedules')->get();

        foreach ($schedules as $schedule) {
            $startTime = $schedule->start_time;
            $endTime = $schedule->end_time;

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

            // Update the record with the fixed time format
            DB::table('doctor_schedules')
                ->where('id', $schedule->id)
                ->update([
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this migration as it only fixes data
    }
};

                ->update([
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this migration as it only fixes data
    }
};

                if (strlen($startTime) > 5) {
                    $startTime = substr($startTime, 11, 5); // Extract HH:MM from datetime
                }
            }

            if (strpos($endTime, ':') !== false) {
                // Extract just the HH:MM part if it's a full datetime
                if (strlen($endTime) > 5) {
                    $endTime = substr($endTime, 11, 5); // Extract HH:MM from datetime
                }
            }

            // Update the record with the fixed time format
            DB::table('doctor_schedules')
                ->where('id', $schedule->id)
                ->update([
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // If needed, roll back to the previous format
        Schema::table('doctor_schedules', function (Blueprint $table) {
            // This assumes the previous format was datetime
            $table->time('start_time')->change();
            $table->time('end_time')->change();
        });
    }
};
