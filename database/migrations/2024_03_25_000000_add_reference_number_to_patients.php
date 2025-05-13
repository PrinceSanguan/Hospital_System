<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('reference_number')->unique()->after('id');
        });

        // Generate reference numbers for existing patients
        DB::table('patients')->orderBy('id')->each(function ($patient) {
            DB::table('patients')
                ->where('id', $patient->id)
                ->update(['reference_number' => 'PAT' . str_pad($patient->id, 6, '0', STR_PAD_LEFT)]);
        });
    }

    public function down()
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('reference_number');
        });
    }
};
