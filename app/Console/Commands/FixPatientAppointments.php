<?php

namespace App\Console\Commands;

use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FixPatientAppointments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-patient-appointments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix patient appointments without assigned doctors';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to fix patient appointments without assigned doctors...');

        // Find all appointments without assigned doctors
        $appointmentsWithoutDoctors = PatientRecord::whereNull('assigned_doctor_id')
            ->orWhere('assigned_doctor_id', 0)
            ->get();

        $this->info("Found {$appointmentsWithoutDoctors->count()} appointments without assigned doctors.");

        if ($appointmentsWithoutDoctors->count() === 0) {
            $this->info('No appointments need fixing. Exiting.');
            return 0;
        }

        // Get a doctor to assign to these appointments
        $doctor = User::where('user_role', 'doctor')->first();

        if (!$doctor) {
            $this->error('No doctors found in the system. Cannot fix appointments.');
            return 1;
        }

        $this->info("Using doctor ID #{$doctor->id} ({$doctor->name}) for assignment.");

        // Begin transaction for database consistency
        DB::beginTransaction();

        try {
            $fixedCount = 0;

            foreach ($appointmentsWithoutDoctors as $appointment) {
                $appointment->assigned_doctor_id = $doctor->id;
                $appointment->save();
                $fixedCount++;

                // Give visual feedback for large operations
                if ($fixedCount % 10 === 0) {
                    $this->output->write('.');
                }
            }

            DB::commit();
            $this->newLine();
            $this->info("Successfully fixed {$fixedCount} appointments.");

            // Log for audit purposes
            Log::info("Fixed {$fixedCount} appointments without assigned doctors. Assigned to doctor ID #{$doctor->id}");

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Error occurred: {$e->getMessage()}");
            Log::error("Error fixing appointments: {$e->getMessage()}", [
                'trace' => $e->getTraceAsString()
            ]);

            return 1;
        }
    }
}
