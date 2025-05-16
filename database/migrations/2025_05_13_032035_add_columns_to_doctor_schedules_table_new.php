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
            if (!Schema::hasColumn('doctor_schedules', 'max_appointments')) {
                $table->integer('max_appointments')->default(10);
            }
            if (!Schema::hasColumn('doctor_schedules', 'is_approved')) {
                $table->boolean('is_approved')->default(false);
            }
            if (!Schema::hasColumn('doctor_schedules', 'status')) {
                $table->string('status')->default('pending');
            }
            if (!Schema::hasColumn('doctor_schedules', 'rejection_note')) {
                $table->text('rejection_note')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->dropColumn([
                'max_appointments',
                'is_approved',
                'status',
                'rejection_note'
            ]);
        });
    }
};
