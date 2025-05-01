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
            if (!Schema::hasColumn('patient_records', 'vital_signs')) {
                $table->json('vital_signs')->nullable()->after('lab_results');
            }

            if (!Schema::hasColumn('patient_records', 'prescriptions')) {
                $table->json('prescriptions')->nullable()->after('vital_signs');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_records', function (Blueprint $table) {
            if (Schema::hasColumn('patient_records', 'vital_signs')) {
                $table->dropColumn('vital_signs');
            }

            if (Schema::hasColumn('patient_records', 'prescriptions')) {
                $table->dropColumn('prescriptions');
            }
        });
    }
};
