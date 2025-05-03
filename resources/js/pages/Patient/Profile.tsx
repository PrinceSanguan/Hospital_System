import React from 'react';
import { Head } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileAppointmentsList from '@/components/patient/ProfileAppointmentsList';
import { UserData } from '@/types';

interface PatientRecord {
  id: number;
  appointment_date: string;
  status: string;
  details: string | null;
  record_type: string;
  assignedDoctor?: {
    id: number;
    name: string;
  } | null;
}

interface ProfileProps {
  user: UserData;
  appointments: PatientRecord[];
  medicalRecords: PatientRecord[];
  registrationDate: string;
}

export default function Profile({ user, appointments, medicalRecords, registrationDate }: ProfileProps) {
  // Filter to only show active appointments (not completed or cancelled)
  const activeAppointments = appointments.filter(
    appointment => ['pending', 'confirmed'].includes(appointment.status.toLowerCase())
  );

  return (
    <PatientLayout user={user}>
      <Head title="My Profile" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Patient Profile: {user.name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-base">{user.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-base">{user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Registered Since</h3>
                    <p className="mt-1 text-base">
                      {new Date(registrationDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments Section */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileAppointmentsList appointments={activeAppointments} />
              </CardContent>
            </Card>
          </div>

          {/* Medical Records Section */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecords && medicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords.map(record => (
                      <div key={record.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">
                            {record.record_type === 'medical_checkup'
                              ? 'Medical Checkup'
                              : record.record_type === 'laboratory'
                                ? 'Laboratory Test'
                                : 'Medical Record'}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            record.status.toLowerCase() === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p>Date: {new Date(record.appointment_date).toLocaleDateString()}</p>
                          <p>
                            Doctor: {record.assignedDoctor
                              ? `Dr. ${record.assignedDoctor.name}`
                              : 'Not assigned'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No medical records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
