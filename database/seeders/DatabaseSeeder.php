<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin, doctors, and patients
        $this->createUsers();
    }

    /**
     * Create admin, doctors and patients
     */
    private function createUsers(): void
    {
        // Create Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@farmcare.com'],
            [
                'name' => 'Admin User',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_ADMIN
            ]
        );
        $this->command->info('Admin user created or already exists.');

        // Create Doctor 1: Dr. Rogelia Bantayanon-Tubog
        $doctor1 = User::firstOrCreate(
            ['email' => 'dr.tubog@farmcare.com'],
            [
                'name' => 'Dr. Rogelia Bantayanon-Tubog',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_DOCTOR
            ]
        );

        Doctor::firstOrCreate(
            ['user_id' => $doctor1->id],
            [
                'name' => 'Dr. Rogelia Bantayanon-Tubog',
                'specialization' => 'Occupational Health Physician, BCOM',
                'license_number' => 'DRCM' . mt_rand(10000, 99999),
                'contact_number' => '+63' . mt_rand(9000000000, 9999999999)
            ]
        );
        $this->command->info('Doctor Dr. Rogelia Bantayanon-Tubog created or already exists.');

        // Create Doctor 2: Dr. Blas Bandian
        $doctor2 = User::firstOrCreate(
            ['email' => 'dr.bandian@farmcare.com'],
            [
                'name' => 'Dr. Blas Bandian',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_DOCTOR
            ]
        );

        Doctor::firstOrCreate(
            ['user_id' => $doctor2->id],
            [
                'name' => 'Dr. Blas Bandian',
                'specialization' => 'Diplomate, Family Medicine',
                'license_number' => 'DRCM' . mt_rand(10000, 99999),
                'contact_number' => '+63' . mt_rand(9000000000, 9999999999)
            ]
        );
        $this->command->info('Doctor Dr. Blas Bandian created or already exists.');

        // Create Doctor 3: Dr. Kathy Narvaez-De Gracia
        $doctor3 = User::firstOrCreate(
            ['email' => 'dr.degracia@farmcare.com'],
            [
                'name' => 'Dr. Kathy Narvaez-De Gracia',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_DOCTOR
            ]
        );

        Doctor::firstOrCreate(
            ['user_id' => $doctor3->id],
            [
                'name' => 'Dr. Kathy Narvaez-De Gracia',
                'specialization' => 'General Practitioner',
                'license_number' => 'DRCM' . mt_rand(10000, 99999),
                'contact_number' => '+63' . mt_rand(9000000000, 9999999999)
            ]
        );
        $this->command->info('Doctor Dr. Kathy Narvaez-De Gracia created or already exists.');

        // Create Clinical Staff
        $staff1 = User::firstOrCreate(
            ['email' => 'staff1@farmcare.com'],
            [
                'name' => 'Maria Santos',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_CLINICAL_STAFF
            ]
        );
        $this->command->info('Clinical Staff Maria Santos created or already exists.');

        $staff2 = User::firstOrCreate(
            ['email' => 'staff2@farmcare.com'],
            [
                'name' => 'Juan Dela Cruz',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_CLINICAL_STAFF
            ]
        );
        $this->command->info('Clinical Staff Juan Dela Cruz created or already exists.');

        // Create a Patient
        $patient = User::firstOrCreate(
            ['email' => 'patient@example.com'],
            [
                'name' => 'John Doe',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'user_role' => User::ROLE_PATIENT
            ]
        );

        Patient::firstOrCreate(
            ['user_id' => $patient->id],
            [
                'name' => 'John Doe',
                'reference_number' => 'PAT-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'date_of_birth' => '1990-01-01',
                'gender' => 'Male',
                'contact_number' => '+63' . mt_rand(9000000000, 9999999999),
                'address' => 'Manila, Philippines'
            ]
        );
        $this->command->info('Patient John Doe created or already exists.');
    }
}
