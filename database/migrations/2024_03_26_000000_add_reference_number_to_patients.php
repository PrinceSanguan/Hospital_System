<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // First check if the column doesn't exist to avoid errors
        if (!Schema::hasColumn('patients', 'reference_number')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->string('reference_number')->unique()->after('id');
            });
        }

        // Get all patients without reference numbers
        $patients = DB::table('patients')
            ->whereNull('reference_number')
            ->orWhere('reference_number', '')
            ->get();

        // Update each patient with a new reference number
        foreach ($patients as $patient) {
            $latestPatient = DB::table('patients')->latest('id')->first();
            $nextId = $latestPatient ? $latestPatient->id + 1 : 1;
            $referenceNumber = 'PAT' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

            DB::table('patients')
                ->where('id', $patient->id)
                ->update([
                    'reference_number' => $referenceNumber,
                    'updated_at' => now(),
                ]);
        }

        // Skip this section in PostgreSQL since it seems to have column naming issues
        if (DB::getDriverName() !== 'pgsql') {
            // Get all users with patient role who don't have a patient record
            $patientUsers = DB::table('users')
                ->where('user_role', 'patient')
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('patients')
                        ->whereRaw('patients.user_id = users.id');
                })
                ->get();

            // Create patient records for users who don't have them
            foreach ($patientUsers as $user) {
                $latestPatient = DB::table('patients')->latest('id')->first();
                $nextId = $latestPatient ? $latestPatient->id + 1 : 1;
                $referenceNumber = 'PAT' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

                DB::table('patients')->insert([
                    'user_id' => $user->id,
                    'reference_number' => $referenceNumber,
                    'name' => $user->name,
                    'date_of_birth' => null,
                    'gender' => null,
                    'contact_number' => null,
                    'address' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down()
    {
        if (Schema::hasColumn('patients', 'reference_number')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->dropColumn('reference_number');
            });
        }
    }
};
