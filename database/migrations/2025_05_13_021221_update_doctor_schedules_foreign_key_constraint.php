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
        // First, get the foreign key constraint name
        $foreignKeys = $this->getForeignKeyConstraintDetails();
        $foreignKeyName = null;

        foreach ($foreignKeys as $foreignKey) {
            if ($foreignKey->COLUMN_NAME === 'doctor_id' && $foreignKey->REFERENCED_TABLE_NAME === 'doctors') {
                $foreignKeyName = $foreignKey->CONSTRAINT_NAME;
                break;
            }
        }

        if ($foreignKeyName) {
            // Drop the existing foreign key constraint
            Schema::table('doctor_schedules', function (Blueprint $table) use ($foreignKeyName) {
                $table->dropForeign($foreignKeyName);
            });

            // Add a new foreign key constraint that references users table
            Schema::table('doctor_schedules', function (Blueprint $table) {
                $table->foreign('doctor_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, drop the foreign key constraint to users if it exists
        $foreignKeys = $this->getForeignKeyConstraintDetails();
        $foreignKeyName = null;

        foreach ($foreignKeys as $foreignKey) {
            if ($foreignKey->COLUMN_NAME === 'doctor_id' && $foreignKey->REFERENCED_TABLE_NAME === 'users') {
                $foreignKeyName = $foreignKey->CONSTRAINT_NAME;
                break;
            }
        }

        if ($foreignKeyName) {
            Schema::table('doctor_schedules', function (Blueprint $table) use ($foreignKeyName) {
                $table->dropForeign($foreignKeyName);
            });

            // Re-add the original foreign key constraint to doctors table
            Schema::table('doctor_schedules', function (Blueprint $table) {
                $table->foreign('doctor_id')
                    ->references('id')
                    ->on('doctors')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Get foreign key constraint details from information_schema
     */
    private function getForeignKeyConstraintDetails()
    {
        return DB::table('information_schema.KEY_COLUMN_USAGE')
            ->select(['CONSTRAINT_NAME', 'COLUMN_NAME', 'REFERENCED_TABLE_NAME', 'REFERENCED_COLUMN_NAME'])
            ->where('TABLE_SCHEMA', '=', config('database.connections.mysql.database'))
            ->where('TABLE_NAME', '=', 'doctor_schedules')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->get();
    }
};
