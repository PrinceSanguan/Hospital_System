<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class CreateNotificationsTable extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:notifications-table';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates the notifications table directly using Schema builder';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Attempting to create notifications table...');

        if (Schema::hasTable('notifications')) {
            $this->warn('The notifications table already exists.');
            return;
        }

        try {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('type');
                $table->string('title');
                $table->text('message');
                $table->json('data')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->unsignedBigInteger('related_id')->nullable();
                $table->string('related_type')->nullable();
                $table->timestamps();

                // Index for faster queries
                $table->index(['user_id', 'read_at']);
                $table->index(['related_id', 'related_type']);
            });

            $this->info('Notifications table created successfully!');
        } catch (\Exception $e) {
            $this->error('Failed to create notifications table: ' . $e->getMessage());
        }
    }
}
