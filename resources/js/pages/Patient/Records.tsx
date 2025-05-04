import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { FileText, FileSearch, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface User {
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
}

interface RecordDetails {
  appointment_time?: string;
  vital_signs?: {
    temperature?: string | number;
    blood_pressure?: string;
    pulse_rate?: string | number;
    oxygen_saturation?: string | number;
  };
  diagnosis?: string;
  prescriptions?: string[];
  notes?: string;
  followup_date?: string;
  [key: string]: string | number | boolean | string[] | Record<string, string | number> | undefined;
}

interface MedicalRecord {
  id: number;
  patient_id: number;
  assignedDoctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | RecordDetails;
  created_at: string;
  updated_at: string;
}

interface RecordsProps {
  user: User;
  records: MedicalRecord[];
}

export default function Records({ user, records }: RecordsProps) {
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
      case 'medical_record':
        return 'Medical Record';
      case 'medical_checkup':
        return 'Medical Checkup';
      case 'prescription':
        return 'Prescription';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getDiagnosis = (details: string | RecordDetails): string => {
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details) as RecordDetails;
      } catch {
        return 'N/A';
      }
    }

    return details?.diagnosis || 'N/A';
  };

  // Filter records by type
  const medicalCheckups = records.filter(record => record.record_type === 'medical_checkup');
  const prescriptions = records.filter(record => record.record_type === 'prescription');

  return (
    <PatientLayout user={user}>
      <Head title="Medical Records" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Medical Records
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all your medical records and request access to specific records
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                <Link href={route('patient.records.requests.create', { type: 'medical_record' })}>
                  <ClipboardList className="h-4 w-4" />
                  Request Medical Record
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex items-center gap-1">
                <Link href={route('patient.records.lab-results')}>
                  <FileText className="h-4 w-4" />
                  Lab Results
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="checkups">Medical Checkups</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    All Medical Records
                  </CardTitle>
                  <CardDescription>
                    Your complete medical history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <caption className="mt-4 text-sm text-muted-foreground">
                      A list of your medical records
                    </caption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Diagnosis/Notes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length > 0 ? (
                        records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.appointment_date)}</TableCell>
                            <TableCell className="font-medium">{getRecordTypeDisplay(record.record_type)}</TableCell>
                            <TableCell>Dr. {record.assignedDoctor?.name || 'Unknown'}</TableCell>
                            <TableCell className="max-w-xs truncate">{getDiagnosis(record.details)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={route('patient.records.show', record.id)}>
                                  <FileSearch className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No medical records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checkups">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Medical Checkups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicalCheckups.length > 0 ? (
                        medicalCheckups.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.appointment_date)}</TableCell>
                            <TableCell>Dr. {record.assignedDoctor?.name || 'Unknown'}</TableCell>
                            <TableCell className="max-w-xs truncate">{getDiagnosis(record.details)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={route('patient.records.show', record.id)}>
                                  <FileSearch className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No medical checkups found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.length > 0 ? (
                        prescriptions.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.appointment_date)}</TableCell>
                            <TableCell>Dr. {record.assignedDoctor?.name || 'Unknown'}</TableCell>
                            <TableCell className="max-w-xs truncate">{getDiagnosis(record.details)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={route('patient.records.show', record.id)}>
                                  <FileSearch className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No prescriptions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PatientLayout>
  );
}
