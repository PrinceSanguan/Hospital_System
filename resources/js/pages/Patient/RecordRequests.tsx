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
import { FileText, Plus, Calendar, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface User {
  name: string;
  email: string;
  role: string;
}

interface RecordRequest {
  id: number;
  patient_id: number;
  record_type: string;
  record_id: number;
  request_reason: string;
  status: string;
  approved_by: number | null;
  approved_at: string | null;
  denied_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  approver?: {
    id: number;
    name: string;
  };
}

interface RecordRequestsProps {
  user: User;
  requests: RecordRequest[];
}

export default function RecordRequests({ user, requests }: RecordRequestsProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRecordTypeDisplay = (recordType: string): string => {
    switch (recordType.toLowerCase()) {
      case 'medical_record':
        return 'Medical Record';
      case 'lab_record':
        return 'Laboratory Record';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    try {
      return new Date(expiresAt) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <PatientLayout user={user}>
      <Head title="Record Requests" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Record Access Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Request and view access to your medical and laboratory records
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
                <Link href={route('patient.records.requests.create', { type: 'medical_record' })}>
                  <Plus className="h-4 w-4" />
                  Request Record Access
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Record Requests
              </CardTitle>
              <CardDescription>
                All your record access requests and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <caption className="mt-4 text-sm text-muted-foreground">
                  A list of your record access requests
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Record Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved/Denied By</TableHead>
                    <TableHead>Response Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell className="font-medium">{getRecordTypeDisplay(request.record_type)}</TableCell>
                        <TableCell>
                          {isExpired(request.expires_at) && request.status === 'approved' ? (
                            <Badge variant="outline" className="text-gray-500 border-gray-500">Expired</Badge>
                          ) : (
                            getStatusBadge(request.status)
                          )}
                        </TableCell>
                        <TableCell>
                          {request.approver ? request.approver.name : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(request.approved_at)}</TableCell>
                        <TableCell className="text-right">
                          {request.status === 'approved' && !isExpired(request.expires_at) && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="ml-2"
                            >
                              <Link href={route('patient.records.requests.view', request.id)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View Record
                              </Link>
                            </Button>
                          )}
                          {request.status === 'denied' && request.denied_reason && (
                            <span className="text-sm text-red-600">{request.denied_reason}</span>
                          )}
                          {request.status === 'pending' && (
                            <span className="text-sm text-yellow-600">Awaiting approval</span>
                          )}
                          {isExpired(request.expires_at) && request.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="ml-2"
                            >
                              <Link href={route('patient.records.requests.create', {
                                type: request.record_type,
                                record_id: request.record_id
                              })}>
                                <Calendar className="h-4 w-4 mr-1" />
                                Renew Access
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No record requests found. Create one to request access.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
}
