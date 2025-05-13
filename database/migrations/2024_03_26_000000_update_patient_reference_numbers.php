<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;

return new class extends Migration
{
    public function up()
    {
        // Add reference_number column if it doesn't exist
        if (!Schema::hasColumn('patients', 'reference_number')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->string('reference_number')->unique()->after('id');
            });
        }

        // Handle different column names depending on the database driver
        $userRoleColumn = DB::getDriverName() === 'pgsql' ? '"user_role"' : 'user_role';

        // Get all users with patient role who don't have a patient record
        $patientUsers = DB::table('users');

        // Build query based on database driver
        if (DB::getDriverName() === 'pgsql') {
            $patientUsers = $patientUsers->whereRaw("{$userRoleColumn} = 'patient'");
        } else {
            $patientUsers = $patientUsers->where('user_role', 'patient');
        }

        $patientUsers = $patientUsers->whereNotExists(function ($query) {
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

        // Update any existing patient records that might be missing reference numbers
        $patientsWithoutRef = DB::table('patients')
            ->whereNull('reference_number')
            ->orWhere('reference_number', '')
            ->get();

        foreach ($patientsWithoutRef as $patient) {
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
