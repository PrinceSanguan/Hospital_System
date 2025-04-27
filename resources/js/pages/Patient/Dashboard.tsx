import { Head, Link } from "@inertiajs/react";
import { Calendar, ClipboardList, Microscope, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PatientDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  upcomingAppointments: Array<{
    id: number;
    assignedDoctor: {
      id: number;
      name: string;
    } | null;
    appointment_date: string;
    record_type: string;
    details: string | null;
  }>;
  labResults: Array<{
    id: number;
    record_type: string;
    lab_results: Record<string, any>;
    updated_at: string;
  }>;
  medicalRecords: Array<{
    id: number;
    assignedDoctor: {
      id: number;
      name: string;
    } | null;
    record_type: string;
    details: string | null;
    updated_at: string;
  }>;
}

export default function PatientDashboard({ user, upcomingAppointments, labResults, medicalRecords }: PatientDashboardProps) {
  return (
    <>
      <Head title="Patient Dashboard" />
      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <Button asChild>
              <Link href="/service/medical-checkup">Book Appointment</Link>
            </Button>
          </div>

          {/* Upcoming Appointments */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/service/medical-checkup">View All</Link>
              </Button>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center">
                    <div className="mb-2 mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:mb-0">
                      {appointment.record_type === 'medical_checkup' ? <Stethoscope size={20} /> : <Microscope size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {appointment.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.assignedDoctor
                          ? `Dr. ${appointment.assignedDoctor.name}`
                          : 'Doctor not assigned yet'}
                      </p>
                    </div>
                    <div className="mt-2 rounded-lg bg-blue-50 px-3 py-1 text-center text-sm text-blue-700 sm:mt-0">
                      {new Date(appointment.appointment_date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                <p>No upcoming appointments. Book one now!</p>
              </div>
            )}
          </div>

          {/* Recent Medical Records */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Recent Medical Records</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/service/medical-checkup">View All</Link>
              </Button>
            </div>

            {medicalRecords.length > 0 ? (
              <div className="divide-y">
                {medicalRecords.map((record) => (
                  <div key={record.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">Medical Checkup</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Doctor: {record.assignedDoctor ? `Dr. ${record.assignedDoctor.name}` : 'Not specified'}
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      {record.details || 'No details available'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                <p>No medical records available</p>
              </div>
            )}
          </div>

          {/* Lab Results */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Microscope className="mr-2 h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Laboratory Results</h2>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/service/laboratory">View All</Link>
              </Button>
            </div>

            {labResults.length > 0 ? (
              <div className="divide-y">
                {labResults.map((result) => (
                  <div key={result.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">Laboratory Test Results</p>
                      <p className="text-sm text-gray-500">
                        {new Date(result.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2">
                      {Object.entries(result.lab_results).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="text-sm text-gray-700">{key}:</span>
                          <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                <p>No laboratory results available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
