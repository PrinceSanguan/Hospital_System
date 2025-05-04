import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface User {
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
}

interface MedicalRecordDetails {
  appointment_time?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  prescriptions?: string[];
  notes?: string;
  followup_date?: string;
  treatments?: string;
  lab_type?: string;
  result_date?: string;
  results?: Record<string, {value: string|number, status?: string, range?: string}>;
  instructions?: string;
  [key: string]: string | number | string[] | Record<string, string | number | {value: string|number, status?: string, range?: string}> | undefined;
}

interface MedicalRecord {
  id: number;
  patient_id: number;
  assignedDoctor: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | MedicalRecordDetails;
  created_at: string;
  updated_at: string;
}

interface RecordDetailsProps {
  user: User;
  record: MedicalRecord;
}

export default function RecordDetails({ user, record }: RecordDetailsProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
        return 'General Medical Record';
      case 'prescription':
        return 'Prescription';
      case 'laboratory':
        return 'Laboratory Results';
      default:
        return recordType.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '';
    return timeString;
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

  const details = parseDetails();

  const handlePrint = () => {
    // Only allow printing for medical records, not lab records
    if (record.record_type?.toLowerCase() === 'laboratory') {
      alert("Printing is only available for medical records, not laboratory results.");
      return;
    }

    setIsPrinting(true);
    // Add a small delay to allow the print styles to apply
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrinting(false);
        setShowPrintPreview(false); // Close preview after printing
      }, 500);
    }, 300);
  };

  const togglePrintPreview = () => {
    if (record.record_type?.toLowerCase() === 'laboratory') {
      alert("Printing is only available for medical records, not laboratory results.");
      return;
    }
    setShowPrintPreview(!showPrintPreview);
  };

  // Determine if this is a lab record
  const isLabRecord = record.record_type?.toLowerCase() === 'laboratory';

  return (
    <PatientLayout user={user}>
      <div className={`bg-gray-100 dark:bg-gray-900 ${(isPrinting || showPrintPreview) ? 'print:bg-white print:h-auto' : ''}`}>
        <Head title={`Medical Record - ${formatDate(record.appointment_date)}`} />

        {/* Print-specific styles */}
        <style type="text/css" media="print">{`
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: 'Arial', sans-serif;
            color: #000;
            background-color: white !important;
            margin: 0;
            padding: 0;
          }
          .print-watermark {
            display: block;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 5em;
            color: rgba(200, 200, 200, 0.2);
            z-index: 1000;
            pointer-events: none;
          }
          .print-header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
          }
          .print-footer {
            border-top: 1px solid #ddd;
            padding-top: 1rem;
            margin-top: 1rem;
            font-size: 0.75rem;
          }
          .print-page-break {
            page-break-after: always;
          }
          /* Hide all UI elements not needed for printing */
          .no-print {
            display: none !important;
          }
        `}</style>

        {/* Standalone print-only header */}
        <div className="hidden print:block print:w-full print:mb-4">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Logo with text fallback */}
              <div className="h-16 w-16 bg-blue-600 text-white flex items-center justify-center rounded-md font-bold text-xl">
                CH
              </div>
              <div>
                <h1 className="text-2xl font-bold">Choros Health</h1>
                <p className="text-sm text-gray-600">Medical Center & Healthcare System</p>
                <p className="text-xs text-gray-500">123 Healthcare Avenue • Medical City • Phone: (555) 123-4567</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">OFFICIAL MEDICAL RECORD</p>
              <p className="text-sm text-gray-600">Record ID: #{record.id}</p>
              <p className="text-xs text-gray-500">Date Issued: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="hidden print:block print-watermark">
          CONFIDENTIAL
        </div>

        <main className="container mx-auto py-6 px-4 md:px-6 print:bg-white print:p-0 print:m-0 print:dark:bg-white print:overflow-visible">
          {/* Header Actions - hide when printing */}
          <div className={`flex justify-between items-center mb-6 ${showPrintPreview ? 'opacity-30' : ''} no-print`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="p-0">
                  <Link href={isLabRecord ? route('patient.records.lab-results') : route('patient.records.index')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isLabRecord ? 'Laboratory Results' : 'Medical Record'}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Viewing your {isLabRecord ? 'lab results' : 'medical record'} from {formatDate(record.appointment_date)}
              </p>
            </div>
            <div className="flex gap-2">
              {!isLabRecord && (
                <>
                  <Button
                    variant={showPrintPreview ? "default" : "outline"}
                    onClick={togglePrintPreview}
                    className="flex items-center gap-1"
                  >
                    {showPrintPreview ? "Exit Preview" : "Print Preview"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex items-center gap-1"
                    disabled={isLabRecord}
                  >
                    <Printer className="h-4 w-4" />
                    Print Medical Record
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Preview Message */}
          {showPrintPreview && !isPrinting && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md mb-6 no-print">
              <h3 className="font-semibold text-lg">Print Preview Mode</h3>
              <p className="mb-2">This shows how your medical record will look when printed. The sidebar and navigation will be hidden in the final print.</p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="default"
                  onClick={handlePrint}
                  className="flex items-center gap-1"
                >
                  <Printer className="h-4 w-4" />
                  Print Now
                </Button>
                <Button
                  variant="outline"
                  onClick={togglePrintPreview}
                >
                  Exit Preview
                </Button>
              </div>
            </div>
          )}

          {/* Print-only message at top of printed page */}
          <div className="hidden print:block print:mb-4 print:mt-2 print:text-center print:text-sm print:text-gray-500">
            This is an official medical record printed from Choros Health System on {new Date().toLocaleDateString()}.
            For verification, contact Medical Records Department at (555) 123-4567.
          </div>

          {/* Medical Record Card */}
          <Card className={`border-t-4 ${isLabRecord ? 'border-t-purple-500' : 'border-t-blue-500'} print:shadow-none print:border-none print:border-t-0 print:mt-0 ${showPrintPreview ? 'shadow-xl' : ''}`}>
            {/* Header/Title - shows in print but hides when system print header is shown */}
            <div className="text-center py-8 border-b print:hidden">
              <div className="flex justify-center items-center gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{isLabRecord ? 'LABORATORY REPORT' : 'MEDICAL RECORD'}</h1>
                  <p className="text-gray-500">FarmCare Healthcare System</p>
                  <p className="text-sm text-gray-400">
                    Medical record information
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500">CONFIDENTIAL MEDICAL INFORMATION</p>
                <p className="text-xs text-gray-500">Reference #: {record.id}</p>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Record Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Record Type</h3>
                      <p className="font-medium">{getRecordTypeDisplay(record.record_type)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Status</h3>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
                    {isLabRecord && details.lab_type && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-500">Lab Test Type</h3>
                        <p className="font-medium">{String(details.lab_type)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Appointment Date</h3>
                      <p className="font-medium">{formatDate(record.appointment_date)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Appointment Time</h3>
                      <p className="font-medium">{formatTime(details.appointment_time)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Created On</h3>
                      <p className="font-medium">{formatDate(record.created_at)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Attending Physician</h3>
                      <p className="font-medium text-lg">Dr. {record.assignedDoctor?.name || 'Unassigned'}</p>
                    </div>
                    {!isLabRecord && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-500">Follow-up Date</h3>
                        <p className="font-medium">{formatDate(details.followup_date)}</p>
                      </div>
                    )}
                    {isLabRecord && details.result_date && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-500">Result Date</h3>
                        <p className="font-medium">{formatDate(String(details.result_date))}</p>
                      </div>
                    )}
                  </div>
                </div>

                {!isLabRecord && (
                  <>
                    <Separator />

                    {/* Vital Signs (for medical records) */}
                    {details.vital_signs && Object.keys(details.vital_signs).length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold mb-4">VITAL SIGNS</h2>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md grid grid-cols-2 md:grid-cols-5 gap-4">
                          {details.vital_signs.temperature && (
                            <div>
                              <h3 className="font-semibold text-sm text-gray-500">Temperature</h3>
                              <p className="font-medium">{details.vital_signs.temperature} °C</p>
                            </div>
                          )}
                          {details.vital_signs.blood_pressure && (
                            <div>
                              <h3 className="font-semibold text-sm text-gray-500">Blood Pressure</h3>
                              <p className="font-medium">{details.vital_signs.blood_pressure} mmHg</p>
                            </div>
                          )}
                          {details.vital_signs.pulse_rate && (
                            <div>
                              <h3 className="font-semibold text-sm text-gray-500">Pulse Rate</h3>
                              <p className="font-medium">{details.vital_signs.pulse_rate} bpm</p>
                            </div>
                          )}
                          {details.vital_signs.respiratory_rate && (
                            <div>
                              <h3 className="font-semibold text-sm text-gray-500">Respiratory Rate</h3>
                              <p className="font-medium">{details.vital_signs.respiratory_rate} bpm</p>
                            </div>
                          )}
                          {details.vital_signs.oxygen_saturation && (
                            <div>
                              <h3 className="font-semibold text-sm text-gray-500">Oxygen Saturation</h3>
                              <p className="font-medium">{details.vital_signs.oxygen_saturation} %</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Diagnosis and Treatment (for medical records) */}
                    <div>
                      <h2 className="text-xl font-bold mb-4">DIAGNOSIS & TREATMENT</h2>
                      <div className="space-y-4">
                        {details.diagnosis && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                            <h3 className="font-semibold text-sm text-gray-500 mb-2">Diagnosis</h3>
                            <p className="whitespace-pre-line">{details.diagnosis}</p>
                          </div>
                        )}

                        {details.prescriptions && details.prescriptions.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                            <h3 className="font-semibold text-sm text-gray-500 mb-2">Prescriptions</h3>
                            <ul className="list-disc list-inside">
                              {Array.isArray(details.prescriptions) ? (
                                details.prescriptions.map((prescription, index) => (
                                  <li key={index} className="mb-1">{prescription}</li>
                                ))
                              ) : (
                                <li>{String(details.prescriptions)}</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {details.treatments && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                            <h3 className="font-semibold text-sm text-gray-500 mb-2">Treatments</h3>
                            <p className="whitespace-pre-line">{String(details.treatments)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signature section - only visible in print for medical records */}
                    <div className="hidden print:block mt-10">
                      <Separator className="mb-6" />
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="font-semibold mb-6">Attending Physician:</p>
                          <div className="h-px-24 border-b border-dashed border-gray-400 w-3/4 mb-2"></div>
                          <p>Dr. {record.assignedDoctor?.name || 'Unassigned'}</p>
                          <p className="text-xs text-gray-500 mt-1">Physician Signature</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-6">Date Verified:</p>
                          <div className="h-px-24 border-b border-dashed border-gray-400 w-3/4 mb-2"></div>
                          <p className="text-xs text-gray-500 mt-1">Signature Date</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isLabRecord && details.results && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-xl font-bold mb-4">TEST RESULTS</h2>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Test</th>
                              <th className="text-left py-2 font-medium">Result</th>
                              <th className="text-left py-2 font-medium">Reference Range</th>
                              <th className="text-left py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(details.results || {}).map(([test, result]) => (
                              <tr key={test} className="border-b">
                                <td className="py-2 font-medium">{test}</td>
                                <td className="py-2">{result.value}</td>
                                <td className="py-2">{result.range || 'N/A'}</td>
                                <td className="py-2">
                                  <Badge className={
                                    result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                    result.status === 'abnormal' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }>
                                    {result.status || 'Not specified'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Notes */}
                <div>
                  <h2 className="text-xl font-bold mb-4">NOTES</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <p className="whitespace-pre-line">{details.notes || 'No additional notes'}</p>
                  </div>
                </div>

                {/* Instructions for lab records */}
                {isLabRecord && details.instructions && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-xl font-bold mb-4">INSTRUCTIONS</h2>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                        <p className="whitespace-pre-line">{String(details.instructions)}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer for print */}
                <div className="mt-10 text-center hidden print:block">
                  <Separator className="mb-6" />
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 mb-4">
                    <div>
                      <p>FarmCare Healthcare System</p>
                      <p>123 Medical Drive</p>
                      <p>Healthcare City, HC 12345</p>
                    </div>
                    <div>
                      <p>Patient ID: {record.patient_id}</p>
                      <p>Record ID: {record.id}</p>
                      <p>Record Type: {getRecordTypeDisplay(record.record_type)}</p>
                    </div>
                    <div>
                      <p>Printed on {new Date().toLocaleDateString()}</p>
                      <p>Generated at {new Date().toLocaleTimeString()}</p>
                      <p className="font-semibold">CONFIDENTIAL</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 border-t pt-4">This document contains confidential medical information and is intended only for the named patient.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </PatientLayout>
  );
}
