<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create patients table
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('contact_number')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });

        // Create doctors table
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('specialization')->nullable();
            $table->string('license_number')->nullable();
            $table->string('contact_number')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('patients');
    }
};
