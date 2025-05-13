<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DoctorScheduleController extends Controller
{
    /**
     * Get schedules for a specific doctor
     *
     * @param Request $request
     * @param int $doctorId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSchedules(Request $request, $doctorId)
    {
        // Validate doctor exists
        $doctor = User::where('id', $doctorId)
            ->where('user_role', 'doctor')
            ->first();

        if (!$doctor) {
            return response()->json([
                'message' => 'Doctor not found',
                'schedules' => []
            ], 404);
        }

        // Get schedules for specific date if provided, otherwise get upcoming week
        $query = DoctorSchedule::where('doctor_id', $doctorId)
            ->where('is_approved', true)
            ->with('doctor');

        $specificDate = $request->query('date');

        if ($specificDate) {
            // Get schedules for this specific date
            $date = Carbon::parse($specificDate);

            $query->where(function($q) use ($date) {
                // Get schedules specifically for this date
                $q->where('specific_date', $date->format('Y-m-d'))
                // Or get weekly schedules that match this day of week
                ->orWhere(function($inner) use ($date) {
                    $inner->where('day_of_week', $date->dayOfWeek)
                        ->whereNull('specific_date');
                });
            });
        } else {
            // Get schedules for upcoming week
            $startDate = Carbon::now();
            $endDate = Carbon::now()->addDays(7);

            $query->where(function($q) use ($startDate, $endDate) {
                // Get specific dates in range
                $q->whereBetween('specific_date', [
                    $startDate->format('Y-m-d'),
                    $endDate->format('Y-m-d')
                ])
                // Or get weekly schedules
                ->orWhereNull('specific_date');
            });
        }

        $schedules = $query->get();

        // Prepare doctor information
        $doctorInfo = [
            'id' => $doctor->id,
            'name' => $doctor->name,
            'specialty' => $doctor->doctor_profile->specialty ?? 'General Practitioner',
            'profile_image' => $doctor->doctor_profile->profile_image ?? null,
        ];

        return response()->json([
            'doctor' => $doctorInfo,
            'schedules' => $schedules,
        ]);
    }
}
