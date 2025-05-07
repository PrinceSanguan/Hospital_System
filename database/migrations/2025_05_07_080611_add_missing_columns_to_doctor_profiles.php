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
        Schema::table('doctor_profiles', function (Blueprint $table) {
            // Add all potentially missing columns
            if (!Schema::hasColumn('doctor_profiles', 'specialization')) {
                $table->string('specialization')->nullable()->after('phone_number');
            }

            if (!Schema::hasColumn('doctor_profiles', 'qualifications')) {
                $table->text('qualifications')->nullable()->after('specialization');
            }

            if (!Schema::hasColumn('doctor_profiles', 'address')) {
                $table->text('address')->nullable()->after('qualifications');
            }

            if (!Schema::hasColumn('doctor_profiles', 'about')) {
                $table->text('about')->nullable()->after('address');
            }

            if (!Schema::hasColumn('doctor_profiles', 'years_of_experience')) {
                $table->integer('years_of_experience')->nullable()->after('about');
            }

            if (!Schema::hasColumn('doctor_profiles', 'languages_spoken')) {
                $table->string('languages_spoken')->nullable()->after('years_of_experience');
            }

            if (!Schema::hasColumn('doctor_profiles', 'education')) {
                $table->string('education')->nullable()->after('languages_spoken');
            }

            if (!Schema::hasColumn('doctor_profiles', 'profile_image')) {
                $table->string('profile_image')->nullable()->after('education');
            }

            if (!Schema::hasColumn('doctor_profiles', 'is_visible')) {
                $table->boolean('is_visible')->default(true)->after('profile_image');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down migration as these are critical columns
    }
};
