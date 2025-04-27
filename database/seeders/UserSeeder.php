<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@farmcare.com',
            'password' => Hash::make('password'),
            'user_role' => User::ROLE_ADMIN,
        ]);

        // Create Doctor user
        User::factory()->create([
            'name' => 'Doctor User',
            'email' => 'doctor@farmcare.com',
            'password' => Hash::make('password'),
            'user_role' => User::ROLE_DOCTOR,
        ]);

        // Create Clinical Staff user
        User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@farmcare.com',
            'password' => Hash::make('password'),
            'user_role' => User::ROLE_CLINICAL_STAFF,
        ]);

        // Create Patient user
        User::factory()->create([
            'name' => 'Patient User',
            'email' => 'patient@farmcare.com',
            'password' => Hash::make('password'),
            'user_role' => User::ROLE_PATIENT,
        ]);

        // Create additional patient users
        User::factory()->count(5)->create([
            'user_role' => User::ROLE_PATIENT,
        ]);

        // Create additional doctors
        User::factory()->count(3)->create([
            'user_role' => User::ROLE_DOCTOR,
        ]);
    }
}
