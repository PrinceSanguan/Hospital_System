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
        // Drop the table if it exists to avoid conflicts
        Schema::dropIfExists('record_requests');

        Schema::create('record_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->foreign('patient_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('record_type'); // medical_record, lab_record
            $table->unsignedBigInteger('record_id')->nullable(); // ID of the requested record
            $table->text('request_reason')->nullable();
            $table->string('status')->default('pending'); // pending, approved, denied
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('denied_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            // Index on frequently queried columns
            $table->index(['patient_id', 'status']);
            $table->index(['record_type', 'record_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('record_requests');
    }
};
