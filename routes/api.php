<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Patient\PatientController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('/login', [LoginController::class, 'store']);
Route::post('/register', [RegisterController::class, 'store']);


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/patient/dashboard', [PatientController::class, 'dashboard']);
    Route::post('/patient/appointment', [PatientController::class, 'store']);
    Route::get('/patient/appointments', [PatientController::class, 'listAppointments']);
    Route::get('/patient/appointments/{id}', [PatientController::class, 'viewAppointment']);
    Route::get('/patient/book-appointment', [PatientController::class, 'bookAppointment']);
    Route::get('/patient/records', [PatientController::class, 'listRecords']);
    Route::post('/patient/appointments/{id}/cancel', [PatientController::class, 'cancelAppointment']);

    // Lab results routes
    Route::get('/patient/lab-results', [PatientController::class, 'listLabResults']);
    Route::get('/patient/lab-results/{id}', [PatientController::class, 'viewLabResults']);
    Route::post('/patient/lab-appointment', [PatientController::class, 'storeLabAppointment']);
    Route::get('/patient/lab-result/download/{id}', [PatientController::class, 'downloadLabResult']);

    // Medical records
    Route::get('/patient/record/{id}', [PatientController::class, 'viewRecord']);

    // Doctor related routes
    Route::get('/patient/doctors', [PatientController::class, 'listDoctors']);
    Route::get('/patient/doctor/{id}', [PatientController::class, 'viewDoctor']);
    Route::post('/patient/booked-time-slots', [PatientController::class, 'getBookedTimeSlots']);

    // Profile routes
    Route::get('/patient/profile', [PatientController::class, 'getProfile']);
    Route::post('/patient/profile/update', [PatientController::class, 'updateProfile']);

    // Notification routes
    Route::get('/patient/notifications', [PatientController::class, 'getNotifications']);
    Route::post('/patient/notifications/{id}/mark-as-read', [PatientController::class, 'markAsRead']);
    Route::post('/patient/notifications/mark-all-as-read', [PatientController::class, 'markAllAsRead']);
    Route::get('/patient/notifications/unread-count', [PatientController::class, 'getUnreadCount']);
    Route::get('/patient/notifications/recent', [PatientController::class, 'getRecent']);

    // Upload
    Route::post('/patient/upload-medical-records', [PatientController::class, 'uploadMedicalRecords']);

    //get doctor schedule
    Route::get('/patient/doctor-schedules/{doctorId?}', [PatientController::class, 'getDoctorSchedules']);

    Route::post('/patient/cleanup-temp-file', [PatientController::class, 'cleanupTempFile']);
});
