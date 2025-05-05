import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft, Printer, FileEdit } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface User {
  name: string;
  email: string;
  role?: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
}

interface Patient {
  id: number;
  name: string;
  email?: string;
  address?: string;
}

interface PrescriptionDetails {
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  [key: string]: string | undefined;
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
  instructions?: string;
  results?: string;
  address?: string;
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
  vital_signs?: string | Record<string, string | number>;
  prescriptions?: string | string[];
  created_at: string;
  updated_at: string;
}

interface MedicalRecordsViewProps {
  user: User;
  record: MedicalRecord;
}

export default function MedicalRecordsView({ user, record }: MedicalRecordsViewProps) {
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
        return 'Laboratory Test';
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
    try {
      let parsedDetails: MedicalRecordDetails = {};

      // First, handle the details field
      if (typeof record.details === 'string') {
        try {
          parsedDetails = JSON.parse(record.details) as MedicalRecordDetails;
        } catch (e) {
          console.error("Failed to parse record details", e);
          parsedDetails = {};
        }
      } else if (record.details) {
        parsedDetails = record.details;
      }

      // Check if vital_signs exists in the record
      if (record.vital_signs) {
        try {
          // If vital_signs is a string, try to parse it
          if (typeof record.vital_signs === 'string') {
            parsedDetails.vital_signs = JSON.parse(record.vital_signs);
          } else {
            parsedDetails.vital_signs = record.vital_signs;
          }
        } catch (e) {
          console.error("Failed to parse vital signs", e);
        }
      }

      // Check if prescriptions exists in the record
      if (record.prescriptions) {
        try {
          // Handle prescriptions that might be stored as a string or array
          if (typeof record.prescriptions === 'string') {
            try {
              parsedDetails.prescriptions = JSON.parse(record.prescriptions);
            } catch {
              // If parsing fails, it's likely a single prescription stored as a string
              parsedDetails.prescriptions = [record.prescriptions];
            }
          } else if (Array.isArray(record.prescriptions)) {
            parsedDetails.prescriptions = record.prescriptions;
          }
        } catch (e) {
          console.error("Failed to parse prescriptions", e);
        }
      }

      return parsedDetails;
    } catch (e) {
      console.error("Error in parseDetails", e);
      return {};
    }
  };

  const details = parseDetails();

  // Helper function to safely parse prescriptions
  const parsePrescriptions = (): Array<PrescriptionDetails> => {
    if (!details.prescriptions) return [];

    // If prescriptions is already an array, process each item
    if (Array.isArray(details.prescriptions)) {
      return details.prescriptions.map(prescription => {
        if (typeof prescription === 'object' && prescription !== null) {
          return prescription as PrescriptionDetails;
        }
        // If it's a string, try to parse structured data or use as medication name
        if (typeof prescription === 'string') {
          // Check if it matches pattern like "medication - details"
          const match = prescription.match(/^(.+?)\s*-\s*(.+)$/);
          if (match) {
            return {
              medication: match[1].trim(),
              dosage: match[2].split(',')[0].trim(),
              frequency: match[2].includes('a Day') ? match[2].split(',').find(s => s.includes('a Day'))?.trim() : '',
              duration: match[2].includes('Days') ? match[2].split(',').find(s => s.includes('Days'))?.trim() : '',
              instructions: match[2].includes('Take after') ? match[2].split(',').find(s => s.includes('Take after'))?.trim() : ''
            };
          }
          return { medication: prescription };
        }
        return { medication: String(prescription) };
      });
    }

    // If it's a string, try to parse it as JSON
    if (typeof details.prescriptions === 'string') {
      try {
        const parsed = JSON.parse(details.prescriptions);
        if (Array.isArray(parsed)) {
          return parsed.map(item => {
            if (typeof item === 'object' && item !== null) {
              return item as PrescriptionDetails;
            }
            return { medication: String(item) };
          });
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Single prescription object
          return [parsed as PrescriptionDetails];
        }
        return [{ medication: details.prescriptions }];
      } catch {
        // If it can't be parsed as JSON, treat it as a single prescription
        return [{ medication: String(details.prescriptions) }];
      }
    }

    return [];
  };

  const prescriptionsList = parsePrescriptions();

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Helper function to safely extract value from potentially nested objects or strings
  const extractValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'object' && value !== null) {
      // If it's an object, try to get the value property
      const objValue = value as Record<string, unknown>;
      if (objValue.value !== undefined) {
        return String(objValue.value);
      }

      // Try using toString or fallback to JSON.stringify
      try {
        const result = value.toString();
        // Check if it's the default object toString result
        if (result !== '[object Object]') {
          return result;
        }
      } catch {
        // If toString throws, continue to JSON.stringify
      }

      return JSON.stringify(value);
    }

    return String(value);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - hide when printing */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - hide when printing */}
        <div className="print:hidden">
          <Header user={user} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900 print:bg-white print:p-0 print:dark:bg-white print:overflow-visible">
          <Head title={`Medical Record - ${record.patient?.name || 'Patient'}`} />

          {/* Print-specific styles - Improved for better print rendering */}
          <style type="text/css" media="print">{`
            @page {
              size: A4 portrait;
              margin: 0.8cm;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              background-color: white !important;
              font-family: 'Arial', sans-serif;
              color: black !important;
              font-size: 11pt;
            }

            /* Hide screen-only elements */
            .print\\:hidden {
              display: none !important;
            }

            /* Show print-only elements */
            .hidden.print\\:block {
              display: block !important;
            }

            /* Fix container width */
            .print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Heading and text styling */
            .print-heading {
              font-size: 14pt !important;
              font-weight: bold !important;
              margin-bottom: 1mm !important;
              text-transform: uppercase !important;
            }

            .print-subheading {
              font-size: 11pt !important;
              font-weight: bold !important;
              margin-top: 3mm !important;
              margin-bottom: 1mm !important;
              border-bottom: 1px solid #999 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }

            /* Prevent page breaks inside critical elements */
            .prevent-break-inside {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Headers and footers */
            .print-header {
              page-break-after: avoid !important;
              break-after: avoid !important;
              display: flex !important;
              justify-content: space-between !important;
              border-bottom: 2px solid #000 !important;
              padding-bottom: 3mm !important;
              margin-bottom: 5mm !important;
            }

            .print-footer {
              position: fixed !important;
              bottom: 5mm !important;
              width: 100% !important;
              font-size: 8pt !important;
              text-align: center !important;
              border-top: 1pt solid #ccc !important;
              padding-top: 2mm !important;
            }

            /* Grid layouts for print */
            .print-grid-2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 2mm !important;
              margin-bottom: 3mm !important;
            }

            .print-grid-3 {
              display: grid !important;
              grid-template-columns: 1fr 1fr 1fr !important;
              gap: 2mm !important;
              margin-bottom: 3mm !important;
            }

            /* Labels and values */
            .print-label {
              font-weight: bold !important;
              font-size: 8pt !important;
              color: #444 !important;
              margin-bottom: 0.5mm !important;
            }

            .print-value {
              font-size: 9pt !important;
              margin-bottom: 2mm !important;
            }

            /* Prescription items */
            .prescription-item {
              margin-bottom: 3mm !important;
              padding-bottom: 2mm !important;
              border-bottom: 1px dotted #ccc !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Signature section */
            .signature-section {
              margin-top: 10mm !important;
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 10mm !important;
            }

            .signature-line {
              border-bottom: 1px solid #000 !important;
              margin-top: 15mm !important;
              margin-bottom: 2mm !important;
              width: 80% !important;
            }

            /* Watermark */
            .watermark {
              position: fixed !important;
              top: 50% !important;
              left: 0 !important;
              width: 100% !important;
              text-align: center !important;
              transform: translateY(-50%) rotate(-45deg) !important;
              font-size: 60pt !important;
              color: rgba(220, 220, 220, 0.15) !important;
              z-index: -1 !important;
              pointer-events: none !important;
            }
          `}</style>

          {/* Header Actions - hide when printing */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="p-0">
                  <Link href={route('staff.clinical.info')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Medical Record
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Viewing medical record from {formatDate(record.appointment_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button asChild className="flex items-center gap-1">
                <Link href={route('staff.clinical.info.edit', record.id)}>
                  <FileEdit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>

          {/* Medical Record Card for screen display */}
          <Card className="border-t-4 border-t-blue-500 print:shadow-none print:border-none print:hidden">
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Patient & Record Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Patient Name</h3>
                      <p className="font-medium text-lg">{record.patient?.name || 'Unknown Patient'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Address</h3>
                      <p className="font-medium">{record.patient?.address || details.address || 'No address provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Record Type</h3>
                      <p className="font-medium">{getRecordTypeDisplay(record.record_type)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Status</h3>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
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
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Follow-up Date</h3>
                      <p className="font-medium">{formatDate(details.followup_date)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Vital Signs */}
                <div>
                  <h2 className="text-xl font-bold mb-4">VITAL SIGNS</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Temperature</h3>
                      <p className="font-medium">
                        {details.vital_signs?.temperature
                          ? `${extractValue(details.vital_signs.temperature)} °C`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Blood Pressure</h3>
                      <p className="font-medium">
                        {details.vital_signs?.blood_pressure
                          ? `${extractValue(details.vital_signs.blood_pressure)} mmHg`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Heart Rate</h3>
                      <p className="font-medium">
                        {details.vital_signs?.pulse_rate
                          ? `${extractValue(details.vital_signs.pulse_rate)} bpm`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">Respiratory Rate</h3>
                      <p className="font-medium">
                        {details.vital_signs?.respiratory_rate
                          ? `${extractValue(details.vital_signs.respiratory_rate)} /min`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-500">O₂ Saturation</h3>
                      <p className="font-medium">
                        {details.vital_signs?.oxygen_saturation
                          ? `${extractValue(details.vital_signs.oxygen_saturation)} %`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Diagnosis and Treatment */}
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    {record.record_type === 'laboratory' ? 'LAB TEST & RESULTS' : 'DIAGNOSIS & TREATMENT'}
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <h3 className="font-semibold text-sm text-gray-500 mb-2">
                        {record.record_type === 'laboratory' ? 'Lab Test Type' : 'Diagnosis'}
                      </h3>
                      <p className="whitespace-pre-line">
                        {record.record_type === 'laboratory'
                          ? (details.lab_type || 'No lab test type recorded')
                          : (details.diagnosis || 'No diagnosis recorded')}
                      </p>
                    </div>

                    {record.record_type === 'laboratory' ? (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                        <h3 className="font-semibold text-sm text-gray-500 mb-2">Lab Results</h3>
                        <p className="whitespace-pre-line">{details.results || 'No lab results recorded yet'}</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                          <h3 className="font-semibold text-sm text-gray-500 mb-2">Prescriptions</h3>
                          {prescriptionsList.length > 0 ? (
                            <div className="space-y-4">
                              {prescriptionsList.map((prescription, index) => (
                                <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 border-l-4 border-gray-400">
                                  <div className="flex items-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{prescription.medication}</h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {prescription.dosage && (
                                      <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Dosage: </span>
                                        <span className="font-medium">{prescription.dosage}</span>
                                      </div>
                                    )}
                                    {prescription.frequency && (
                                      <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Frequency: </span>
                                        <span className="font-medium">{prescription.frequency}</span>
                                      </div>
                                    )}
                                    {prescription.duration && (
                                      <div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Duration: </span>
                                        <span className="font-medium">{prescription.duration}</span>
                                      </div>
                                    )}
                                  </div>
                                  {prescription.instructions && (
                                    <div className="mt-2">
                                      <span className="text-sm text-gray-500 dark:text-gray-400">Instructions: </span>
                                      <span className="font-medium text-gray-700 dark:text-gray-300">{prescription.instructions}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No prescriptions</p>
                          )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                          <h3 className="font-semibold text-sm text-gray-500 mb-2">Treatments</h3>
                          <p className="whitespace-pre-line">{details.treatments || 'No treatment recorded'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div>
                  <h2 className="text-xl font-bold mb-4">NOTES</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    {details.notes ? (
                      <p className="whitespace-pre-line">{extractValue(details.notes)}</p>
                    ) : (
                      <p className="text-gray-500">No additional notes</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print-specific layout - only visible when printing */}
          <div className="hidden print:block" style={{ padding: '0', margin: '0' }}>
            {/* Watermark */}
            <div className="watermark">CONFIDENTIAL</div>

            {/* Document Header */}
            <div className="print-header" style={{ margin: '0 0 3mm 0', padding: '0 0 2mm 0' }}>
              <div style={{ width: '60%' }}>
                <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 1mm 0', lineHeight: '1.1', textTransform: 'uppercase' }}>ALLECARE HEALTH</h1>
                <p style={{ fontSize: '9pt', margin: '0 0 0.5mm 0', lineHeight: '1.2' }}>Medical Center & Healthcare System</p>
                <p style={{ fontSize: '9pt', margin: '0', lineHeight: '1.2' }}>123 Healthcare Avenue • Medical City • Phone: (555) 123-4567</p>
              </div>
              <div style={{ width: '40%', textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', margin: '0 0 1mm 0' }}>OFFICIAL MEDICAL RECORD</p>
                <p style={{ fontSize: '9pt', margin: '0 0 0.5mm 0', lineHeight: '1.2' }}>Record ID: #{record.id}</p>
                <p style={{ fontSize: '9pt', margin: '0', lineHeight: '1.2' }}>Date Issued: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Verification Text */}
            <p style={{ fontSize: '8pt', margin: '0 0 3mm 0', fontStyle: 'italic' }}>
              This is an official medical record printed from Allecare Health System. For verification, contact Medical Records Department at (555) 123-4567.
            </p>

            {/* Record Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm', marginBottom: '2mm' }} className="prevent-break-inside">
              <div>
                <div className="print-label">Patient</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{record.patient?.name || 'Unknown Patient'}</div>
              </div>
              <div>
                <div className="print-label">Record Type</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{getRecordTypeDisplay(record.record_type)}</div>
              </div>
              <div>
                <div className="print-label">Status</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{record.status}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2mm', marginBottom: '2mm' }} className="prevent-break-inside">
              <div>
                <div className="print-label">Address</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{record.patient?.address || details.address || 'No address provided'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm', marginBottom: '2mm' }} className="prevent-break-inside">
              <div>
                <div className="print-label">Appointment Date</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{formatDate(record.appointment_date)}</div>
              </div>
              <div>
                <div className="print-label">Appointment Time</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{formatTime(details.appointment_time) || 'N/A'}</div>
              </div>
              <div>
                <div className="print-label">Attending Physician</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>Dr. {record.assignedDoctor?.name || 'Unassigned'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm', marginBottom: '2mm' }} className="prevent-break-inside">
              <div>
                <div className="print-label">Follow-up Date</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{formatDate(details.followup_date) || 'N/A'}</div>
              </div>
              <div>
                <div className="print-label">Created On</div>
                <div className="print-value" style={{ marginBottom: '1mm' }}>{formatDate(record.created_at)}</div>
              </div>
              <div></div>
            </div>

            {/* Vital Signs Section */}
            <h2 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '2mm 0 1mm 0', padding: '0 0 0.5mm 0', borderBottom: '1px solid #999', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>VITAL SIGNS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm', marginBottom: '2mm' }} className="prevent-break-inside">
              <div>
                <div className="print-label" style={{ marginBottom: '0.5mm' }}>Temperature</div>
                <div className="print-value" style={{ fontSize: '9pt', marginBottom: '1mm' }}>
                  {details.vital_signs?.temperature
                    ? `${extractValue(details.vital_signs.temperature)} °C`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="print-label" style={{ marginBottom: '0.5mm' }}>Blood Pressure</div>
                <div className="print-value" style={{ fontSize: '9pt', marginBottom: '1mm' }}>
                  {details.vital_signs?.blood_pressure
                    ? `${extractValue(details.vital_signs.blood_pressure)} mmHg`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="print-label" style={{ marginBottom: '0.5mm' }}>Heart Rate</div>
                <div className="print-value" style={{ fontSize: '9pt', marginBottom: '1mm' }}>
                  {details.vital_signs?.pulse_rate
                    ? `${extractValue(details.vital_signs.pulse_rate)} bpm`
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm', marginBottom: '2mm' }} className="prevent-break-inside">
              <div>
                <div className="print-label" style={{ marginBottom: '0.5mm' }}>Respiratory Rate</div>
                <div className="print-value" style={{ fontSize: '9pt', marginBottom: '1mm' }}>
                  {details.vital_signs?.respiratory_rate
                    ? `${extractValue(details.vital_signs.respiratory_rate)} /min`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="print-label" style={{ marginBottom: '0.5mm' }}>O₂ Saturation</div>
                <div className="print-value" style={{ fontSize: '9pt', marginBottom: '1mm' }}>
                  {details.vital_signs?.oxygen_saturation
                    ? `${extractValue(details.vital_signs.oxygen_saturation)} %`
                    : 'N/A'}
                </div>
              </div>
              <div></div>
            </div>

            {/* Diagnosis Section */}
            <h2 className="print-subheading prevent-break-inside">
              {record.record_type === 'laboratory' ? 'LAB TEST & RESULTS' : 'DIAGNOSIS & TREATMENT'}
            </h2>

            <div className="prevent-break-inside">
              <div className="print-label">
                {record.record_type === 'laboratory' ? 'Lab Test Type' : 'Diagnosis'}
              </div>
              <div className="print-value" style={{ whiteSpace: 'pre-line' }}>
                {record.record_type === 'laboratory'
                  ? (details.lab_type || 'No lab test type recorded')
                  : (details.diagnosis || 'No diagnosis recorded')}
              </div>
            </div>

            {record.record_type === 'laboratory' ? (
              <div className="prevent-break-inside">
                <div className="print-label">Lab Results</div>
                <div className="print-value" style={{ whiteSpace: 'pre-line' }}>
                  {details.results || 'No lab results recorded yet'}
                </div>
              </div>
            ) : (
              <>
                {prescriptionsList.length > 0 && (
                  <div className="print-label prevent-break-inside" style={{ marginTop: '3mm' }}>
                    Prescriptions
                  </div>
                )}

                {prescriptionsList.map((prescription, index) => (
                  <div key={index} className="prescription-item prevent-break-inside">
                    <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '1mm' }}>
                      {prescription.medication} {prescription.dosage && `- ${prescription.dosage}`}
                    </div>
                    {prescription.frequency && (
                      <div style={{ marginLeft: '3mm', fontSize: '9pt', marginBottom: '1mm' }}>
                        Frequency: {prescription.frequency}
                      </div>
                    )}
                    {prescription.duration && (
                      <div style={{ marginLeft: '3mm', fontSize: '9pt', marginBottom: '1mm' }}>
                        Duration: {prescription.duration}
                      </div>
                    )}
                    {prescription.instructions && (
                      <div style={{ marginLeft: '3mm', fontSize: '9pt' }}>
                        Instructions: {prescription.instructions}
                      </div>
                    )}
                  </div>
                ))}

                {details.treatments && (
                  <div className="prevent-break-inside">
                    <div className="print-label" style={{ marginTop: '3mm' }}>Treatments</div>
                    <div className="print-value" style={{ whiteSpace: 'pre-line' }}>
                      {details.treatments}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Notes Section */}
            <h2 className="print-subheading prevent-break-inside">NOTES</h2>
            <div className="prevent-break-inside">
              <div className="print-value" style={{ whiteSpace: 'pre-line' }}>
                {details.notes ? extractValue(details.notes) : 'No additional notes'}
              </div>
            </div>

            {/* Signature Section */}
            <div className="signature-section prevent-break-inside">
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '3mm' }}>
                  Attending Physician:
                </div>
                <div className="signature-line"></div>
                <div>Dr. {record.assignedDoctor?.name || 'Unassigned'}</div>
                <div style={{ fontSize: '9pt', color: '#555', marginTop: '1mm' }}>
                  Physician Signature
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '3mm' }}>
                  Date Verified:
                </div>
                <div className="signature-line"></div>
                <div style={{ fontSize: '9pt', color: '#555', marginTop: '1mm' }}>
                  Signature Date
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div style={{ position: 'fixed', bottom: '2mm', left: 0, width: '100%', fontSize: '7pt', color: '#555', borderTop: '1px solid #ddd', paddingTop: '1mm', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
                <div style={{ width: '33%' }}>
                  <div style={{ lineHeight: '1.2' }}>Allecare Healthcare System</div>
                  <div style={{ lineHeight: '1.2' }}>123 Medical Drive</div>
                  <div style={{ lineHeight: '1.2' }}>Healthcare City, HC 12345</div>
                </div>
                <div style={{ width: '33%', textAlign: 'center' }}>
                  <div style={{ lineHeight: '1.2' }}>Patient ID: {record.patient?.id}</div>
                  <div style={{ lineHeight: '1.2' }}>Record ID: {record.id}</div>
                  <div style={{ lineHeight: '1.2' }}>Record Type: {getRecordTypeDisplay(record.record_type)}</div>
                </div>
                <div style={{ width: '33%', textAlign: 'right' }}>
                  <div style={{ lineHeight: '1.2' }}>Printed on {new Date().toLocaleDateString()}</div>
                  <div style={{ lineHeight: '1.2' }}>Generated at {new Date().toLocaleTimeString()}</div>
                  <div style={{ lineHeight: '1.2' }}>Page 1</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '7pt' }}>
                This document contains confidential medical information
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

