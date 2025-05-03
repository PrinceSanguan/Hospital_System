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
        Schema::table('patient_records', function (Blueprint $table) {
            // Add service_id column if it doesn't exist
            if (!Schema::hasColumn('patient_records', 'service_id')) {
                $table->foreignId('service_id')->nullable()->after('assigned_doctor_id')
                    ->constrained('doctor_services')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            // Drop the foreign key and column
            $table->dropForeign(['service_id']);
            $table->dropColumn('service_id');
        });
    }
};
