<?php

namespace Database\Seeders;

use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PatientRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users for the records
        $patients = User::where('user_role', User::ROLE_PATIENT)->get();
        $doctors = User::where('user_role', User::ROLE_DOCTOR)->get();

        if ($patients->isEmpty() || $doctors->isEmpty()) {
            $this->command->info('No patients or doctors found. Make sure to run the UserSeeder first.');
            return;
        }

        // Create a few medical checkup records
        foreach ($patients as $patient) {
            // Create a medical checkup record
            PatientRecord::create([
                'patient_id' => $patient->id,
                'assigned_doctor_id' => $doctors->random()->id,
                'record_type' => PatientRecord::TYPE_MEDICAL_CHECKUP,
                'status' => PatientRecord::STATUS_COMPLETED,
                'appointment_date' => Carbon::now()->subDays(rand(1, 30)),
                'details' => 'Regular medical checkup for patient ' . $patient->name,
                'vital_signs' => [
                    'Blood Pressure' => [
                        'value' => rand(110, 140) . '/' . rand(70, 90),
                        'unit' => 'mmHg',
                        'range' => '90-120/60-80',
                        'status' => rand(0, 1) ? 'normal' : 'abnormal'
                    ],
                    'Heart Rate' => [
                        'value' => rand(60, 100),
                        'unit' => 'bpm',
                        'range' => '60-100',
                        'status' => 'normal'
                    ],
                    'Temperature' => [
                        'value' => rand(365, 375) / 10,
                        'unit' => '°C',
                        'range' => '36.5-37.5',
                        'status' => 'normal'
                    ]
                ]
            ]);

            // Create a laboratory record
            PatientRecord::create([
                'patient_id' => $patient->id,
                'assigned_doctor_id' => $doctors->random()->id,
                'record_type' => PatientRecord::TYPE_LABORATORY,
                'status' => PatientRecord::STATUS_COMPLETED,
                'appointment_date' => Carbon::now()->subDays(rand(1, 15)),
                'details' => 'Laboratory tests for patient ' . $patient->name,
                'lab_results' => [
                    'Blood Test' => [
                        'value' => rand(85, 115) . ' mg/dL',
                        'range' => '70-100 mg/dL',
                        'status' => rand(0, 4) > 0 ? 'normal' : 'abnormal',
                    ],
                    'Cholesterol' => [
                        'value' => rand(180, 240) . ' mg/dL',
                        'range' => '<200 mg/dL',
                        'status' => rand(0, 1) ? 'normal' : 'abnormal',
                    ]
                ]
            ]);

            // Create a medical record with the new format
            PatientRecord::create([
                'patient_id' => $patient->id,
                'assigned_doctor_id' => $doctors->random()->id,
                'record_type' => PatientRecord::TYPE_MEDICAL_RECORD,
                'status' => PatientRecord::STATUS_COMPLETED,
                'appointment_date' => Carbon::now()->subDays(rand(1, 10)),
                'details' => 'Complete medical record for patient ' . $patient->name,
                'lab_results' => [
                    'CBC (Complete Blood Count)' => [
                        'value' => 'Within normal range',
                        'range' => 'Normal',
                        'status' => 'normal',
                        'is_checked' => true,
                        'result' => "RBC: 4.5-5.5 million/µL\nWBC: 4,500-11,000/µL\nHemoglobin: 13.5-17.5 g/dL\nHematocrit: 41-50%\nPlatelets: 150,000-450,000/µL",
                        'remarks' => 'All values normal, no abnormalities detected'
                    ],
                    'Lipid Panel' => [
                        'value' => 'See detailed results',
                        'range' => 'Varies',
                        'status' => 'abnormal',
                        'is_checked' => true,
                        'result' => "Total Cholesterol: 210 mg/dL (High)\nLDL: 140 mg/dL (High)\nHDL: 45 mg/dL (Normal)\nTriglycerides: 180 mg/dL (Borderline High)",
                        'remarks' => 'Patient should consider dietary changes to lower cholesterol levels'
                    ],
                    'Urinalysis' => [
                        'value' => 'Normal',
                        'range' => 'Normal',
                        'status' => 'normal',
                        'is_checked' => false,
                        'result' => '',
                        'remarks' => ''
                    ]
                ],
                'vital_signs' => [
                    'Blood Pressure' => [
                        'value' => '120/80',
                        'unit' => 'mmHg',
                        'range' => '90-120/60-80',
                        'status' => 'normal'
                    ],
                    'Heart Rate' => [
                        'value' => '72',
                        'unit' => 'bpm',
                        'range' => '60-100',
                        'status' => 'normal'
                    ]
                ],
                'prescriptions' => [
                    [
                        'medication' => 'Atorvastatin',
                        'dosage' => '10mg',
                        'frequency' => 'Once daily',
                        'duration' => '3 months',
                        'instructions' => 'Take at bedtime'
                    ],
                    [
                        'medication' => 'Multivitamin',
                        'dosage' => '1 tablet',
                        'frequency' => 'Once daily',
                        'duration' => 'Ongoing',
                        'instructions' => 'Take with breakfast'
                    ]
                ]
            ]);

            // Create a pending medical record
            PatientRecord::create([
                'patient_id' => $patient->id,
                'assigned_doctor_id' => $doctors->random()->id,
                'record_type' => PatientRecord::TYPE_MEDICAL_RECORD,
                'status' => PatientRecord::STATUS_PENDING,
                'appointment_date' => Carbon::now()->addDays(rand(1, 14)),
                'details' => 'Upcoming appointment for ' . $patient->name,
                'lab_results' => [],
                'vital_signs' => [],
                'prescriptions' => []
            ]);
        }
    }
}
