<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            // Check if the specific_date column exists
            $hasColumn = Schema::hasColumn('doctor_schedules', 'specific_date');

            // If it doesn't exist, add it
            if (!$hasColumn) {
                Schema::table('doctor_schedules', function (Blueprint $table) {
                    $table->date('specific_date')->nullable()->after('notes');
                });

                // Log that we added the column
                info('Added missing specific_date column to doctor_schedules table');
            }
        } catch (\Exception $e) {
            // Log the error but don't fail the migration
            info('Error checking or adding specific_date column: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to remove the column if we're rolling back
        // as it may be used by other parts of the system
    }
};
