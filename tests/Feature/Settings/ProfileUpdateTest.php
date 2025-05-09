<?php
namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_profile_page_is_displayed()
    {
        $user = User::factory()->create();
        $response = $this
            ->actingAs($user)
            ->get('/settings/profile');
        $response->assertOk();
    }

    public function test_doctor_profile_page_is_displayed()
    {
        $user = User::factory()->create([
            'user_role' => 'doctor',
        ]);
        
        $response = $this
            ->actingAs($user)
            ->get('/doctor/profile');
            
        $response->assertOk();
    }

    public function test_profile_information_can_be_updated()
    {
        $user = User::factory()->create();
        $response = $this
            ->actingAs($user)
            ->patch('/settings/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');
        
        $user->refresh();
        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_doctor_profile_information_can_be_updated()
    {
        Storage::fake('public');
        
        $user = User::factory()->create([
            'user_role' => 'doctor',
        ]);
        
        $profileImage = UploadedFile::fake()->image('profile.jpg');
        
        $response = $this
            ->actingAs($user)
            ->post('/doctor/profile', [
                '_method' => 'PUT',
                'name' => 'Dr. John Smith',
                'phone_number' => '123-456-7890',
                'specialty' => 'Cardiology',
                'qualifications' => 'Board Certified in Cardiology',
                'address' => '123 Medical Plaza, Suite 100',
                'about' => 'Experienced cardiologist with 10 years of practice',
                'years_of_experience' => 10,
                'languages_spoken' => 'English, Spanish',
                'education' => 'Harvard Medical School',
                'is_visible' => '1',
                'profile_image' => $profileImage,
            ]);
        
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        
        $user->refresh();
        
        $this->assertSame('Dr. John Smith', $user->name);
        $this->assertSame('123-456-7890', $user->phone_number);
        $this->assertSame('Cardiology', $user->specialty);
        $this->assertSame('Board Certified in Cardiology', $user->qualifications);
        $this->assertSame('123 Medical Plaza, Suite 100', $user->address);
        $this->assertSame('Experienced cardiologist with 10 years of practice', $user->about);
        $this->assertSame(10, $user->years_of_experience);
        $this->assertSame('English, Spanish', $user->languages_spoken);
        $this->assertSame('Harvard Medical School', $user->education);
        $this->assertTrue((bool)$user->is_visible);
        $this->assertNotNull($user->profile_image);
        
        // Verify the image was stored
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $user->profile_image));
    }

    public function test_doctor_profile_can_update_specialty_only()
    {
        $user = User::factory()->create([
            'user_role' => 'doctor',
            'specialty' => 'General Medicine',
        ]);
        
        $response = $this
            ->actingAs($user)
            ->post('/doctor/profile', [
                '_method' => 'PUT',
                'name' => $user->name,
                'specialty' => 'Neurology',
                'phone_number' => $user->phone_number ?? '',
                'qualifications' => $user->qualifications ?? '',
                'address' => $user->address ?? '',
                'about' => $user->about ?? '',
                'years_of_experience' => $user->years_of_experience ?? 0,
                'languages_spoken' => $user->languages_spoken ?? '',
                'education' => $user->education ?? '',
                'is_visible' => $user->is_visible ? '1' : '0',
            ]);
        
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        
        $user->refresh();
        $this->assertSame('Neurology', $user->specialty);
    }

    public function test_doctor_visibility_can_be_toggled()
    {
        $user = User::factory()->create([
            'user_role' => 'doctor',
            'is_visible' => true,
        ]);
        
        $response = $this
            ->actingAs($user)
            ->post('/doctor/profile', [
                '_method' => 'PUT',
                'name' => $user->name,
                'specialty' => $user->specialty ?? '',
                'phone_number' => $user->phone_number ?? '',
                'qualifications' => $user->qualifications ?? '',
                'address' => $user->address ?? '',
                'about' => $user->about ?? '',
                'years_of_experience' => $user->years_of_experience ?? 0,
                'languages_spoken' => $user->languages_spoken ?? '',
                'education' => $user->education ?? '',
                'is_visible' => '0',
            ]);
        
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        
        $user->refresh();
        $this->assertFalse((bool)$user->is_visible);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged()
    {
        $user = User::factory()->create();
        $response = $this
            ->actingAs($user)
            ->patch('/settings/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);
        
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/settings/profile');
        
        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account()
    {
        $user = User::factory()->create();
        $response = $this
            ->actingAs($user)
            ->delete('/settings/profile', [
                'password' => 'password',
            ]);
        
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');
        
        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account()
    {
        $user = User::factory()->create();
        $response = $this
            ->actingAs($user)
            ->from('/settings/profile')
            ->delete('/settings/profile', [
                'password' => 'wrong-password',
            ]);
        
        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/settings/profile');
        
        $this->assertNotNull($user->fresh());
    }
}
