import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  ChevronLeft,
  UserRound,
  XCircle,
  Eye
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import ConfirmationModal from '@/components/ConfirmationModal';

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

interface Doctor {
  id: number;
  name: string;
  email?: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
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

interface PatientRecord {
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

interface RecordRequestDetailProps {
  user: User;
  request: RecordRequest;
  record: PatientRecord;
}

export default function RecordRequestDetail({ user, request, record }: RecordRequestDetailProps) {
  const [approveDialog, setApproveDialog] = useState(false);
  const [denyDialog, setDenyDialog] = useState(false);
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false);
  const [showDenyConfirmation, setShowDenyConfirmation] = useState(false);

  const { data: approveData, setData: setApproveData, post: postApprove, processing: approveProcessing } = useForm({
    expires_at: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  });

  const { data: denyData, setData: setDenyData, post: postDeny, processing: denyProcessing } = useForm({
    denied_reason: ''
  });

  const prepareApprove = () => {
    setApproveDialog(false);
    setShowApproveConfirmation(true);
  };

  const prepareDeny = () => {
    setDenyDialog(false);
    setShowDenyConfirmation(true);
  };

  const handleApprove = () => {
    postApprove(route('staff.record-requests.approve', request.id));
    setShowApproveConfirmation(false);
  };

  const handleDeny = () => {
    postDeny(route('staff.record-requests.deny', request.id));
    setShowDenyConfirmation(false);
  };

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
      case 'medical_checkup':
        return 'Medical Checkup';
      case 'lab_record':
        return 'Laboratory Record/Result';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
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

  const recordDetails = parseDetails();

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
          <Head title="Record Request Details" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild className="p-0">
                <Link href={route('staff.record-requests.index')}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Record Request Details
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request Information */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <div className="mt-1">{getStatusBadge(request.status)}</div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Request Date</h3>
                    <p className="mt-1">{formatDateTime(request.created_at)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient</h3>
                    <p className="mt-1 flex items-center gap-1">
                      <UserRound className="h-4 w-4 text-gray-400" />
                      {request.patient.name}
                    </p>
                    <p className="text-sm text-gray-500">{request.patient.email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Record Type</h3>
                    <p className="mt-1">{getRecordTypeDisplay(request.record_type)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Request Reason</h3>
                    <p className="mt-1 whitespace-pre-wrap">{request.request_reason}</p>
                  </div>

                  {request.status === 'approved' && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved By</h3>
                        <p className="mt-1">{request.approver?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved On</h3>
                        <p className="mt-1">{formatDateTime(request.approved_at)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires On</h3>
                        <p className="mt-1">{request.expires_at ? formatDate(request.expires_at) : 'Never'}</p>
                      </div>
                    </>
                  )}

                  {request.status === 'denied' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Denial Reason</h3>
                      <p className="mt-1 whitespace-pre-wrap">{request.denied_reason}</p>
                    </div>
                  )}
                </CardContent>
                {request.status === 'pending' && (
                  <CardFooter className="flex gap-2">
                    <Button onClick={() => setApproveDialog(true)} className="flex-1 gap-1">
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button variant="outline" onClick={() => setDenyDialog(true)} className="flex-1 gap-1 text-red-500 hover:text-red-600">
                      <XCircle className="h-4 w-4" /> Deny
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Record Preview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Record Preview
                  </CardTitle>
                  <CardDescription>
                    The record that the patient is requesting access to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Record Type</h3>
                        <p className="mt-1">{getRecordTypeDisplay(record.record_type)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created On</h3>
                        <p className="mt-1">{formatDate(record.created_at)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient</h3>
                        <p className="mt-1">{record.patient?.name || 'Unknown Patient'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Doctor</h3>
                        <p className="mt-1">Dr. {record.assignedDoctor?.name || 'Unassigned'}</p>
                      </div>
                    </div>

                    <Separator />

                    {request.record_type.includes('medical') && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Diagnosis</h3>
                          <p className="mt-1 whitespace-pre-wrap">{recordDetails.diagnosis || 'No diagnosis provided'}</p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vital Signs</h3>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500">Temperature:</span>
                              <p>{recordDetails.vital_signs?.temperature || 'N/A'} °C</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Blood Pressure:</span>
                              <p>{recordDetails.vital_signs?.blood_pressure || 'N/A'} mmHg</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Pulse Rate:</span>
                              <p>{recordDetails.vital_signs?.pulse_rate || 'N/A'} bpm</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Oxygen Saturation:</span>
                              <p>{recordDetails.vital_signs?.oxygen_saturation || 'N/A'} %</p>
                            </div>
                          </div>
                        </div>

                        <Separator />
                      </>
                    )}

                    {request.record_type === 'lab_record' && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lab Results</h3>
                        <p className="mt-1 whitespace-pre-wrap">{recordDetails.results || 'No lab results available'}</p>
                      </div>
                    )}

                    <Button asChild variant="outline" className="w-full flex items-center gap-2">
                      <Link href={
                        request.record_type === 'lab_record'
                          ? route('staff.lab.records.show', record.id)
                          : route('staff.clinical.info.show', record.id)
                      }>
                        <Eye className="h-4 w-4" />
                        View Full Record
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Approve Dialog */}
          <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Record Request</DialogTitle>
                <DialogDescription>
                  This will grant the patient access to view and print their requested record.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="expires_at" className="block text-sm font-medium">
                    Access Expiration Date (Optional)
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Set a date when access will expire. Leave empty for permanent access.
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="expires_at"
                      type="date"
                      value={approveData.expires_at}
                      onChange={(e) => setApproveData('expires_at', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={prepareApprove} disabled={approveProcessing} className="gap-1">
                  <CheckCircle className="h-4 w-4" /> Approve Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deny Dialog */}
          <Dialog open={denyDialog} onOpenChange={setDenyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deny Record Request</DialogTitle>
                <DialogDescription>
                  Please provide a reason for denying this record access request.
                </DialogDescription>
              </DialogHeader>
              <div>
                <label htmlFor="denied_reason" className="block text-sm font-medium">
                  Denial Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="denied_reason"
                  value={denyData.denied_reason}
                  onChange={(e) => setDenyData('denied_reason', e.target.value)}
                  placeholder="Enter the reason for denying this request"
                  rows={4}
                  className="mt-1"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDenyDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={prepareDeny}
                  disabled={denyProcessing || !denyData.denied_reason}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" /> Deny Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirmation Modals */}
          <ConfirmationModal
            isOpen={showApproveConfirmation}
            onClose={() => setShowApproveConfirmation(false)}
            onConfirm={handleApprove}
            title="Are you sure you want to approve this request?"
            actionType="approve"
          />

          <ConfirmationModal
            isOpen={showDenyConfirmation}
            onClose={() => setShowDenyConfirmation(false)}
            onConfirm={handleDeny}
            title="Are you sure you want to reject this appointment?"
            actionType="reject"
          />
        </main>
      </div>
    </div>
  );
}
