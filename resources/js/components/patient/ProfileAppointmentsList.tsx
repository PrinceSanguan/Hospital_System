import React from 'react';
import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppointmentCard from './AppointmentCard';

interface Appointment {
  id: number;
  appointment_date: string;
  status: string;
  details: string | null;
  assignedDoctor?: {
    id: number;
    name: string;
  } | null;
}

interface ProfileAppointmentsListProps {
  appointments: Appointment[];
  showAllLink?: boolean;
}

const ProfileAppointmentsList: React.FC<ProfileAppointmentsListProps> = ({
  appointments,
  showAllLink = true
}) => {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No appointments found</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/patient/appointments/book">Schedule an Appointment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium">Your Appointments</h3>
        </div>

        {showAllLink && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/patient/appointments">View All</Link>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {appointments.map(appointment => (
          <AppointmentCard
            key={appointment.id}
            id={appointment.id}
            appointmentDate={appointment.appointment_date}
            status={appointment.status}
            details={appointment.details}
            doctorName={appointment.assignedDoctor?.name}
            onViewDetails={(id) => {
              // Navigate to appointment details page
              window.location.href = `/patient/appointments/${id}`;
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileAppointmentsList;
