<?php

namespace Database\Seeders;

use App\Models\HospitalService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HospitalServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'name' => 'Pediatric Medical Check-up',
                'description' => 'Comprehensive medical examination for children, including growth and developmental assessment.',
                'category' => 'Check-up',
                'is_active' => true,
                'price' => 1500,
                'icon' => 'stethoscope'
            ],
            [
                'name' => 'Adult Medical Check-up',
                'description' => 'Complete health evaluation for adults, including vital signs assessment and specialized screenings.',
                'category' => 'Check-up',
                'is_active' => true,
                'price' => 2000,
                'icon' => 'stethoscope'
            ],
            [
                'name' => 'Maternal and Child Care',
                'description' => 'Specialized care for mothers and children, focusing on maternal health and child development.',
                'category' => 'Maternal',
                'is_active' => true,
                'price' => 1800,
                'icon' => 'heart'
            ],
            [
                'name' => 'Pre-Natal Check-up',
                'description' => 'Regular health check-ups during pregnancy to monitor mother and baby\'s health.',
                'category' => 'Maternal',
                'is_active' => true,
                'price' => 1200,
                'icon' => 'baby'
            ],
            [
                'name' => 'Post-Natal Check-up',
                'description' => 'Follow-up care for mothers after childbirth to ensure proper recovery and health maintenance.',
                'category' => 'Maternal',
                'is_active' => true,
                'price' => 1200,
                'icon' => 'baby'
            ],
            [
                'name' => 'Minor Surgery/Wound Suturing',
                'description' => 'Treatment for minor wounds requiring sutures or minor surgical procedures.',
                'category' => 'Surgery',
                'is_active' => true,
                'price' => 3000,
                'icon' => 'scissors'
            ],
            [
                'name' => 'Circumcision (Tuli)',
                'description' => 'Safe and professional circumcision services with proper care instructions.',
                'category' => 'Surgery',
                'is_active' => true,
                'price' => 3500,
                'icon' => 'scissors'
            ],
            [
                'name' => 'Pre-employment Check-up',
                'description' => 'Complete medical examination required for employment purposes including laboratory tests.',
                'category' => 'Check-up',
                'is_active' => true,
                'price' => 1500,
                'icon' => 'file-text'
            ],
            [
                'name' => 'Medical Certification',
                'description' => 'Official medical certificates for various purposes including fitness certificates.',
                'category' => 'Documentation',
                'is_active' => true,
                'price' => 500,
                'icon' => 'file-text'
            ],
            [
                'name' => 'Fit to Work Certification',
                'description' => 'Medical evaluation and certification of fitness for employment.',
                'category' => 'Documentation',
                'is_active' => true,
                'price' => 800,
                'icon' => 'file-text'
            ],
            [
                'name' => 'Diving Medical Certification',
                'description' => 'Specialized medical assessment and certification for scuba diving activities.',
                'category' => 'Documentation',
                'is_active' => true,
                'price' => 2500,
                'icon' => 'file-text'
            ],
            [
                'name' => 'Vaccination',
                'description' => 'Comprehensive vaccination services for all age groups following national immunization guidelines.',
                'category' => 'Preventive',
                'is_active' => true,
                'price' => 1000,
                'icon' => 'syringe'
            ],
            [
                'name' => 'Tetanus Injection',
                'description' => 'Tetanus toxoid vaccination for injury prevention or routine immunization.',
                'category' => 'Preventive',
                'is_active' => true,
                'price' => 800,
                'icon' => 'syringe'
            ],
            [
                'name' => 'Ear Piercing',
                'description' => 'Safe and sterile ear piercing services with proper aftercare instructions.',
                'category' => 'Minor Procedure',
                'is_active' => true,
                'price' => 500,
                'icon' => 'ear'
            ],
            [
                'name' => 'Ear Foreign Body Removal',
                'description' => 'Professional removal of foreign objects from the ear canal.',
                'category' => 'Minor Procedure',
                'is_active' => true,
                'price' => 800,
                'icon' => 'ear'
            ],
            [
                'name' => 'Ear Cleaning',
                'description' => 'Professional ear wax removal and cleaning services.',
                'category' => 'Minor Procedure',
                'is_active' => true,
                'price' => 600,
                'icon' => 'ear'
            ],
            [
                'name' => 'Counseling',
                'description' => 'Professional mental health counseling and support services.',
                'category' => 'Mental Health',
                'is_active' => true,
                'price' => 1500,
                'icon' => 'heart'
            ],
            [
                'name' => 'Home Service - Foley Bag Catheter Insertion',
                'description' => 'Professional insertion of urinary catheters in the comfort of your home.',
                'category' => 'Home Services',
                'is_active' => true,
                'price' => 2000,
                'icon' => 'home'
            ],
            [
                'name' => 'Home Service - NGT Insertion',
                'description' => 'Professional nasogastric tube insertion service provided at your residence.',
                'category' => 'Home Services',
                'is_active' => true,
                'price' => 2000,
                'icon' => 'home'
            ],
        ];

        foreach ($services as $service) {
            HospitalService::create($service);
        }
    }
}
