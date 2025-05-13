<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\DoctorProfile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class DoctorProfileImagesSeeder extends Seeder
{
    /**
     * Run the database seeds to add profile images to doctors.
     */
    public function run(): void
    {
        $this->command->info('Adding doctor profile images...');

        // Doctor email to image mapping
        $doctorImages = [
            'dr.tubog@farmcare.com' => 'images/doctor/Rogelia.png',
            'dr.bandian@farmcare.com' => 'images/doctor/Blas.png',
            'dr.degracia@farmcare.com' => 'images/doctor/Kathy.png',
        ];

        foreach ($doctorImages as $email => $imagePath) {
            $user = User::where('email', $email)->first();

            if (!$user) {
                $this->command->warn("Doctor with email {$email} not found.");
                continue;
            }

            // Check if the file exists
            if (!File::exists(public_path($imagePath))) {
                $this->command->error("Image file {$imagePath} not found in public directory.");
                continue;
            }

            // Get or create doctor profile
            $profile = DoctorProfile::firstOrNew(['doctor_id' => $user->id]);

            // Update profile image
            $profile->profile_image = $imagePath;

            // Set default values for required fields if this is a new profile
            if (!$profile->exists) {
                $profile->phone_number = '';
                $profile->is_visible = true;
            }

            $profile->save();

            $this->command->info("Updated profile image for {$user->name} to {$imagePath}");
        }

        $this->command->info('Doctor profile images updated successfully.');
    }
}
