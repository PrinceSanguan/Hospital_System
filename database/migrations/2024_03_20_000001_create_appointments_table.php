<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('assigned_doctor_id')->nullable();
            $table->datetime('appointment_date');
            $table->string('status')->default('pending'); // pending, confirmed, completed, cancelled
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('fee', 10, 2)->nullable();
            $table->json('details')->nullable();
            $table->string('record_type')->nullable();
            $table->string('reference_number')->nullable();
            $table->timestamps();

            // Add foreign key for assigned_doctor_id
            $table->foreign('assigned_doctor_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
