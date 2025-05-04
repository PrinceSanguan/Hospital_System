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
import { Badge } from '@/components/ui/badge';
import { FileText, FileSearch, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
}

interface LabDetails {
  lab_type: string;
  appointment_time?: string;
  notes?: string;
  instructions?: string;
  results?: string;
  result_date?: string;
  [key: string]: string | undefined;
}

interface LabRecord {
  id: number;
  patient_id: number;
  assigned_doctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | LabDetails;
  created_at: string;
  updated_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface LabResultsProps {
  user: User;
  labRecords: {
    data: LabRecord[];
    links: PaginationLink[];
    total: number;
    current_page: number;
    last_page: number;
  };
}

export default function LabResults({ user, labRecords }: LabResultsProps) {
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

  const getLabType = (details: string | LabDetails): string => {
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details) as LabDetails;
      } catch {
        return 'N/A';
      }
    }

    return details?.lab_type || 'N/A';
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <PatientLayout user={user}>
      <Head title="Laboratory Results" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Laboratory Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View all your laboratory test results and appointments
              </p>
            </div>
            <Button asChild className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Link href={route('patient.lab-appointments.book')}>
                <Plus className="h-4 w-4" />
                Book Lab Test
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Laboratory Records
              </CardTitle>
              <CardDescription>
                All your laboratory appointments and test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <caption className="mt-4 text-sm text-muted-foreground">
                  A list of your laboratory records
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labRecords.data.length > 0 ? (
                    labRecords.data.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.appointment_date)}</TableCell>
                        <TableCell className="font-medium">{getLabType(record.details)}</TableCell>
                        <TableCell>Dr. {record.assigned_doctor.name}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={route('patient.records.lab-results.show', record.id)}>
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
                        No laboratory records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {labRecords.last_page > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {labRecords.links.map((link, i) => (
                    <Button
                      key={i}
                      variant={link.active ? "default" : "outline"}
                      disabled={!link.url}
                      asChild={!!link.url}
                    >
                      {link.url ? (
                        <Link href={link.url}>{link.label}</Link>
                      ) : (
                        <span>{link.label}</span>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
}
