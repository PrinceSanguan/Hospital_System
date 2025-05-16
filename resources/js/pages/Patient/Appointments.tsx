import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Microscope,
  Clock,
} from "lucide-react";
import { format } from 'date-fns';

interface AppointmentProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  appointments: Array<{
    id: number;
    assignedDoctor: {
      id: number;
      name: string;
    } | null;
    appointment_date: string;
    record_type: string;
    details: string | null;
    status: string;
  }>;
}

export default function Appointments({
  user,
  appointments = [],
}: AppointmentProps) {
  const [activeTab, setActiveTab] = useState('all');

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(appointment.status.toLowerCase()) &&
      new Date(appointment.appointment_date) >= new Date();
    if (activeTab === 'completed') return appointment.status.toLowerCase() === 'completed';
    if (activeTab === 'cancelled') return appointment.status.toLowerCase() === 'cancelled';
    if (activeTab === 'pending') return appointment.status.toLowerCase() === 'pending';
    return true;
  });

  // Parse appointment details from JSON string
  const getAppointmentDetails = (details: string | null) => {
    if (!details) return {};

    // If already an object, return as is
    if (typeof details === 'object') return details;

    try {
      // Try to parse as JSON
      return JSON.parse(details);
    } catch {
      // If not valid JSON, return an object with the string as reason
      console.log('Details not in JSON format, using as plain text:', details);
      return { reason: details };
    }
  };

  return (
    <PatientLayout user={user}>
      <Head title="My Appointments" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="mt-1 text-gray-600">View and manage your scheduled appointments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment History</CardTitle>
          <CardDescription>View and manage your appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const details = getAppointmentDetails(appointment.details);
                  const appointmentDate = new Date(appointment.appointment_date);

                  return (
                    <div key={appointment.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center mb-2 md:mb-0">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {appointment.record_type === 'medical_checkup' ? <Stethoscope size={20} /> : <Microscope size={20} />}
                        </div>
                        <div>
                          <h3 className="font-medium">{appointment.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}</h3>
                          <p className="text-sm text-gray-500">
                            {appointment.assignedDoctor
                              ? `Dr. ${appointment.assignedDoctor.name}`
                              : 'Doctor not assigned yet'}
                          </p>
                          {details.reason && (
                            <p className="text-xs text-gray-500 mt-1">Reason: {details.reason}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center mt-2 md:mt-0">
                        <div className="text-sm text-gray-700 flex items-center mr-4">
                          <Clock size={16} className="mr-1" />
                          <span>{format(appointmentDate, 'MMM d, yyyy')}</span>
                          <span className="mx-1">•</span>
                          <span>{format(appointmentDate, 'h:mm a')}</span>
                        </div>

                        <Badge className={
                          appointment.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status.toLowerCase() === 'cancelled' ? 'bg-red-600 text-white' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No appointments found.</p>
                  {activeTab === 'all' && (
                    <p className="text-sm text-gray-400 mt-2">Book an appointment to get started!</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PatientLayout>
  );
}
