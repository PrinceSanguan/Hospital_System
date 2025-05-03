<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Middleware\GuestMiddleware;


/*
|--------------------------------------------------------------------------
| This controller handles the homepage and other public-facing pages that don't require authentication
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\HomeController;
use App\Http\Controllers\LandingController;

// Replacing the home route with our new landing page
Route::get('/', [LandingController::class, 'index'])->name('home');
Route::get('/service/{service}', [LandingController::class, 'viewService'])->name('service.view');

/*
|--------------------------------------------------------------------------
| This controller handles Login Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Auth\LoginController;

Route::get('login', [LoginController::class, 'index'])->middleware(GuestMiddleware::class)->name('auth.login');
Route::post('login', [LoginController::class, 'store'])->name('auth.login.store');
Route::get('logout', [LoginController::class, 'destroy'])->name('auth.logout');

/*
|--------------------------------------------------------------------------
| This controller handles Google Auth Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Auth\SocialAuthController;

Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

/*
|--------------------------------------------------------------------------
| This controller handles Register Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Auth\RegisterController;

Route::get('register', [RegisterController::class, 'index'])->middleware(GuestMiddleware::class)->name('auth.register');
Route::post('register', [RegisterController::class, 'store'])->name('auth.register.store');

/*
|--------------------------------------------------------------------------
| This controller handles Authentication Redirection
|--------------------------------------------------------------------------
*/

use App\Models\User;
use Illuminate\Support\Facades\Auth;

// Route to redirect users to their appropriate dashboard after login
Route::get('/dashboard', function() {
    $user = Auth::user();

    if (!$user) {
        return redirect()->route('auth.login');
    }

    switch ($user->user_role) {
        case User::ROLE_ADMIN:
            return redirect()->route('admin.dashboard');
        case User::ROLE_DOCTOR:
            return redirect()->route('doctor.dashboard');
        case User::ROLE_CLINICAL_STAFF:
            return redirect()->route('staff.dashboard');
        case User::ROLE_PATIENT:
            return redirect()->route('patient.dashboard');
        default:
            return redirect()->route('home');
    }
})->name('dashboard');

