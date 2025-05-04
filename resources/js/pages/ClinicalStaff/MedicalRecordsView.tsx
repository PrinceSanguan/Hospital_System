import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft, Printer, FileEdit } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface User {
  name: string;
  email: string;
  role?: string;
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

interface MedicalRecordDetails {
  appointment_time?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  prescriptions?: string[];
  notes?: string;
  followup_date?: string;
  [key: string]: string | number | string[] | Record<string, string | number> | undefined;
}

interface MedicalRecord {
  id: number;
  patient: Patient;
  assignedDoctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | MedicalRecordDetails;
  created_at: string;
  updated_at: string;
}

interface MedicalRecordsViewProps {
  user: User;
  record: MedicalRecord;
}

export default function MedicalRecordsView({ user, record }: MedicalRecordsViewProps) {
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

  const getRecordTypeDisplay = (recordType: string): string => {
    switch (recordType.toLowerCase()) {
      case 'medical_checkup':
        return 'Medical Checkup';
      case 'medical_record':
        return 'General Medical Record';
      case 'prescription':
        return 'Prescription';
      default:
        return recordType.replace('_', ' ');
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

  const parseDetails = (): MedicalRecordDetails => {
    if (typeof record.details === 'string') {
      try {
        return JSON.parse(record.details) as MedicalRecordDetails;
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
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isPrinting ? 'print:bg-white print:h-auto' : ''}`}>
      {/* Sidebar - hide when printing */}
      <div className={isPrinting ? 'print:hidden' : ''}>
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - hide when printing */}
        <div className={isPrinting ? 'print:hidden' : ''}>
          <Header user={user} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900 print:bg-white print:p-0 print:dark:bg-white print:overflow-visible">
          <Head title={`Medical Record - ${record.patient?.name || 'Patient'}`} />

          {/* Header Actions - hide when printing */}
          <div className={`flex justify-between items-center mb-6 ${isPrinting ? 'print:hidden' : ''}`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="p-0">
                  <Link href={route('staff.clinical.info')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Medical Record
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Viewing detailed medical record information
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button asChild className="flex items-center gap-1">
                <Link href={route('staff.clinical.info.edit', record.id)}>
                  <FileEdit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>

          {/* Medical Record Card */}
          <Card className="border-t-4 border-t-blue-500 print:shadow-none print:border print:border-black">
            {/* Header/Title - shows in print */}
            <div className="text-center pt-8 pb-4 border-b print:block">
              <h1 className="text-3xl font-bold mb-1">MEDICAL RECORD</h1>
              <p className="text-gray-500">FarmCare Staff Healthcare System</p>
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
                      <h3 className="font-semibold text-sm text-gray-500">Record Type</h3>
                      <p className="font-medium">{getRecordTypeDisplay(record.record_type)}</p>
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
                      <h3 className="font-semibold text-sm text-gray-500">Created On</h3>
                      <p className="font-medium">{formatDate(record.created_at)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Attending Physician</h3>
                      <p className="font-medium text-lg">Dr. {record.assignedDoctor?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Follow-up Date</h3>
                      <p className="font-medium">{formatDate(details.followup_date)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Vital Signs */}
                <div>
                  <h2 className="text-xl font-bold mb-4">VITAL SIGNS</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Temperature</h3>
                      <p className="font-medium">{details.vital_signs?.temperature || 'N/A'} °C</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Blood Pressure</h3>
                      <p className="font-medium">{details.vital_signs?.blood_pressure || 'N/A'} mmHg</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Pulse Rate</h3>
                      <p className="font-medium">{details.vital_signs?.pulse_rate || 'N/A'} bpm</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Respiratory Rate</h3>
                      <p className="font-medium">{details.vital_signs?.respiratory_rate || 'N/A'} bpm</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Oxygen Saturation</h3>
                      <p className="font-medium">{details.vital_signs?.oxygen_saturation || 'N/A'} %</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Diagnosis */}
                <div>
                  <h2 className="text-xl font-bold mb-4">DIAGNOSIS</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <p className="whitespace-pre-wrap">{details.diagnosis || 'No diagnosis provided'}</p>
                  </div>
                </div>

                <Separator />

                {/* Prescriptions */}
                <div>
                  <h2 className="text-xl font-bold mb-4">PRESCRIPTIONS</h2>
                  {details.prescriptions && details.prescriptions.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {details.prescriptions.map((prescription, index) => (
                          <li key={index} className="p-4">
                            <p>{prescription}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p>No prescriptions provided</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Notes */}
                <div>
                  <h2 className="text-xl font-bold mb-4">ADDITIONAL NOTES</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <p className="whitespace-pre-wrap">{details.notes || 'No additional notes'}</p>
                  </div>
                </div>

                {/* Signature section for printing */}
                <div className="mt-16 grid grid-cols-2 gap-8 pt-8 print:block print:mt-32">
                  <div className="border-t pt-4">
                    <p className="text-center">_________________________</p>
                    <p className="text-center text-sm mt-1">Dr. {record.assignedDoctor?.name || 'Physician'}'s Signature</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-center">_________________________</p>
                    <p className="text-center text-sm mt-1">{record.patient?.name || 'Patient'}'s Signature</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
