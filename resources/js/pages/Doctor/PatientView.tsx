import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Badge } from "@/components/ui/badge";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface PatientViewProps {
  user: User;
  patient: {
    id: number;
    name: string;
    email: string;
    created_at: string;
    recordStats: {
      total: number;
      pending: number;
      completed: number;
    };
  };
}

// Error Boundary Component
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PatientView error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-4 text-gray-700">There was an error loading the patient data.</p>
          <pre className="bg-gray-100 p-4 rounded text-sm text-left overflow-auto max-h-40">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const PatientView = ({ user, patient }: PatientViewProps) => {
  // Add validation for patient data
  useEffect(() => {
    // Log the structure for debugging
    console.log("Patient data:", patient);
  }, [patient]);

  return (
    <DoctorLayout user={user}>
      <Head title={`Patient: ${patient.name}`} />
      <ErrorBoundary>
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mb-6">
              <Button asChild variant="outline" className="mb-4">
                <Link href={route('doctor.patients.index')}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Patients
                </Link>
              </Button>

              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Patient Profile: {patient.name}</h1>
              </div>
            </div>

            {/* Patient Information */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-base">{patient.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-base">{patient.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Registered Since</h3>
                    <p className="mt-1 text-base">{new Date(patient.created_at).toLocaleDateString()}</p>
                  </div>
                  {patient.recordStats && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Records</h3>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline">{patient.recordStats.total} Total</Badge>
                        <Badge variant="outline" className="bg-yellow-50">{patient.recordStats.pending} Pending</Badge>
                        <Badge variant="outline" className="bg-green-50">{patient.recordStats.completed} Completed</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Only Appointments Tab */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Appointments
                </CardTitle>
                  </CardHeader>
                  <CardContent>
                {/* Appointments content */}
                      <div className="text-center py-8 text-gray-500">
                        No appointments scheduled for this patient.
                      </div>
                  </CardContent>
                </Card>
          </div>
        </div>
      </ErrorBoundary>
    </DoctorLayout>
  );
};

export default PatientView;
