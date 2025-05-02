import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { PatientLayout } from '@/layouts/PatientLayout';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  availability: string[];
  image?: string;
}

interface BookAppointmentProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  doctors: Doctor[];
}

export default function BookAppointment({ user, doctors }: BookAppointmentProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([
    '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
  });

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setData('appointment_date', format(newDate, 'yyyy-MM-dd'));

      // Reset time slot when date changes
      setSelectedTimeSlot(null);
      setData('appointment_time', '');

      // In a real app, you would fetch available time slots for this doctor and date
      // For now, we'll use dummy data
      setAvailableTimeSlots([
        '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
      ]);
    }
  };

  // Handle doctor selection
  const handleDoctorSelect = (doctorId: string) => {
    setData('doctor_id', doctorId);
    const doctor = doctors.find(d => d.id.toString() === doctorId) || null;
    setSelectedDoctor(doctor);

    // Reset date and time when doctor changes
    setDate(undefined);
    setSelectedTimeSlot(null);
    setData('appointment_date', '');
    setData('appointment_time', '');
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setData('appointment_time', timeSlot);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('patient.appointments.store'), {
      onSuccess: () => {
        reset();
        setDate(undefined);
        setSelectedTimeSlot(null);
        setSelectedDoctor(null);
      },
    });
  };

  return (
    <PatientLayout user={user}>
      <Head title="Book Appointment" />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Doctor Selection */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Select Doctor</CardTitle>
                  <CardDescription>Choose a specialist for your appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDoctor?.id === doctor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleDoctorSelect(doctor.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {doctor.image ? (
                            <img
                              src={doctor.image}
                              alt={doctor.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <Stethoscope className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-500">{doctor.specialty}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.doctor_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.doctor_id}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Appointment Details */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                  <CardDescription>Select a date and time for your appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !date && 'text-gray-400'
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP') : 'Select a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            initialFocus
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                              date.getDay() === 0 || // Disable Sundays
                              date.getDay() === 6    // Disable Saturdays
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.appointment_date && (
                        <p className="text-sm text-red-500">{errors.appointment_date}</p>
                      )}
                    </div>

                    {/* Time Slots */}
                    {date && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Time Slot
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {availableTimeSlots.map((timeSlot) => (
                            <Button
                              key={timeSlot}
                              type="button"
                              variant={selectedTimeSlot === timeSlot ? 'default' : 'outline'}
                              className="flex items-center justify-center"
                              onClick={() => handleTimeSlotSelect(timeSlot)}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              {timeSlot}
                            </Button>
                          ))}
                        </div>
                        {errors.appointment_time && (
                          <p className="text-sm text-red-500">{errors.appointment_time}</p>
                        )}
                      </div>
                    )}

                    {/* Reason for Visit */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Reason for Visit
                      </label>
                      <Select
                        value={data.reason}
                        onValueChange={(value) => setData('reason', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">General Consultation</SelectItem>
                          <SelectItem value="checkup">Regular Checkup</SelectItem>
                          <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                          <SelectItem value="specialist">Specialist Consultation</SelectItem>
                          <SelectItem value="emergency">Urgent Care</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.reason && (
                        <p className="text-sm text-red-500">{errors.reason}</p>
                      )}
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Additional Notes
                      </label>
                      <Textarea
                        placeholder="Please share any symptoms or concerns"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={processing || !date || !selectedTimeSlot || !data.doctor_id || !data.reason}
                    >
                      Book Appointment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
