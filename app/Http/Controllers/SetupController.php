<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;

class SetupController extends Controller
{
    /**
     * Create the notifications table.
     */
    public function createNotificationsTable()
    {
        if (Schema::hasTable('notifications')) {
            return response()->json([
                'message' => 'The notifications table already exists.',
                'success' => false
            ]);
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

            return response()->json([
                'message' => 'Notifications table created successfully!',
                'success' => true
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create notifications table: ' . $e->getMessage(),
                'success' => false
            ]);
        }
    }
}
