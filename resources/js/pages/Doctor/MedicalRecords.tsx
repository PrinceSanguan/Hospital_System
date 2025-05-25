import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
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
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Doctor {
  id: number;
  name: string;
}

interface Patient {
  id: number;
  name: string;
}

interface RecordDetails {
  appointment_time?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  prescriptions?: string[];
  notes?: string;
  followup_date?: string;
  lab_type?: string;
  results?: string;
  [key: string]: string | number | string[] | Record<string, string | number> | undefined;
}

interface Prescription {
  id: number;
  patient_id: number;
  record_id: number;
  doctor_id: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescription_date: string;
  reference_number: string;
  status: string;
}

interface MedicalRecord {
  id: number;
  patient: Patient;
  assignedDoctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | RecordDetails;
  created_at: string;
  updated_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface MedicalRecordsProps {
  user: User;
  medicalRecords: {
    data: MedicalRecord[];
    links: PaginationLink[];
    total: number;
  };
}

export default function MedicalRecords({ user, medicalRecords }: MedicalRecordsProps) {
  const [prescriptions, setPrescriptions] = useState<{ [key: number]: Prescription[] }>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  // Filter out cancelled records
  const filteredRecords = medicalRecords.data.filter(record =>
    record.status.toLowerCase() !== 'cancelled'
  );

  const handleDownloadPrescription = async (recordId: number) => {
    try {
      setLoading({ ...loading, [recordId]: true });

      // Check if we already have the prescriptions for this record
      if (!prescriptions[recordId]) {
        // Fetch prescriptions for this record
        const response = await axios.get(route('doctor.prescriptions.record', recordId));
        setPrescriptions({ ...prescriptions, [recordId]: response.data });
      }

      const recordPrescriptions = prescriptions[recordId] || [];

      if (recordPrescriptions.length > 0) {
        // If we have prescriptions, download the first one
        window.open(route('doctor.prescriptions.download', recordPrescriptions[0].id), '_blank');
      } else {
        alert('No prescriptions found for this record');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      alert('Failed to download prescription');
    } finally {
      setLoading({ ...loading, [recordId]: false });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-600 text-white">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRecordTypeDisplay = (recordType: string): string => {
    switch (recordType.toLowerCase()) {
      case 'medical_checkup':
        return 'Medical Checkup';
      case 'medical_record':
        return 'General Record';
      case 'prescription':
        return 'Prescription';
      case 'laboratory':
        return 'Lab Test';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const getDetailsValue = (record: MedicalRecord, key: string): string => {
    let details: RecordDetails;

    if (typeof record.details === 'string') {
      try {
        details = JSON.parse(record.details) as RecordDetails;
      } catch {
        return 'N/A';
      }
    } else {
      details = record.details;
    }

    // Return either diagnosis or lab_type based on record type
    if (key === 'info') {
      if (record.record_type === 'laboratory') {
        return details?.lab_type || 'N/A';
      } else {
        return details?.diagnosis || 'N/A';
      }
    }

    return 'N/A';
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Head title="My Patients' Medical Records" />
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar user={user} />
        <div className="flex-1">
          <Header user={user} />
          <main className="p-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-2xl font-bold">My Patients' Medical Records</CardTitle>
                  <CardDescription>
                    View and manage medical records for your patients
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button className="inline-flex items-center" asChild>
                    <Link href={route('doctor.records.create')}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Record
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Record Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Diagnosis/Info</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.patient?.name || "Unknown"}
                            </TableCell>
                            <TableCell>
                              {getRecordTypeDisplay(record.record_type)}
                            </TableCell>
                            <TableCell>
                              {formatDate(record.appointment_date)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {getDetailsValue(record, 'info')}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(record.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link
                                    href={route('doctor.clinical.info.show', record.id)}
                                    className="inline-flex items-center"
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                {record.record_type === 'prescription' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadPrescription(record.id)}
                                    disabled={loading[record.id]}
                                    className="inline-flex items-center"
                                  >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                    Rx
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No medical records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {medicalRecords.links && medicalRecords.links.length > 3 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    {medicalRecords.links.map((link, i) => {
                      if (link.url === null) {
                        return (
                          <span
                            key={i}
                            className="px-4 py-2 text-sm text-gray-500 border rounded"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        );
                      }

                      return (
                        <Link
                          key={i}
                          href={link.url}
                          className={`px-4 py-2 text-sm border rounded ${
                            link.active
                              ? 'bg-primary text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
