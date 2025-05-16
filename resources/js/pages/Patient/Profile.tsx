import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProfileAppointmentsList from '@/components/patient/ProfileAppointmentsList';
import { UserData } from '@/types';
import { FaPencilAlt } from 'react-icons/fa';

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
  user: UserData & {
    profile_image: string | null;
  };
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Patient Profile: {user.name}</h1>
            <Link href={route('patient.my-profile.edit')}>
              <Button>
                <FaPencilAlt className="mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gray-200">
                        <span className="text-gray-500 text-5xl">{user.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
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
