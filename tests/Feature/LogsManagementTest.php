<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LogsManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_logs_page()
    {
        // Create an admin user
        $admin = User::factory()->create([
            'user_role' => 'admin',
            'email' => 'admin@test.com'
        ]);

        // Act as admin
        $response = $this->actingAs($admin)
                         ->get(route('admin.logs'));

        // Assert successful response and correct view
        $response->assertStatus(200)
                 ->assertInertia(fn ($assert) => $assert->component('Admin/Logs'));
    }

    public function test_non_admin_cannot_access_logs_page()
    {
        // Create a non-admin user (doctor)
        $user = User::factory()->create([
            'user_role' => 'doctor',
            'email' => 'doctor@test.com'
        ]);

        // Act as non-admin user
        $response = $this->actingAs($user)
                         ->get(route('admin.logs'));

        // Assert redirect (access denied)
        $response->assertStatus(302);
    }

    public function test_login_event_is_logged()
    {
        // Create a user
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password')
        ]);

        // Clear log files before test
        if (file_exists(storage_path('logs/laravel.log'))) {
            unlink(storage_path('logs/laravel.log'));
        }

        // Simulate login
        $response = $this->post(route('login'), [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);

        // Check if log file exists and contains login record
        $this->assertFileExists(storage_path('logs/laravel.log'));
        $logContent = file_get_contents(storage_path('logs/laravel.log'));
        
        // This is a basic check - actual implementation might check for specific format
        $this->assertStringContainsString('User login', $logContent);
        $this->assertStringContainsString('test@example.com', $logContent);
    }

    public function test_log_file_download()
    {
        // Create an admin user
        $admin = User::factory()->create([
            'user_role' => 'admin',
            'email' => 'admin@test.com'
        ]);

        // Create a test log file
        file_put_contents(
            storage_path('logs/test-log.log'),
            '[' . date('Y-m-d H:i:s') . '] test.INFO: Test log entry'
        );

        // Act as admin
        $response = $this->actingAs($admin)
                         ->get(route('admin.logs.download', 'test-log.log'));

        // Assert successful download response
        $response->assertStatus(200)
                 ->assertHeader('content-type', 'text/plain; charset=UTF-8')
                 ->assertHeader('content-description', 'File Transfer');

        // Clean up
        if (file_exists(storage_path('logs/test-log.log'))) {
            unlink(storage_path('logs/test-log.log'));
        }
    }

    public function test_log_file_deletion()
    {
        // Create an admin user
        $admin = User::factory()->create([
            'user_role' => 'admin',
            'email' => 'admin@test.com'
        ]);

        // Create a test log file
        file_put_contents(
            storage_path('logs/test-deletion.log'),
            '[' . date('Y-m-d H:i:s') . '] test.INFO: Test log entry'
        );

        // Verify file exists
        $this->assertFileExists(storage_path('logs/test-deletion.log'));

        // Act as admin and delete file
        $response = $this->actingAs($admin)
                         ->delete(route('admin.logs.destroy', 'test-deletion.log'));

        // Assert redirect with success message
        $response->assertStatus(302)
                 ->assertSessionHas('success');

        // Assert file no longer exists
        $this->assertFileDoesNotExist(storage_path('logs/test-deletion.log'));
    }
}
