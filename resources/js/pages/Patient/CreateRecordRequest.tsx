import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronLeft, FileText, InfoIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface Doctor {
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

interface PatientRecord {
  id: number;
  assignedDoctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | MedicalRecordDetails;
  created_at: string;
  updated_at: string;
}

interface CreateRecordRequestProps {
  user: User;
  medicalRecords: PatientRecord[];
  labRecords: PatientRecord[];
  initialRecordType?: string;
}

export default function CreateRecordRequest({ user, medicalRecords, labRecords, initialRecordType = 'medical_record' }: CreateRecordRequestProps) {
  const { data, setData, post, processing, errors } = useForm({
    record_type: initialRecordType,
    record_id: '',
    request_reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('patient.records.requests.store'));
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

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const recordsToShow = data.record_type === 'lab_record' ? labRecords : medicalRecords;

  // Function to get a summary of the record for display
  const getRecordSummary = (record: PatientRecord): string => {
    let summary = `${getRecordTypeDisplay(record.record_type)} - ${formatDate(record.appointment_date)}`;

    // Add doctor name if available
    if (record.assignedDoctor?.name) {
      summary += ` - Dr. ${record.assignedDoctor.name}`;
    }

    // Try to add diagnosis for medical records
    if (record.record_type.includes('medical')) {
      const details = typeof record.details === 'string'
        ? JSON.parse(record.details) as MedicalRecordDetails
        : record.details;

      if (details?.diagnosis) {
        const diagnosisExcerpt = details.diagnosis.substring(0, 30);
        summary += ` - ${diagnosisExcerpt}${details.diagnosis.length > 30 ? '...' : ''}`;
      }
    }

    return summary;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head title="Request Record Access" />

      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild className="p-0">
            <Link href={route('patient.records.requests.index')}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Request Record Access
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Form
            </CardTitle>
            <CardDescription>
              Fill out this form to request access to view and print your medical records.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="record_type">Record Type <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => {
                    setData('record_type', value);
                    setData('record_id', ''); // Reset the record selection
                  }}
                  value={data.record_type}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select record type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical_record">Medical Records</SelectItem>
                    <SelectItem value="lab_record">Laboratory Records</SelectItem>
                  </SelectContent>
                </Select>
                {errors.record_type && (
                  <p className="text-sm text-red-500">{errors.record_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="record_id">Select Record <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => setData('record_id', value)}
                  value={data.record_id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a record" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordsToShow.length > 0 ? (
                      recordsToShow.map((record) => (
                        <SelectItem key={record.id} value={record.id.toString()}>
                          {getRecordSummary(record)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No records available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.record_id && (
                  <p className="text-sm text-red-500">{errors.record_id}</p>
                )}
                {recordsToShow.length === 0 && (
                  <div className="flex items-start gap-2 mt-2 text-orange-600 text-sm">
                    <InfoIcon className="h-4 w-4 mt-0.5" />
                    <p>You don't have any {data.record_type === 'lab_record' ? 'laboratory' : 'medical'} records available.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="request_reason">
                  Reason for Request <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="request_reason"
                  placeholder="Please explain why you need access to this record"
                  value={data.request_reason}
                  onChange={(e) => setData('request_reason', e.target.value)}
                  rows={4}
                />
                {errors.request_reason && (
                  <p className="text-sm text-red-500">{errors.request_reason}</p>
                )}
                <p className="text-xs text-gray-500">
                  Your request will be reviewed by our clinical staff. Please provide a clear reason for your request.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing || !data.record_id || !data.request_reason}
              >
                Submit Request
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
