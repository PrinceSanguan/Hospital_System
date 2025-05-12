<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            // Add doctor_id column if it doesn't exist
            if (!Schema::hasColumn('doctor_schedules', 'doctor_id')) {
                $table->unsignedBigInteger('doctor_id')->after('id');
                
                // Add foreign key constraint
                $table->foreign('doctor_id')
                      ->references('id')
                      ->on('users') // Assuming users table
                      ->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            // Drop foreign key and column
            $table->dropForeignIfExists('doctor_schedules_doctor_id_foreign');
            $table->dropColumn('doctor_id');
        });
    }
};
