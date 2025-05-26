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

interface LabDetails {
  lab_type?: string;
  appointment_time?: string;
  notes?: string;
  instructions?: string;
  results?: string;
  [key: string]: string | undefined;
}

interface LabRecord {
  id: number;
  patient: Patient;
  assignedDoctor: Doctor;
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

interface LabRecordsProps {
  user: User;
  labRecords: {
    data: LabRecord[];
    links: PaginationLink[];
    total: number;
  };
}

export default function LabRecords({ user, labRecords }: LabRecordsProps) {
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
      window.location.href = route('staff.lab.records.destroy', recordToDelete);
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
          <Head title="Laboratory Records" />

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Laboratory Records</h1>
              <Button asChild className="flex items-center gap-1">
                <Link href={route('staff.lab.records.create')}>
                  <Plus className="h-4 w-4" />
                  Add New Lab Record
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Laboratory Records</CardTitle>
                <CardDescription>
                  View and manage all laboratory records and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <caption className="mt-4 text-sm text-muted-foreground">
                    A list of laboratory records
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Lab Type</TableHead>
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
                          <TableCell className="font-medium">{record.patient.name}</TableCell>
                          <TableCell>{getLabType(record.details)}</TableCell>
                          <TableCell>{record.assignedDoctor.name}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={route('staff.lab.records.show', record.id)}>
                                  <FileSearch className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={route('staff.lab.records.edit', record.id)}>
                                  <FileEdit className="h-4 w-4" />
                                </Link>
                              </Button>

                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No laboratory records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
              </DialogHeader>
              <p className="py-4">Are you sure you want to delete this laboratory record? This action cannot be undone.</p>
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
