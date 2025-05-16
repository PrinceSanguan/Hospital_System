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
        // For PostgreSQL, we need to handle this differently
        if (DB::getDriverName() === 'pgsql') {
            // First drop the column if it exists
            if (Schema::hasColumn('users', 'user_role')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('user_role');
                });
            }

            // Then add it back with the correct type and constraints
            Schema::table('users', function (Blueprint $table) {
                $table->string('user_role')->default('patient');
            });

            // Add check constraint separately
            DB::statement("ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (user_role IN ('admin', 'patient', 'clinical_staff', 'doctor'))");
        } else {
            // For other databases like MySQL, use the original approach
            Schema::table('users', function (Blueprint $table) {
                $table->enum('user_role', ['admin', 'patient', 'clinical_staff', 'doctor'])->default('patient')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // First remove the check constraint
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role");

            // Then drop and recreate the column with original values
            if (Schema::hasColumn('users', 'user_role')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('user_role');
                });
            }

            Schema::table('users', function (Blueprint $table) {
                $table->string('user_role')->default('user');
            });
        } else {
            // For other databases, include all possible roles to avoid data truncation
            Schema::table('users', function (Blueprint $table) {
                $table->enum('user_role', ['admin', 'user', 'patient', 'clinical_staff', 'doctor'])->default('user')->change();
            });
        }
    }
};
