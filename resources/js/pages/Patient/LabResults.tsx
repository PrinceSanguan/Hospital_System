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
import {
  ClipboardList,
  ChevronRight
} from 'lucide-react';
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
  specialty?: string;
}

interface LabTestResult {
  value: string | number;
  range?: string;
  status?: string;
}

interface LabRecord {
  id: string;
  patient_id: number;
  assigned_doctor_id?: number;
  assigned_doctor?: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string;
  created_at: string;
  updated_at: string;
  is_file?: boolean;
}

interface PaginatedLabRecords {
  data: LabRecord[];
  links: Record<string, unknown>;
  meta: Record<string, unknown>;
}

// Function to parse details
const parseDetails = (details: string | null): Record<string, unknown> | null => {
  if (!details) return null;
  try {
    return typeof details === 'object' ? details : JSON.parse(details);
  } catch (e) {
    console.error('Error parsing details:', e);
    return null;
  }
};

export default function LabResults({ user, labRecords }: { user: User, labRecords: PaginatedLabRecords }) {
  return (
    <PatientLayout user={user}>
      <Head title="Laboratory Results" />
      <div className="container mx-auto p-6">
        <Card className="w-full mx-auto">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle>Laboratory Results</CardTitle>
            </div>
            <CardDescription>
              View your laboratory test results
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {labRecords.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labRecords.data.map((record) => {
                    const details = parseDetails(record.details);
                    const isFileRecord = record.is_file || false;
                    const labType = details?.lab_type || 'Laboratory Test';
                    const doctorName = record.assigned_doctor?.name || 'Self-requested';

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(parseISO(record.appointment_date || record.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{labType}</div>
                          {details?.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{details.notes as string}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isFileRecord ?
                            <Badge className="bg-green-100 text-green-800 border border-green-200">
                              File uploaded
                            </Badge>
                          : record.status.toLowerCase() === 'completed' ?
                            <Badge className="bg-green-100 text-green-800 border border-green-200">
                              Completed
                            </Badge>
                          : <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                              {record.status || 'Pending'}
                            </Badge>}
                        </TableCell>
                        <TableCell>{doctorName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isFileRecord ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/patient/lab-results/${record.id}/download`, '_blank')}
                                className="flex items-center gap-1"
                              >
                                Download
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={`/patient/records/lab-results/${record.id}`} className="flex items-center gap-1">
                                  <span>View</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">No laboratory results found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
