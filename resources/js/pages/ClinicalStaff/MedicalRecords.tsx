import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Plus, FileEdit, FileSearch, Trash, X } from 'lucide-react';
import { format } from 'date-fns';

interface User {
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
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  const confirmDelete = (id: number) => {
    setRecordToDelete(id);
    setDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setRecordToDelete(null);
    setDeleteDialog(false);
  };

  const handleDelete = () => {
    if (recordToDelete) {
      window.location.href = route('staff.clinical.info.destroy', recordToDelete);
    }
    closeDeleteDialog();
  };

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
        return 'General Record';
      case 'prescription':
        return 'Prescription';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const getDiagnosis = (details: string | MedicalRecordDetails): string => {
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details) as MedicalRecordDetails;
      } catch {
        return 'N/A';
      }
    }

    return details?.diagnosis || 'N/A';
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
          <Head title="Medical Records" />

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Records</h1>
              <Button asChild className="flex items-center gap-1">
                <Link href={route('staff.clinical.info.create')}>
                  <Plus className="h-4 w-4" />
                  Add New Medical Record
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Medical Records</CardTitle>
                <CardDescription>
                  View and manage all patient medical records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <caption className="mt-4 text-sm text-muted-foreground">
                    A list of medical records
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Record Type</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicalRecords.data.length > 0 ? (
                      medicalRecords.data.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.appointment_date)}</TableCell>
                          <TableCell className="font-medium">{record.patient?.name || 'Unknown Patient'}</TableCell>
                          <TableCell>{getRecordTypeDisplay(record.record_type)}</TableCell>
                          <TableCell className="max-w-xs truncate">{getDiagnosis(record.details)}</TableCell>
                          <TableCell>{record.assignedDoctor?.name || 'Unassigned'}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={route('staff.clinical.info.show', record.id)}>
                                  <FileSearch className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={route('staff.clinical.info.edit', record.id)}>
                                  <FileEdit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(record.id)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No medical records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {medicalRecords.links && medicalRecords.links.length > 3 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {medicalRecords.links.map((link, i) => (
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

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              <p className="py-4">Are you sure you want to delete this medical record? This action cannot be undone.</p>
              <DialogFooter>
                <Button variant="outline" onClick={closeDeleteDialog}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
