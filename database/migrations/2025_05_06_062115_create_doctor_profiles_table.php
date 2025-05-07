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
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->string('phone_number')->nullable();
            $table->string('specialization')->nullable();
            $table->text('qualifications')->nullable();
            $table->text('address')->nullable();
            $table->text('about')->nullable();
            $table->integer('years_of_experience')->nullable();
            $table->string('languages_spoken')->nullable();
            $table->string('education')->nullable();
            $table->string('profile_image')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};
