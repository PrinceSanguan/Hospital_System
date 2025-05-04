import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
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
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface LabRecordsAddProps {
  user: User;
  patients: Patient[];
  doctors: Doctor[];
}

export default function LabRecordsAdd({ user, patients, doctors }: LabRecordsAddProps) {
  const { data, setData, post, processing, errors } = useForm({
    patient_id: '',
    assigned_doctor_id: '',
    appointment_date: format(new Date(), 'yyyy-MM-dd'),
    appointment_time: '09:00',
    lab_type: '',
    notes: '',
    instructions: '',
    status: 'pending',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('staff.lab.records.store'));
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

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
          <Head title="Add Laboratory Record" />

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild className="p-0">
                    <Link href={route('staff.lab.records')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add Laboratory Record
                  </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Create a new laboratory record or appointment for a patient
                </p>
              </div>
            </div>

            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Laboratory Record Details</CardTitle>
                  <CardDescription>
                    Enter the details for the laboratory test or appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">Patient <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('patient_id', value)}
                      value={data.patient_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name} ({patient.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.patient_id && (
                      <p className="text-sm text-red-500">{errors.patient_id}</p>
                    )}
                  </div>

                  {/* Doctor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="assigned_doctor_id">Doctor <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('assigned_doctor_id', value)}
                      value={data.assigned_doctor_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
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
                    <Label htmlFor="lab_type">Lab Test Type <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('lab_type', value)}
                      value={data.lab_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lab test type" />
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
                      <Label htmlFor="appointment_date">Appointment Date <span className="text-red-500">*</span></Label>
                      <Input
                        id="appointment_date"
                        type="date"
                        value={data.appointment_date}
                        onChange={(e) => setData('appointment_date', e.target.value)}
                      />
                      {errors.appointment_date && (
                        <p className="text-sm text-red-500">{errors.appointment_date}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointment_time">Appointment Time</Label>
                      <Input
                        id="appointment_time"
                        type="time"
                        value={data.appointment_time}
                        onChange={(e) => setData('appointment_time', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('status', value)}
                      value={data.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-500">{errors.status}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any notes or additional information"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Patient Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Instructions for the patient (e.g., fasting requirements, preparation instructions)"
                      value={data.instructions}
                      onChange={(e) => setData('instructions', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={route('staff.lab.records')}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={processing}>
                    Create Laboratory Record
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
