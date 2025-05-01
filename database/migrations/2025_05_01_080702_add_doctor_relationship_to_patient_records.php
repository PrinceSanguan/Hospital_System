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
        Schema::table('patient_records', function (Blueprint $table) {
            // Make sure the columns exist and are unsigned bigIntegers
            if (!Schema::hasColumn('patient_records', 'patient_id')) {
                $table->unsignedBigInteger('patient_id')->after('id');
            }

            if (!Schema::hasColumn('patient_records', 'assigned_doctor_id')) {
                $table->unsignedBigInteger('assigned_doctor_id')->nullable()->after('patient_id');
            }
        });

        // Add foreign keys using try-catch to handle duplicates
        try {
            Schema::table('patient_records', function (Blueprint $table) {
                $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            });
        } catch (\Exception $e) {
            // Foreign key already exists
        }

        try {
            Schema::table('patient_records', function (Blueprint $table) {
                $table->foreign('assigned_doctor_id')->references('id')->on('users')->onDelete('set null');
            });
        } catch (\Exception $e) {
            // Foreign key already exists
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('patient_records', function (Blueprint $table) {
                $table->dropForeign(['patient_id']);
            });
        } catch (\Exception $e) {
            // Foreign key may not exist
        }

        try {
            Schema::table('patient_records', function (Blueprint $table) {
                $table->dropForeign(['assigned_doctor_id']);
            });
        } catch (\Exception $e) {
            // Foreign key may not exist
        }
    }
};