/*
|--------------------------------------------------------------------------
| This controller handles All Admin Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\RecordsManagementController;
use App\Http\Controllers\Admin\ReportsController;
use App\Http\Middleware\AdminMiddleware;

Route::middleware([AdminMiddleware::class])->prefix('admin')->name('admin.')->group(function () {
  // Dashboard
  Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

  // Settings
  Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
  Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.updateProfile');
  Route::put('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.updatePassword');

  // User Management
  Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
  Route::get('/users/create', [UserManagementController::class, 'create'])->name('users.create');
  Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
  Route::get('/users/{user}/edit', [UserManagementController::class, 'edit'])->name('users.edit');
  Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
  Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');

  // Records Management
  Route::get('/records', [RecordsManagementController::class, 'index'])->name('records.index');
  Route::get('/records/create', [RecordsManagementController::class, 'create'])->name('records.create');
  Route::post('/records', [RecordsManagementController::class, 'store'])->name('records.store');
  Route::get('/records/{record}/edit', [RecordsManagementController::class, 'edit'])->name('records.edit');
  Route::put('/records/{id}', [RecordsManagementController::class, 'update'])->name('records.update');
  Route::delete('/records/{id}', [RecordsManagementController::class, 'destroy'])->name('records.destroy');
  Route::get('/records/{id}', [RecordsManagementController::class, 'show'])->name('records.show');

  // Reports
  Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
  Route::get('/reports/download', [ReportsController::class, 'downloadReport'])->name('reports.download');
});

/*
|--------------------------------------------------------------------------
| This controller handles All Doctor Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Doctor\DoctorDashboardController;
use App\Http\Controllers\Doctor\AppointmentController;
use App\Http\Controllers\Doctor\NotificationController;
use App\Http\Controllers\Doctor\PatientController;
use App\Http\Controllers\Doctor\RecordsController;
use App\Http\Controllers\Doctor\DoctorScheduleController;
use App\Http\Controllers\Doctor\ServiceController;
use App\Http\Middleware\DoctorMiddleware;

Route::middleware([DoctorMiddleware::class])->prefix('doctor')->name('doctor.')->group(function () {
  // Dashboard
  Route::get('/dashboard', [DoctorDashboardController::class, 'index'])->name('dashboard');

  // Doctor Profile
  Route::get('/profile', function() {
    return Inertia::render('Doctor/Profile', [
      'user' => Auth::user()
    ]);
  })->name('profile');

  // Schedule Management
  Route::get('/schedule', [DoctorScheduleController::class, 'index'])->name('schedule.index');
  Route::post('/schedule', [DoctorScheduleController::class, 'store'])->name('schedule.store');
  Route::post('/schedule/multiple', [DoctorScheduleController::class, 'storeMultiple'])->name('schedule.store.multiple');
  Route::put('/schedule/{id}', [DoctorScheduleController::class, 'update'])->name('schedule.update');
  Route::delete('/schedule/{id}', [DoctorScheduleController::class, 'destroy'])->name('schedule.destroy');

  // Services Management
  Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
  Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
  Route::put('/services/{id}', [ServiceController::class, 'update'])->name('services.update');
  Route::delete('/services/{id}', [ServiceController::class, 'destroy'])->name('services.destroy');

  // Patients Management
  Route::get('/patients', [PatientController::class, 'index'])->name('patients.index');
  Route::get('/patients/search', [PatientController::class, 'search'])->name('patients.search');
  Route::get('/patients/{id}', [PatientController::class, 'show'])->name('patients.show');
  Route::post('/patients', [PatientController::class, 'store'])->name('patients.store');
  Route::put('/patients/{id}', [PatientController::class, 'update'])->name('patients.update');
  Route::delete('/patients/{id}', [PatientController::class, 'destroy'])->name('patients.destroy');

  // Appointments Management
  Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
  Route::get('/appointments/create', [AppointmentController::class, 'create'])->name('appointments.create');
  Route::get('/appointments/calendar', [AppointmentController::class, 'calendar'])->name('appointments.calendar');
  Route::get('/appointments/{id}', [AppointmentController::class, 'show'])->name('appointments.show');
  Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
  Route::put('/appointments/{id}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.update.status');
  Route::post('/appointments/update-status', [AppointmentController::class, 'updateStatus'])->name('appointments.updateStatus');
  Route::get('/appointments/pending/count', [AppointmentController::class, 'getPendingAppointments'])->name('appointments.pending');

  // Records Management
  Route::get('/records', [RecordsController::class, 'index'])->name('records.index');
  Route::get('/records/create', [RecordsController::class, 'create'])->name('records.create');
  Route::get('/records/{id}', [RecordsController::class, 'show'])->name('records.show');
  Route::post('/records', [RecordsController::class, 'store'])->name('records.store');
  Route::put('/records/{id}', [RecordsController::class, 'update'])->name('records.update');
  Route::delete('/records/{id}', [RecordsController::class, 'destroy'])->name('records.destroy');
  Route::get('/patients/{patientId}/records', [RecordsController::class, 'getPatientRecords'])->name('patients.records');

  // Notifications Management
  Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
  Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark.read');
  Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark.all.read');
  Route::get('/notifications/unread/count', [NotificationController::class, 'getUnreadCount'])->name('notifications.unread.count');
  Route::get('/notifications/recent', [NotificationController::class, 'getRecent'])->name('notifications.recent');
});

/*
|--------------------------------------------------------------------------
| This controller handles All Clinical Staff Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\ClinicalStaff\StaffDashboardController;
use App\Http\Middleware\ClinicalStaffMiddleware;

Route::middleware([ClinicalStaffMiddleware::class])->prefix('staff')->name('staff.')->group(function () {
  // Dashboard
  Route::get('/dashboard', [StaffDashboardController::class, 'index'])->name('dashboard');

  // Profile
  Route::get('/profile', function() {
    return Inertia::render('ClinicalStaff/Profile', [
      'user' => Auth::user()
    ]);
  })->name('profile');

  // Appointments Management
  Route::get('/appointments', function() {
    return Inertia::render('ClinicalStaff/Appointments', [
      'user' => Auth::user()
    ]);
  })->name('appointments');

  // Appointment Actions
  Route::get('/appointments/add', function() {
    return Inertia::render('ClinicalStaff/AppointmentAdd', [
      'user' => Auth::user()
    ]);
  })->name('appointments.add');

  Route::get('/appointments/delete', function() {
    return Inertia::render('ClinicalStaff/AppointmentDelete', [
      'user' => Auth::user()
    ]);
  })->name('appointments.delete');

  Route::get('/appointments/view', function() {
    return Inertia::render('ClinicalStaff/AppointmentView', [
      'user' => Auth::user()
    ]);
  })->name('appointments.view');

  Route::get('/appointments/edit', function() {
    return Inertia::render('ClinicalStaff/AppointmentEdit', [
      'user' => Auth::user()
    ]);
  })->name('appointments.edit');

  Route::get('/appointments/approve', function() {
    return Inertia::render('ClinicalStaff/AppointmentApprove', [
      'user' => Auth::user()
    ]);
  })->name('appointments.approve');

  // Patient Records Management
  Route::get('/patients', function() {
    return Inertia::render('ClinicalStaff/Patients', [
      'user' => Auth::user()
    ]);
  })->name('patients');

  // Notifications
  Route::get('/notifications', function() {
    return Inertia::render('ClinicalStaff/Notifications', [
      'user' => Auth::user()
    ]);
  })->name('notifications');

  // Follow-ups
  Route::get('/followups', function() {
    return Inertia::render('ClinicalStaff/Followups', [
      'user' => Auth::user()
    ]);
  })->name('followups');

  // Clinical Information
  Route::get('/clinical-info', function() {
    return Inertia::render('ClinicalStaff/ClinicalInfo', [
      'user' => Auth::user()
    ]);
  })->name('clinical.info');

  // Lab Records
  Route::get('/lab-records', function() {
    return Inertia::render('ClinicalStaff/LabRecords', [
      'user' => Auth::user()
    ]);
  })->name('lab.records');

  // Lab Records Actions
  Route::get('/lab-records/add', function() {
    return Inertia::render('ClinicalStaff/LabRecordsAdd', [
      'user' => Auth::user()
    ]);
  })->name('lab.records.add');

  Route::get('/lab-records/delete', function() {
    return Inertia::render('ClinicalStaff/LabRecordsDelete', [
      'user' => Auth::user()
    ]);
  })->name('lab.records.delete');

  Route::get('/lab-records/view', function() {
    return Inertia::render('ClinicalStaff/LabRecordsView', [
      'user' => Auth::user()
    ]);
  })->name('lab.records.view');

  Route::get('/lab-records/edit', function() {
    return Inertia::render('ClinicalStaff/LabRecordsEdit', [
      'user' => Auth::user()
    ]);
  })->name('lab.records.edit');
});

/*
|--------------------------------------------------------------------------
| This controller handles All Patient Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Patient\PatientDashboardController;
use App\Http\Controllers\Patient\ProfileController;
use App\Http\Middleware\PatientMiddleware;

Route::middleware([PatientMiddleware::class])->prefix('patient')->name('patient.')->group(function () {
  // Dashboard
  Route::get('/dashboard', [PatientDashboardController::class, 'index'])->name('dashboard');

  // Appointments
  Route::post('/appointments', [PatientDashboardController::class, 'store'])->name('appointments.store');
  Route::get('/appointments', [PatientDashboardController::class, 'listAppointments'])->name('appointments.index');
  Route::get('/appointments/book', [PatientDashboardController::class, 'bookAppointment'])->name('appointments.book');
  Route::get('/appointments/{id}', [PatientDashboardController::class, 'viewAppointment'])->name('appointments.show');

  // Medical Records
  Route::get('/records', [PatientDashboardController::class, 'listRecords'])->name('records.index');
  Route::get('/records/lab-results', [PatientDashboardController::class, 'listLabResults'])->name('records.lab-results');
  Route::get('/records/{id}', [PatientDashboardController::class, 'viewRecord'])->name('records.show');

  // Doctors
  Route::get('/doctors', [PatientDashboardController::class, 'listDoctors'])->name('doctors.index');

  // Profile
  Route::get('/profile', [PatientDashboardController::class, 'viewProfile'])->name('profile.edit');
  Route::put('/profile', [PatientDashboardController::class, 'updateProfile'])->name('profile.update');

  // Use dedicated ProfileController for improved profile management
  Route::get('/my-profile', [ProfileController::class, 'index'])->name('my-profile.index');
  Route::get('/my-profile/edit', [ProfileController::class, 'edit'])->name('my-profile.edit');
  Route::put('/my-profile', [ProfileController::class, 'update'])->name('my-profile.update');
});

// Patient notification routes
Route::middleware(['auth', 'role:patient'])->prefix('patient')->name('patient.')->group(function () {
    Route::get('/notifications', [App\Http\Controllers\Patient\NotificationController::class, 'index'])->name('notifications.index');
    Route::put('/notifications/{id}/read', [App\Http\Controllers\Patient\NotificationController::class, 'markAsRead'])->name('notifications.mark.read');
    Route::put('/notifications/mark-all-read', [App\Http\Controllers\Patient\NotificationController::class, 'markAllAsRead'])->name('notifications.mark.all.read');
    Route::get('/notifications/unread-count', [App\Http\Controllers\Patient\NotificationController::class, 'getUnreadCount'])->name('notifications.unread.count');
    Route::get('/notifications/recent', [App\Http\Controllers\Patient\NotificationController::class, 'getRecent'])->name('notifications.recent');
});
