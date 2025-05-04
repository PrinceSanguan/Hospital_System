import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
}

interface Patient {
  id: number;
  name: string;
  email?: string;
}

interface LabTestResult {
  value: string | number;
  range?: string;
  status?: string;
  remarks?: string;
}

interface LabRecordDetails {
  lab_type?: string;
  appointment_time?: string;
  notes?: string;
  instructions?: string;
  results?: Record<string, LabTestResult>;
  result_date?: string;
  [key: string]: string | Record<string, LabTestResult> | undefined;
}

interface LabRecord {
  id: number;
  patient: Patient;
  assignedDoctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | LabRecordDetails;
  created_at: string;
  updated_at: string;
}

interface RecordRequest {
  id: number;
  status: string;
  request_reason: string;
  approved_at: string;
  approved_by: number;
  expires_at: string | null;
}

interface ViewLabRecordProps {
  user: User;
  record: LabRecord;
  request: RecordRequest;
}

export default function ViewLabRecord({ user, record, request }: ViewLabRecordProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTestStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case 'abnormal':
        return <Badge className="bg-red-100 text-red-800">Abnormal</Badge>;
      case 'borderline':
        return <Badge className="bg-yellow-100 text-yellow-800">Borderline</Badge>;
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '';
    return timeString;
  };

  const parseDetails = (): LabRecordDetails => {
    if (typeof record.details === 'string') {
      try {
        return JSON.parse(record.details) as LabRecordDetails;
      } catch {
        return {};
      }
    }
    return record.details;
  };

  const details = parseDetails();

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <PatientLayout user={user}>
      <div className={`bg-gray-100 dark:bg-gray-900 ${isPrinting ? 'print:bg-white print:h-auto' : ''}`}>
        <Head title={`Laboratory Results - ${details.lab_type || formatDate(record.appointment_date)}`} />

        <main className="container mx-auto py-6 px-4 md:px-6 print:bg-white print:p-0 print:dark:bg-white print:overflow-visible">
          {/* Header Actions - hide when printing */}
          <div className={`flex justify-between items-center mb-6 ${isPrinting ? 'print:hidden' : ''}`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="p-0">
                  <Link href={route('patient.records.requests.index')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Laboratory Results
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Viewing your lab results from {formatDate(record.appointment_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {/* Access Information */}
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Record Access Information</h3>
                  <p className="text-sm text-gray-500">This record was made available to you on {formatDate(request.approved_at)}</p>
                  {request.expires_at && (
                    <p className="text-sm text-orange-500">Access expires on {formatDate(request.expires_at)}</p>
                  )}
                </div>
                <Badge className="bg-green-500">Approved</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Lab Record Card */}
          <Card className="border-t-4 border-t-purple-500 print:shadow-none print:border print:border-black">
            {/* Header/Title - shows in print */}
            <div className="text-center pt-8 pb-4 border-b print:block">
              <h1 className="text-3xl font-bold mb-1">LABORATORY REPORT</h1>
              <p className="text-gray-500">Famcare Healthcare System</p>
              <p className="text-sm text-gray-400">
                All information contained in this record is strictly confidential
              </p>
            </div>

            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Patient & Record Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Patient Name</h3>
                      <p className="font-medium text-lg">{record.patient?.name || 'Unknown Patient'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Lab Test Type</h3>
                      <p className="font-medium">{details.lab_type || 'General Laboratory Test'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Status</h3>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Appointment Date</h3>
                      <p className="font-medium">{formatDate(record.appointment_date)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Appointment Time</h3>
                      <p className="font-medium">{formatTime(details.appointment_time)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Result Date</h3>
                      <p className="font-medium">{formatDate(details.result_date) || formatDate(record.updated_at)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Requested By</h3>
                      <p className="font-medium text-lg">Dr. {record.assignedDoctor?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Created On</h3>
                      <p className="font-medium">{formatDate(record.created_at)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lab Results */}
                <div>
                  <h2 className="text-xl font-bold mb-4">TEST RESULTS</h2>
                  {details.results && Object.keys(details.results).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Reference Range</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(details.results).map(([testName, result]) => (
                          <TableRow key={testName}>
                            <TableCell className="font-medium">{testName}</TableCell>
                            <TableCell>{result.value}</TableCell>
                            <TableCell>{result.range || 'N/A'}</TableCell>
                            <TableCell>{getTestStatusBadge(result.status || '')}</TableCell>
                            <TableCell>{result.remarks || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-md text-center text-gray-500">
                      No test results available yet
                    </div>
                  )}
                </div>

                <Separator />

                {/* Instructions & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">INSTRUCTIONS</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.instructions || 'No specific instructions provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold mb-4">NOTES</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.notes || 'No additional notes'}</p>
                    </div>
                  </div>
                </div>

                {/* Footer for print */}
                <div className="mt-10 text-center hidden print:block">
                  <Separator className="mb-4" />
                  <p className="text-sm text-gray-500">Printed on {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Famcare Healthcare System</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </PatientLayout>
  );
}
