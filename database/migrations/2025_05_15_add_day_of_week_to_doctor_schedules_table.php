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
        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('doctor_schedules', 'day_of_week')) {
                $table->integer('day_of_week')->nullable()->after('doctor_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('doctor_schedules', 'day_of_week')) {
                $table->dropColumn('day_of_week');
            }
        });
    }
};
