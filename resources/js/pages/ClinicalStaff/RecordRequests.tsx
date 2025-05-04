import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Search,
  UserRound,
  XCircle,
  Database
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
}

interface RecordRequest {
  id: number;
  patient: Patient;
  record_type: string;
  record_id: number;
  request_reason: string;
  status: string;
  approver?: Staff;
  approved_at?: string;
  denied_reason?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface RecordRequestsProps {
  user: User;
  requests: {
    data: RecordRequest[];
    links: PaginationLink[];
    total: number;
  };
  pendingCount: number;
  requestType?: string;
  title?: string;
}

export default function RecordRequests({ user, requests, pendingCount, requestType, title = "Record Requests" }: RecordRequestsProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRecordTypeDisplay = (recordType: string): string => {
    switch (recordType.toLowerCase()) {
      case 'medical_record':
        return 'Medical Record';
      case 'lab_record':
        return 'Lab Record/Result';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
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
          <Head title={title} />

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage patient record access requests
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="gap-1">
                  <Link href={route('staff.record-requests.pending')}>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="hidden sm:inline">Pending Requests</span>
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                    )}
                  </Link>
                </Button>
                {!requestType && (
                  <>
                    <Button asChild variant="outline" className="gap-1">
                      <Link href={route('staff.record-requests.medical')}>
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="hidden sm:inline">Medical Requests</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-1">
                      <Link href={route('staff.record-requests.lab')}>
                        <Database className="h-4 w-4 text-green-500" />
                        <span className="hidden sm:inline">Lab Requests</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Record Requests</CardTitle>
                <CardDescription>
                  Patients' requests to access their medical records and lab results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Record Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.data.length > 0 ? (
                      requests.data.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{formatDate(request.created_at)}</TableCell>
                          <TableCell className="font-medium flex items-center gap-1">
                            <UserRound className="h-4 w-4 text-gray-400" />
                            {request.patient.name}
                          </TableCell>
                          <TableCell>{getRecordTypeDisplay(request.record_type)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {request.request_reason.substring(0, 50)}
                            {request.request_reason.length > 50 ? '...' : ''}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={route('staff.record-requests.show', request.id)}>
                                <Search className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No record requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {requests.links && requests.links.length > 3 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {requests.links.map((link, i) => (
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
        </main>
      </div>
    </div>
  );
}
