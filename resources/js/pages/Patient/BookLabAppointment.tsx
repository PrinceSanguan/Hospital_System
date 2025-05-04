import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ChevronLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
}

interface BookLabAppointmentProps {
  user: User;
  doctors: Doctor[];
}

export default function BookLabAppointment({ user, doctors }: BookLabAppointmentProps) {
  const { data, setData, post, processing, errors } = useForm({
    assigned_doctor_id: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    lab_type: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('patient.lab-appointments.store'));
  };

  const labTypeOptions = [
    { value: 'blood_test', label: 'Blood Test' },
    { value: 'urine_test', label: 'Urine Test' },
    { value: 'x_ray', label: 'X-Ray' },
    { value: 'ct_scan', label: 'CT Scan' },
    { value: 'mri', label: 'MRI' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ecg', label: 'ECG' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <PatientLayout user={user}>
      <Head title="Book Laboratory Appointment" />

      <div className="py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild className="p-0">
                <Link href={route('patient.appointments.index')}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to Appointments
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Book Laboratory Appointment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Request a laboratory appointment with one of our healthcare providers
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  New Laboratory Appointment Request
                </CardTitle>
                <CardDescription>
                  Fill out the form below to request a laboratory appointment. Our staff will review your request and confirm the appointment.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Doctor Selection */}
                <div className="space-y-2">
                  <Label htmlFor="assigned_doctor_id">
                    Doctor <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setData('assigned_doctor_id', value)}
                    value={data.assigned_doctor_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          Dr. {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assigned_doctor_id && (
                    <p className="text-sm text-red-500">{errors.assigned_doctor_id}</p>
                  )}
                </div>

                {/* Lab Type */}
                <div className="space-y-2">
                  <Label htmlFor="lab_type">
                    Laboratory Test Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setData('lab_type', value)}
                    value={data.lab_type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select laboratory test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {labTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.lab_type && (
                    <p className="text-sm text-red-500">{errors.lab_type}</p>
                  )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date">
                      Preferred Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={data.appointment_date}
                      onChange={(e) => setData('appointment_date', e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                    {errors.appointment_date && (
                      <p className="text-sm text-red-500">{errors.appointment_date}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time">
                      Preferred Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="appointment_time"
                      type="time"
                      value={data.appointment_time}
                      onChange={(e) => setData('appointment_time', e.target.value)}
                    />
                    {errors.appointment_time && (
                      <p className="text-sm text-red-500">{errors.appointment_time}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Information</Label>
                  <Textarea
                    id="notes"
                    placeholder="Please provide any additional details or specific requirements for your laboratory test"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={route('patient.appointments.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                  Submit Request
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
}
