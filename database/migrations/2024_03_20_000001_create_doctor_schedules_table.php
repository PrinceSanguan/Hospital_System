<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->onDelete('cascade');
            $table->date('schedule_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('max_patients')->default(20);
            $table->boolean('is_available')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Add indexes for better performance
            $table->index('schedule_date');
            $table->index(['doctor_id', 'schedule_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_schedules');
    }
};
