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
        // For both MySQL and PostgreSQL, ensure the doctor_id column exists correctly
        if (!Schema::hasColumn('doctor_profiles', 'doctor_id')) {
            Schema::table('doctor_profiles', function (Blueprint $table) {
                $table->foreignId('doctor_id')->after('id')->constrained('users')->onDelete('cascade');
            });
        }
        
        // If we have both PostgreSQL and MySQL environments, we might need to fix column names
        // This is a defensive approach to handle discrepancies between environments
        if (Schema::hasColumn('doctor_profiles', 'doctor_profiles.doctor_id')) {
            // Rename the incorrectly named column 
            Schema::table('doctor_profiles', function (Blueprint $table) {
                $table->renameColumn('doctor_profiles.doctor_id', 'doctor_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as this is just fixing an issue
    }
};
