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
        // Add phone_number column if it doesn't exist
        if (!Schema::hasColumn('doctor_profiles', 'phone_number')) {
            Schema::table('doctor_profiles', function (Blueprint $table) {
                $table->string('phone_number')->nullable()->after('doctor_id');
            });
        }

        // If there's a misnamed column like 'phone' that needs to be fixed
        if (Schema::hasColumn('doctor_profiles', 'phone') && !Schema::hasColumn('doctor_profiles', 'phone_number')) {
            Schema::table('doctor_profiles', function (Blueprint $table) {
                $table->renameColumn('phone', 'phone_number');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as this is a fix
    }
};
