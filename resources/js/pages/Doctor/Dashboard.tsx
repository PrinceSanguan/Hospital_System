import { Head } from "@inertiajs/react";
import { Calendar, Clock, Users } from "lucide-react";

interface DoctorDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  stats: {
    patients: number;
    appointments: number;
  };
  upcomingAppointments: Array<{
    id: number;
    patient: {
      id: number;
      name: string;
      email: string;
    };
    appointment_date: string;
    record_type: string;
    status: string;
  }>;
}

export default function DoctorDashboard({ user, stats, upcomingAppointments }: DoctorDashboardProps) {
  return (
    <>
      <Head title="Doctor Dashboard" />
      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Welcome, Dr. {user.name}</h1>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.patients}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.appointments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {upcomingAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="font-medium text-gray-900">{appointment.patient.name}</div>
                          <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(appointment.appointment_date).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {appointment.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                <Clock className="mr-2 h-5 w-5" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
