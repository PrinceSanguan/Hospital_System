<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStaffSchedulesTable extends Migration
{
    public function up()
    {
        Schema::create('staff_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('users')->onDelete('cascade');
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->unsignedInteger('max_appointments');
            $table->string('notes')->nullable();
            $table->date('specific_date')->nullable();
            $table->timestamps();
            
            $table->index(['staff_id', 'day_of_week', 'specific_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff_schedules');
    }
}
