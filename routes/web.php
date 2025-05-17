<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use App\Http\Middleware\GuestMiddleware;
use App\Models\Patient;


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
Route::get('/api/services', [App\Http\Controllers\HospitalServiceController::class, 'getActiveServices'])->name('api.services');

/*
|--------------------------------------------------------------------------
| This controller handles Login Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Auth\LoginController;

Route::get('login', [LoginController::class, 'index'])->middleware(GuestMiddleware::class)->name('auth.login');
Route::post('login', [LoginController::class, 'store'])->name('auth.login.store');
Route::post('logout', [LoginController::class, 'destroy'])->name('auth.logout');

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
Route::get('/dashboard', function () {
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

  // Hospital Services Management
  Route::get('/services', [App\Http\Controllers\HospitalServiceController::class, 'index'])->name('services.index');
  Route::get('/services/create', [App\Http\Controllers\HospitalServiceController::class, 'create'])->name('services.create');
  Route::post('/services', [App\Http\Controllers\HospitalServiceController::class, 'store'])->name('services.store');
  Route::get('/services/{service}/edit', [App\Http\Controllers\HospitalServiceController::class, 'edit'])->name('services.edit');
  Route::put('/services/{service}', [App\Http\Controllers\HospitalServiceController::class, 'update'])->name('services.update');
  Route::delete('/services/{service}', [App\Http\Controllers\HospitalServiceController::class, 'destroy'])->name('services.destroy');

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
use App\Http\Controllers\Doctor\ServiceController;
use App\Http\Controllers\Doctor\DoctorScheduleController;
use App\Http\Middleware\DoctorMiddleware;

Route::middleware([DoctorMiddleware::class])->prefix('doctor')->name('doctor.')->group(function () {
  // Dashboard
  Route::get('/dashboard', [DoctorDashboardController::class, 'index'])->name('dashboard');

  // Doctor Profile
  Route::get('/profile', [App\Http\Controllers\DoctorProfileController::class, 'edit'])->name('profile');
  Route::put('/profile', [App\Http\Controllers\DoctorProfileController::class, 'update'])->name('profile.update');

  // Doctor Settings
  Route::get('/settings', [App\Http\Controllers\DoctorProfileController::class, 'settings'])->name('settings');

  // Doctor Services Management
  Route::get('/services/manage', [App\Http\Controllers\DoctorServiceController::class, 'index'])->name('services.manage');
  Route::get('/services/create', [App\Http\Controllers\DoctorServiceController::class, 'create'])->name('services.create');
  Route::post('/services/store', [App\Http\Controllers\DoctorServiceController::class, 'store'])->name('services.store');
  Route::get('/services/{id}/edit', [App\Http\Controllers\DoctorServiceController::class, 'edit'])->name('services.edit');
  Route::put('/services/{id}', [App\Http\Controllers\DoctorServiceController::class, 'update'])->name('services.update');
  Route::delete('/services/{id}', [App\Http\Controllers\DoctorServiceController::class, 'destroy'])->name('services.destroy');

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
  Route::get('/records/{id}/edit', [RecordsController::class, 'edit'])->name('records.edit');
  Route::get('/records/{id}', [RecordsController::class, 'show'])->name('records.show');
  Route::post('/records', [RecordsController::class, 'store'])->name('records.store');
  Route::put('/records/{id}', [RecordsController::class, 'update'])->name('records.update');
  Route::delete('/records/{id}', [RecordsController::class, 'destroy'])->name('records.destroy');
  Route::get('/records/{id}/print', [RecordsController::class, 'printRecord'])->name('records.print');
  Route::get('/records/{id}/print-prescriptions', [RecordsController::class, 'printPrescriptions'])->name('records.print-prescriptions');
  Route::get('/records/patient/{patientId}', [RecordsController::class, 'getPatientRecords'])->name('patient.records');

  // Notifications Management
  Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
  Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark.read');
  Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark.all.read');
  Route::get('/notifications/unread/count', [NotificationController::class, 'getUnreadCount'])->name('notifications.unread.count');
  Route::get('/notifications/recent', [NotificationController::class, 'getRecent'])->name('notifications.recent');
  Route::post('/notifications/mark-appointment-notifications-read', [NotificationController::class, 'markAllAppointmentNotificationsAsRead'])->name('notifications.mark.appointment.read');


  // Schedule management routes
  Route::get('/schedule', [DoctorScheduleController::class, 'index'])->name('schedule.index');
  Route::post('/schedule', [DoctorScheduleController::class, 'store'])->name('schedule.store');
  Route::put('/schedule/{id}', [DoctorScheduleController::class, 'update'])->name('schedule.update');
  Route::delete('/schedule/{id}', [DoctorScheduleController::class, 'destroy'])->name('schedule.destroy');
  Route::post('/schedule/multiple', [DoctorScheduleController::class, 'storeMultiple'])->name('schedule.store-multiple');
  Route::get('/schedule/staff/{staffId}', [DoctorScheduleController::class, 'viewStaffSchedule'])->name('schedule.view-staff');
});

/*
|--------------------------------------------------------------------------
| This controller handles All Clinical Staff Logic
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\ClinicalStaff\StaffDashboardController;
use App\Http\Controllers\ClinicalStaff\LabRecordsController;
use App\Http\Controllers\ClinicalStaff\MedicalRecordsController;
use App\Http\Controllers\ClinicalStaff\RecordRequestsController;
use App\Http\Middleware\ClinicalStaffMiddleware;
use App\Http\Controllers\ClinicalStaff\ScheduleController;
use App\Http\Controllers\ClinicalStaff\LabResultsController;
use App\Http\Controllers\ClinicalStaff\ReceiptsController;
use App\Http\Controllers\ClinicalStaff\AppointmentsController;

Route::middleware([ClinicalStaffMiddleware::class])->prefix('staff')->name('staff.')->group(function () {
  // Dashboard
  Route::get('/dashboard', [StaffDashboardController::class, 'index'])->name('dashboard');

  // Profile
  Route::get('/profile', function () {
    return Inertia::render('ClinicalStaff/Profile', [
      'user' => Auth::user()
    ]);
  })->name('profile');

  // Medical Records Management
  Route::get('/clinical-info', [MedicalRecordsController::class, 'index'])->name('clinical.info');
  Route::get('/clinical-info/create', [MedicalRecordsController::class, 'create'])->name('clinical.info.create');
  Route::post('/clinical-info', [MedicalRecordsController::class, 'store'])->name('clinical.info.store');
  Route::get('/clinical-info/{id}', [MedicalRecordsController::class, 'show'])->name('clinical.info.show');
  Route::get('/clinical-info/{id}/edit', [MedicalRecordsController::class, 'edit'])->name('clinical.info.edit');
  Route::put('/clinical-info/{id}', [MedicalRecordsController::class, 'update'])->name('clinical.info.update');
  Route::delete('/clinical-info/{id}', [MedicalRecordsController::class, 'destroy'])->name('clinical.info.destroy');
  Route::get('/patients/{patientId}/history', [MedicalRecordsController::class, 'patientHistory'])->name('patients.history');

  // Prescription Management
  Route::get('/prescriptions/record/{recordId}', [MedicalRecordsController::class, 'getPrescriptions'])->name('prescriptions.record');
  Route::get('/prescriptions/{id}/download', [MedicalRecordsController::class, 'downloadPrescription'])->name('prescriptions.download');

  // Lab Records Management
  Route::get('/lab-records', [LabRecordsController::class, 'index'])->name('lab.records');
  Route::get('/lab-records/create', [LabRecordsController::class, 'create'])->name('lab.records.create');
  Route::post('/lab-records', [LabRecordsController::class, 'store'])->name('lab.records.store');
  Route::get('/lab-records/{id}', [LabRecordsController::class, 'show'])->name('lab.records.show');
  Route::get('/lab-records/{id}/edit', [LabRecordsController::class, 'edit'])->name('lab.records.edit');
  Route::put('/lab-records/{id}', [LabRecordsController::class, 'update'])->name('lab.records.update');
  Route::put('/lab-records/{id}/results', [LabRecordsController::class, 'updateResults'])->name('lab.records.results');
  Route::delete('/lab-records/{id}', [LabRecordsController::class, 'destroy'])->name('lab.records.destroy');
  Route::get('/lab-records/pending/list', [LabRecordsController::class, 'pending'])->name('lab.records.pending');
  Route::get('/lab-records/{id}/download', [LabRecordsController::class, 'downloadResults'])->name('lab.records.download');

  // Appointments Management
  Route::get('/appointments', [AppointmentsController::class, 'index'])->name('appointments.index');
  Route::get('/appointments/{id}', [AppointmentsController::class, 'show'])->name('appointments.show');
  Route::get('/appointments/{id}/edit', [AppointmentsController::class, 'edit'])->name('appointments.edit');
  Route::put('/appointments/{id}', [AppointmentsController::class, 'update'])->name('appointments.update');
  Route::match(['put', 'post'], '/appointments/{id}/status', [AppointmentsController::class, 'updateStatus'])->name('appointments.status');
  Route::get('/appointments/{id}/pdf', [AppointmentsController::class, 'generatePdf'])->name('appointments.pdf');
  Route::get('/appointments/{id}/receipt', [AppointmentsController::class, 'createReceipt'])->name('appointments.receipt');
  Route::get('/appointments/{id}/lab-results', [AppointmentsController::class, 'getLabResults'])->name('appointments.lab-results');

  // Patient Records Management
  Route::get('/patients', function () {
    return Inertia::render('ClinicalStaff/Patients', [
      'user' => Auth::user()
    ]);
  })->name('patients');

  // Notifications
  Route::get('/notifications', function () {
    return Inertia::render('ClinicalStaff/Notifications', [
      'user' => Auth::user()
    ]);
  })->name('notifications');

  // Follow-ups
  Route::get('/followups', function () {
    return Inertia::render('ClinicalStaff/Followups', [
      'user' => Auth::user()
    ]);
  })->name('followups');

  // Record Request Management
  Route::get('/record-requests', [RecordRequestsController::class, 'index'])->name('record-requests.index');
  Route::get('/record-requests/pending', [RecordRequestsController::class, 'pendingRequests'])->name('record-requests.pending');
  Route::get('/record-requests/medical', [RecordRequestsController::class, 'medicalRequests'])->name('record-requests.medical');
  Route::get('/record-requests/lab', [RecordRequestsController::class, 'labRequests'])->name('record-requests.lab');
  Route::get('/record-requests/{id}', [RecordRequestsController::class, 'show'])->name('record-requests.show');
  Route::post('/record-requests/{id}/approve', [RecordRequestsController::class, 'approve'])->name('record-requests.approve');
  Route::post('/record-requests/{id}/deny', [RecordRequestsController::class, 'deny'])->name('record-requests.deny');


  // Schedule Management
  Route::prefix('/schedule')->middleware(['auth'])->group(function () {
    Route::get('/', [ScheduleController::class, 'index'])->name('clinical-staff.schedule.index');
    Route::post('/', [ScheduleController::class, 'store'])->name('clinical-staff.schedule.store');
    Route::put('/{id}', [ScheduleController::class, 'update'])->name('clinical-staff.schedule.update');
    Route::delete('/{id}', [ScheduleController::class, 'destroy'])->name('clinical-staff.schedule.destroy');
    Route::post('/multiple', [ScheduleController::class, 'storeMultiple'])->name('clinical-staff.schedule.storeMultiple');
  });

  // Doctor Schedule Management routes
  Route::get('/doctor-schedules', [App\Http\Controllers\Staff\DoctorScheduleManagementController::class, 'index'])->name('doctor-schedules.index');
  Route::get('/doctor-schedules/{doctorId}', [App\Http\Controllers\Staff\DoctorScheduleManagementController::class, 'doctorSchedules'])->name('doctor-schedules.view');
  Route::post('/doctor-schedules', [App\Http\Controllers\Staff\DoctorScheduleManagementController::class, 'store'])->name('doctor-schedules.store');
  Route::post('/doctor-schedules/{id}/approve', [App\Http\Controllers\Staff\DoctorScheduleManagementController::class, 'approveSchedule'])->name('doctor-schedules.approve');
  Route::post('/doctor-schedules/{id}/reject', [App\Http\Controllers\Staff\DoctorScheduleManagementController::class, 'rejectSchedule'])->name('doctor-schedules.reject');
  Route::put('/doctor-schedules/{id}', [App\Http\Controllers\Staff\DoctorScheduleManagementController::class, 'editSchedule'])->name('doctor-schedules.edit');

  // Lab Results Routes
  Route::get('/lab-results', [LabResultsController::class, 'index'])->name('lab-results.index');
  Route::get('/patients/{patient}/lab-results', [LabResultsController::class, 'getPatientLabResults'])->name('lab-results.patient');
  Route::post('/lab-results', [LabResultsController::class, 'store'])->name('lab-results.store');
  Route::get('/lab-results/{labResult}', [LabResultsController::class, 'show'])->name('lab-results.show');
  Route::get('/lab-results/{labResult}/download', [LabResultsController::class, 'download'])->name('lab-results.download');
  Route::delete('/lab-results/{labResult}', [LabResultsController::class, 'destroy'])->name('lab-results.destroy');

  // Receipt routes
  Route::get('/receipts', [ReceiptsController::class, 'index'])->name('receipts.index');
  Route::post('/receipts', [ReceiptsController::class, 'store'])->name('receipts.store');
  Route::get('/receipts/{receipt}', [ReceiptsController::class, 'show'])->name('receipts.show');
  Route::get('/receipts/{receipt}/download', [ReceiptsController::class, 'download'])->name('receipts.download');
  Route::delete('/receipts/{id}', [ReceiptsController::class, 'destroy'])->name('receipts.destroy');
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
  Route::get('/appointments', [PatientDashboardController::class, 'listAppointments'])->name('appointments.index');
  Route::get('/appointments/book', [PatientDashboardController::class, 'bookAppointment'])->name('appointments.book');
  Route::post('/appointments', [PatientDashboardController::class, 'store'])->name('appointments.store');
  Route::get('/appointments/check-booked-slots', [PatientDashboardController::class, 'getBookedTimeSlots'])->name('appointments.check-booked-slots');
  Route::get('/appointments/{id}', [PatientDashboardController::class, 'viewAppointment'])->name('appointments.show');

  // Medical Records
  Route::get('/records', [PatientDashboardController::class, 'listRecords'])->name('records.index');
  Route::get('/records/lab-results', [PatientDashboardController::class, 'listLabResults'])->name('records.lab-results');
  Route::get('/records/{id}', [PatientDashboardController::class, 'viewRecord'])->name('records.show');
  Route::get('/records/lab-results/{id}', [PatientDashboardController::class, 'viewLabResults'])->name('records.lab-results.show');

  // Lab Results Download
  Route::get('/lab-results/{id}/download', [PatientDashboardController::class, 'downloadLabResult'])->name('lab-results.download');

  // Lab Appointments
  Route::get('/lab-appointments/book', [PatientDashboardController::class, 'bookLabAppointment'])->name('lab-appointments.book');
  Route::post('/lab-appointments/book', [PatientDashboardController::class, 'storeLabAppointment'])->name('lab-appointments.store');

  // Doctors
  Route::get('/doctors', [PatientDashboardController::class, 'listDoctors'])->name('doctors.index');
  Route::get('/doctors/{id}', [PatientDashboardController::class, 'viewDoctor'])->name('doctors.show');
  Route::get('/doctor-schedules', [PatientDashboardController::class, 'viewDoctorSchedules'])->name('doctors.schedules');

  // API routes for doctor information
  // Route::get('/api/doctors', [\App\Http\Controllers\DoctorProfileController::class, 'listDoctors'])->name('api.doctors');
  // Route::get('/api/doctors/{id}', [\App\Http\Controllers\DoctorProfileController::class, 'show'])->name('api.doctors.show');
  // Route::get('/api/doctors/{id}/services', [\App\Http\Controllers\DoctorServiceController::class, 'getDoctorServices'])->name('api.doctors.services');
  // Route::get('/api/doctor-schedules/{doctorId}', [\App\Http\Controllers\Api\DoctorScheduleController::class, 'getSchedules'])->name('api.doctor-schedules');

  // Profile
  Route::get('/profile', [PatientDashboardController::class, 'viewProfile'])->name('profile.edit');
  Route::put('/profile', [PatientDashboardController::class, 'updateProfile'])->name('profile.update');

  // Use dedicated ProfileController for improved profile management
  Route::get('/my-profile', [ProfileController::class, 'index'])->name('my-profile.index');
  Route::get('/my-profile/edit', [ProfileController::class, 'edit'])->name('my-profile.edit');
  Route::put('/my-profile', [ProfileController::class, 'update'])->name('my-profile.update');

  // Patient record request routes
  Route::get('/record-requests', [App\Http\Controllers\Patient\RecordRequestController::class, 'index'])->name('records.requests.index');
  Route::get('/record-requests/create', [App\Http\Controllers\Patient\RecordRequestController::class, 'create'])->name('records.requests.create');
  Route::post('/record-requests', [App\Http\Controllers\Patient\RecordRequestController::class, 'store'])->name('records.requests.store');
  Route::get('/record-requests/{id}/view', [App\Http\Controllers\Patient\RecordRequestController::class, 'viewApprovedRecord'])->name('records.requests.view');

  // File upload routes
  Route::post('/upload/medical-records', [App\Http\Controllers\Patient\FileUploadController::class, 'uploadMedicalRecords'])->name('upload.medical-records');
});

// Patient notification routes
Route::middleware(['auth', 'role:patient'])->prefix('patient')->name('patient.')->group(function () {
  Route::get('/notifications', [App\Http\Controllers\Patient\NotificationController::class, 'index'])->name('notifications.index');
  Route::put('/notifications/{id}/read', [App\Http\Controllers\Patient\NotificationController::class, 'markAsRead'])->name('notifications.mark.read');
  Route::put('/notifications/mark-all-read', [App\Http\Controllers\Patient\NotificationController::class, 'markAllAsRead'])->name('notifications.mark.all.read');
  Route::get('/notifications/unread-count', [App\Http\Controllers\Patient\NotificationController::class, 'getUnreadCount'])->name('notifications.unread.count');
  Route::get('/notifications/recent', [App\Http\Controllers\Patient\NotificationController::class, 'getRecent'])->name('notifications.recent');
});

// Setup routes
Route::get('/setup/create-notifications-table', [App\Http\Controllers\SetupController::class, 'createNotificationsTable']);

// Lab Results Routes
Route::middleware(['auth', 'verified'])->group(function () {
  Route::prefix('staff/lab-results')->name('staff.lab-results.')->group(function () {
    Route::get('/', [App\Http\Controllers\ClinicalStaff\LabResultsController::class, 'index'])->name('index');
    Route::post('/', [App\Http\Controllers\ClinicalStaff\LabResultsController::class, 'store'])->name('store');
    Route::get('/{id}', [App\Http\Controllers\ClinicalStaff\LabResultsController::class, 'show'])->name('show');
    Route::get('/{id}/download', [App\Http\Controllers\ClinicalStaff\LabResultsController::class, 'download'])->name('download');
    Route::delete('/{id}', [App\Http\Controllers\ClinicalStaff\LabResultsController::class, 'destroy'])->name('destroy');
  });
});

// Receipt Routes
Route::middleware(['auth', 'verified'])->group(function () {
  Route::prefix('staff/receipts')->name('staff.receipts.')->group(function () {
    Route::get('/', [App\Http\Controllers\ClinicalStaff\ReceiptsController::class, 'index'])->name('index');
    Route::post('/', [App\Http\Controllers\ClinicalStaff\ReceiptsController::class, 'store'])->name('store');
    Route::get('/{id}', [App\Http\Controllers\ClinicalStaff\ReceiptsController::class, 'show'])->name('show');
    Route::get('/{id}/download', [App\Http\Controllers\ClinicalStaff\ReceiptsController::class, 'download'])->name('download');
    Route::delete('/{id}', [App\Http\Controllers\ClinicalStaff\ReceiptsController::class, 'destroy'])->name('destroy');
  });
});

// Debug route to test patient search directly
Route::get('/test-patient-search', function () {
  $term = request()->input('term', 'PAT000001');

  // Try exact match first
  $exactMatch = Patient::where('reference_number', $term)
    ->orWhere('reference_number', strtoupper($term))
    ->orWhere('reference_number', strtolower($term))
    ->first();

  if ($exactMatch) {
    return response()->json([
      'success' => true,
      'patient' => $exactMatch,
      'match_type' => 'exact'
    ]);
  }

  // Try general search
  $patients = Patient::where('name', 'like', "%{$term}%")
    ->orWhere('reference_number', 'like', "%{$term}%")
    ->limit(10)
    ->get();

  return response()->json([
    'success' => true,
    'patients' => $patients,
    'count' => $patients->count(),
    'match_type' => 'partial'
  ]);
});

// Add a route to run the fix command for appointments (can be removed after use)
Route::get('/fix-appointments', function() {
    Artisan::call('app:fix-patient-appointments');
    return redirect('/patient/dashboard')->with('success', 'Appointments fixed successfully!');
})->middleware(['auth', 'verified']);
