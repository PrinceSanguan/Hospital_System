<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First set schedule_date to nullable
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->date('schedule_date')->nullable()->change();
        });

        // Update existing records that have null schedule_date
        $schedules = DB::table('doctor_schedules')
            ->whereNull('schedule_date')
            ->get();

        foreach ($schedules as $schedule) {
            $scheduleDate = null;

            // Use specific_date if available, otherwise calculate from day_of_week
            if ($schedule->specific_date) {
                $scheduleDate = $schedule->specific_date;
            } elseif ($schedule->day_of_week !== null) {
                $today = Carbon::today();
                $dayOfWeek = (int)$schedule->day_of_week;
                $scheduleDate = $today->dayOfWeek === $dayOfWeek
                    ? $today->format('Y-m-d')
                    : $today->next($dayOfWeek)->format('Y-m-d');
            }

            // Only update if we determined a schedule_date
            if ($scheduleDate) {
                DB::table('doctor_schedules')
                    ->where('id', $schedule->id)
                    ->update(['schedule_date' => $scheduleDate]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // The column won't be reverted to non-nullable to prevent data loss
    }
};
