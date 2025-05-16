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
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users');
            $table->foreignId('record_id')->nullable()->constrained('patient_records');
            $table->foreignId('doctor_id')->nullable()->constrained('users');
            $table->string('medication');
            $table->string('dosage');
            $table->string('frequency');
            $table->string('duration')->nullable();
            $table->text('instructions')->nullable();
            $table->date('prescription_date');
            $table->string('reference_number')->unique();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
