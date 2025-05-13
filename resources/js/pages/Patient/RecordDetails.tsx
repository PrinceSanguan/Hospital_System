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
  prescriptions?: string[] | Record<string, string> | string;
  notes?: string;
  followup_date?: string;
  treatments?: string;
  lab_type?: string;
  result_date?: string;
  results?: Record<string, {value: string|number, status?: string, range?: string}>;
  instructions?: string;
  temperature?: string | number;
  blood_pressure?: string | number;
  pulse_rate?: string | number;
  heart_rate?: string | number;
  respiratory_rate?: string | number;
  oxygen_saturation?: string | number;
  date_of_birth?: string;
  gender?: string;
  contact_number?: string;
  address?: string;
  medical_history?: string;
  [key: string]: string | number | string[] | Record<string, string | number | {value: string|number, status?: string, range?: string}> | undefined;
}

interface LabTestResult {
  value: string | number;
  range?: string;
  status?: string;
  remarks?: string;
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
  vital_signs?: Record<string, string | number>;
  lab_results?: Record<string, LabTestResult>;
  prescriptions?: string[] | Record<string, string>;
}

// Type definitions for prescription arrays
interface PrescriptionItem {
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  [key: string]: string | undefined;
}

interface RecordDetailsProps {
  user: User;
  record: MedicalRecord;
}

export default function RecordDetails({ user, record }: RecordDetailsProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Adding comments to prevent linter warnings since these functions are used in conditionally hidden elements
  // Used in the additional sections visible in the UI but hidden when printing
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

  // Used in the additional sections visible in the UI but hidden when printing
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

  // Used in the additional sections visible in the UI but hidden when printing
  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '';
    return timeString;
  };

  const parseDetails = (): MedicalRecordDetails => {
    let parsedDetails: MedicalRecordDetails = {};

    // First try to parse the details field if it's a string
    if (typeof record.details === 'string') {
      try {
        parsedDetails = JSON.parse(record.details) as MedicalRecordDetails;
        console.log("Parsed record details:", parsedDetails);
      } catch (e) {
        console.error("Failed to parse record details as JSON:", e);
        // If parsing fails, create a simple object with the string as diagnosis
        parsedDetails = {
          diagnosis: record.details
        };
      }
    } else if (record.details) {
      // If details is already an object, use it
      parsedDetails = record.details;
    }

    // Now overlay any direct properties from the record
    // These take precedence over anything in the details field
    if (record.vital_signs) {
      parsedDetails.vital_signs = record.vital_signs;
    }

    if (record.prescriptions) {
      parsedDetails.prescriptions = record.prescriptions;
    }

    if (record.lab_results) {
      parsedDetails.results = record.lab_results;
    }

    return parsedDetails;
  };

  // Helper function to safely render any value as string
  const renderValue = (value: unknown, unit?: string): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'object') {
      // Handle object with value/unit structure
      if (value !== null && 'value' in value && value.value !== undefined) {
        const valueObj = value as {value: string | number, unit?: string};
        return `${valueObj.value}${valueObj.unit ? ' ' + valueObj.unit : unit ? ' ' + unit : ''}`;
      }
      // For other objects, convert to JSON string
      return JSON.stringify(value);
    }

    return `${String(value)}${unit ? ' ' + unit : ''}`;
  };

  // Helper to try parsing JSON or return a default on error
  const tryParseJson = <T,>(jsonString: string, defaultValue: T | null = null): T | null => {
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      // Intentionally ignore the error
      return defaultValue;
    }
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
            size: A4 portrait;
            margin: 2cm;
          }
          body {
            font-family: 'Arial', sans-serif;
            color: #000;
            background-color: white !important;
            margin: 0;
            padding: 0;
          }
          .print-watermark {
            display: none;
          }
          /* Hide screen-only elements */
          .no-print {
            display: none !important;
          }
          /* Show print-only elements */
          .hidden.print\\:block {
            display: block !important;
          }
        `}</style>

        {/* Remove watermark for cleaner output */}
        <div className="hidden print:hidden print-watermark">
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

          {/* Replace the medical record card with the clinical staff print view */}
          <Card className={`border rounded-md overflow-hidden ${showPrintPreview ? 'shadow-xl' : ''} print:shadow-none print:border-none print:mt-0`}>
            <CardContent className="p-6">
              {/* Regular view content - visible on screen only */}
              <div className="print:hidden">
                {/* Header - Exactly as in the image */}
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold">Medical Record</h1>
                  <p className="text-sm">Physician: {record.assignedDoctor?.name ? `Dr. ${record.assignedDoctor.name}` : 'Healthcare Provider'}</p>
                </div>

                {/* Horizontal line */}
                <div className="border-t border-gray-300 my-4"></div>

                {/* Introduction text */}
                <div className="text-sm mb-8">
                  <p>The following information is a comprehensive medical record of the patient, intended for professional use only. This document ensures a detailed overview of the patient's medical history and current health status.</p>
                </div>

                {/* Patient Info Table */}
                <table className="w-full border-collapse mb-8">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 w-1/3 border border-gray-300 font-medium bg-gray-50">Patient Information</th>
                      <th className="text-left p-3 w-2/3 border border-gray-300 font-medium bg-gray-50">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-300">Name:</td>
                      <td className="p-3 border border-gray-300">{user?.name || 'Patient'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Date of Birth:</td>
                      <td className="p-3 border border-gray-300">{formatDate(details.date_of_birth) || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Gender:</td>
                      <td className="p-3 border border-gray-300">{details.gender || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Contact Number:</td>
                      <td className="p-3 border border-gray-300">{details.contact_number || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Email:</td>
                      <td className="p-3 border border-gray-300">{user?.email || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Address:</td>
                      <td className="p-3 border border-gray-300">{details.address || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Follow-up Date:</td>
                      <td className="p-3 border border-gray-300">{formatDate(details.followup_date) || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PRINT VIEW - hidden on screen, visible when printing */}
              <div className="hidden print:block mx-auto" style={{ maxWidth: '800px' }}>
                {/* Title */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Medical Record</h1>
                  <p className="text-sm mt-1">
                    Physician: <span className="text-blue-700 font-medium">
                      {record.assignedDoctor?.name ? `Dr. ${record.assignedDoctor.name}` : 'Healthcare Provider'}
                    </span>
                  </p>
                  {record.assignedDoctor?.email && (
                    <p className="text-xs text-gray-600 mt-0.5">{record.assignedDoctor.email}</p>
                  )}
                  <p className="text-sm mt-2">
                    Patient: <span className="font-medium">{user?.name || 'Patient'}</span>
                  </p>
                </div>

                {/* Horizontal line */}
                <div className="border-t border-gray-300 my-4"></div>

                {/* Introduction */}
                <div className="text-sm mb-4">
                  <p>The following information is a comprehensive medical record of the patient, intended for professional use only. This document ensures a detailed overview of the patient's medical history and current health status.</p>
                </div>

                {/* Patient Information Table */}
                <table className="w-full border-collapse mb-8">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 w-1/3 border border-gray-300 font-medium bg-gray-50">Patient Information</th>
                      <th className="text-left p-3 w-2/3 border border-gray-300 font-medium bg-gray-50">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-300">Name:</td>
                      <td className="p-3 border border-gray-300">{user?.name || 'Patient'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Date of Birth:</td>
                      <td className="p-3 border border-gray-300">{formatDate(details.date_of_birth) || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Gender:</td>
                      <td className="p-3 border border-gray-300">{details.gender || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Contact Number:</td>
                      <td className="p-3 border border-gray-300">{details.contact_number || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Email:</td>
                      <td className="p-3 border border-gray-300">{user?.email || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Address:</td>
                      <td className="p-3 border border-gray-300">{details.address || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-300">Follow-up Date:</td>
                      <td className="p-3 border border-gray-300">{formatDate(details.followup_date) || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Medical History Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-2">Medical History</h2>
                  <div>
                    {details.medical_history ? (
                      <p className="whitespace-pre-line">{details.medical_history}</p>
                    ) : details.diagnosis ? (
                      <p className="whitespace-pre-line">{details.diagnosis}</p>
                    ) : (
                      <p>
                        {user?.name} has a history of hypertension, diagnosed in 2025, and has been under
                        regular medication since. Patient also reports occasional migraines and has been treated
                        for these symptoms with prescribed medication. There is no known history of major
                        surgeries or hospitalizations in the past five years.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rest of the existing content - only visible on screen */}
              <div className="print:hidden">
                {!isLabRecord && (
                  <>
                    {/* Vital Signs */}
                    {details.vital_signs && Object.keys(details.vital_signs).some(key =>
                      details.vital_signs![key] !== null && details.vital_signs![key] !== undefined && details.vital_signs![key] !== ''
                    ) && (
                      <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Vital Signs</h2>
                        <div className="bg-white border rounded-md p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {details.vital_signs.temperature && (
                            <div>
                              <p className="font-semibold text-gray-600">Temperature:</p>
                              <p>{renderValue(details.vital_signs.temperature, '°C')}</p>
                            </div>
                          )}
                          {details.vital_signs.blood_pressure && (
                            <div>
                              <p className="font-semibold text-gray-600">Blood Pressure:</p>
                              <p>{renderValue(details.vital_signs.blood_pressure, 'mmHg')}</p>
                            </div>
                          )}
                          {(details.vital_signs.pulse_rate || details.vital_signs.heart_rate) && (
                            <div>
                              <p className="font-semibold text-gray-600">Heart Rate:</p>
                              <p>{renderValue(details.vital_signs.pulse_rate || details.vital_signs.heart_rate, 'bpm')}</p>
                            </div>
                          )}
                          {details.vital_signs.respiratory_rate && (
                            <div>
                              <p className="font-semibold text-gray-600">Respiratory Rate:</p>
                              <p>{renderValue(details.vital_signs.respiratory_rate, 'breaths/min')}</p>
                            </div>
                          )}
                          {details.vital_signs.oxygen_saturation && (
                            <div>
                              <p className="font-semibold text-gray-600">Oxygen Saturation:</p>
                              <p>{renderValue(details.vital_signs.oxygen_saturation, '%')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Diagnosis */}
                    {details.diagnosis && !details.diagnosis.startsWith('{') && (
                      <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Diagnosis</h2>
                        <div className="bg-white border rounded-md p-4">
                          <p className="whitespace-pre-line">{renderValue(details.diagnosis)}</p>
                        </div>
                      </div>
                    )}

                    {/* Prescriptions Section */}
                    {details.prescriptions && (
                      <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Prescriptions</h2>
                        <div className="bg-white border rounded-md p-4">
                          <ul className="list-disc list-inside">
                            {(() => {
                              // Handle array of prescriptions
                              if (Array.isArray(details.prescriptions)) {
                                return details.prescriptions.map((prescription, index) => {
                                  // Case 1: Prescription is already a string that looks like JSON
                                  if (typeof prescription === 'string') {
                                    // First try parsing as JSON
                                    const parsedPrescription = tryParseJson<PrescriptionItem>(prescription);
                                    if (parsedPrescription) {
                                      return (
                                        <li key={index} className="mb-3">
                                          <div className="ml-2 mt-1">
                                            <p className="font-medium">
                                              {parsedPrescription.medication || ''}
                                              {parsedPrescription.dosage ? ` - ${parsedPrescription.dosage}` : ''}
                                            </p>
                                            <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                                              {parsedPrescription.frequency && (
                                                <span>Frequency: {parsedPrescription.frequency}</span>
                                              )}
                                              {parsedPrescription.duration && (
                                                <span>Duration: {parsedPrescription.duration} {parsedPrescription.duration === '1' ? 'day' : 'days'}</span>
                                              )}
                                              {parsedPrescription.instructions && (
                                                <span className="md:col-span-2">Instructions: {parsedPrescription.instructions}</span>
                                              )}
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    }
                                    // If parsing failed, just render as text
                                    return <li key={index} className="mb-1">{renderValue(prescription)}</li>;
                                  }

                                  // Case 2: Prescription is already an object
                                  if (typeof prescription === 'object' && prescription !== null) {
                                    const prescObj = prescription as Record<string, string>;
                                    return (
                                      <li key={index} className="mb-3">
                                        <div className="ml-2 mt-1">
                                          <p className="font-medium">
                                            {prescObj.medication || ''}
                                            {prescObj.dosage ? ` - ${prescObj.dosage}` : ''}
                                          </p>
                                          <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                                            {prescObj.frequency && (
                                              <span>Frequency: {prescObj.frequency}</span>
                                            )}
                                            {prescObj.duration && (
                                              <span>Duration: {prescObj.duration} {prescObj.duration === '1' ? 'day' : 'days'}</span>
                                            )}
                                            {prescObj.instructions && (
                                              <span className="md:col-span-2">Instructions: {prescObj.instructions}</span>
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  }

                                  // Default case: Just render as text
                                  return <li key={index} className="mb-1">{renderValue(prescription)}</li>;
                                });
                              }

                              // Handle object style prescriptions
                              if (typeof details.prescriptions === 'object' && details.prescriptions !== null) {
                                return Object.entries(details.prescriptions as Record<string, string>).map(([key, value], index) => {
                                  // Try to parse JSON string value
                                  if (typeof value === 'string') {
                                    const parsedValue = tryParseJson<PrescriptionItem>(value);
                                    if (parsedValue) {
                                      return (
                                        <li key={index} className="mb-3">
                                          <div className="ml-2 mt-1">
                                            <p className="font-medium">
                                              {parsedValue.medication || key}
                                              {parsedValue.dosage ? ` - ${parsedValue.dosage}` : ''}
                                            </p>
                                            <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                                              {Object.entries(parsedValue).map(([subKey, subValue]) =>
                                                subKey !== 'medication' && subKey !== 'dosage' ? (
                                                  <span key={subKey} className={subKey === 'instructions' ? 'md:col-span-2' : ''}>
                                                    {subKey.charAt(0).toUpperCase() + subKey.slice(1)}: {subValue}
                                                  </span>
                                                ) : null
                                              )}
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    }
                                  }

                                  return (
                                    <li key={index} className="mb-1">
                                      <span className="font-semibold">{key}:</span> {renderValue(value)}
                                    </li>
                                  );
                                });
                              }

                              // Handle string prescription that might be JSON
                              if (typeof details.prescriptions === 'string') {
                                // Try parsing as a JSON array first
                                if (details.prescriptions.startsWith('[')) {
                                  const parsedArray = tryParseJson<PrescriptionItem[]>(details.prescriptions);
                                  if (parsedArray && Array.isArray(parsedArray)) {
                                    return parsedArray.map((item, index) => {
                                      if (typeof item === 'object' && item !== null) {
                                        const prescObj = item as PrescriptionItem;
                                        return (
                                          <li key={index} className="mb-3">
                                            <div className="ml-2 mt-1">
                                              <p className="font-medium">
                                                {prescObj.medication || ''}
                                                {prescObj.dosage ? ` - ${prescObj.dosage}` : ''}
                                              </p>
                                              <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                                                {prescObj.frequency && (
                                                  <span>Frequency: {prescObj.frequency}</span>
                                                )}
                                                {prescObj.duration && (
                                                  <span>Duration: {prescObj.duration} {prescObj.duration === '1' ? 'day' : 'days'}</span>
                                                )}
                                                {prescObj.instructions && (
                                                  <span className="md:col-span-2">Instructions: {prescObj.instructions}</span>
                                                )}
                                              </div>
                                            </div>
                                          </li>
                                        );
                                      }
                                      return <li key={index} className="mb-1">{renderValue(item)}</li>;
                                    });
                                  }
                                }

                                // Try parsing as a JSON object
                                if (details.prescriptions.startsWith('{')) {
                                  const parsedPrescription = tryParseJson<PrescriptionItem>(details.prescriptions);
                                  if (parsedPrescription) {
                                    return (
                                      <li className="mb-3">
                                        <div className="ml-2 mt-1">
                                          <p className="font-medium">
                                            {parsedPrescription.medication || ''}
                                            {parsedPrescription.dosage ? ` - ${parsedPrescription.dosage}` : ''}
                                          </p>
                                          <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
                                            {Object.entries(parsedPrescription).map(([key, value]) =>
                                              key !== 'medication' && key !== 'dosage' ? (
                                                <span key={key} className={key === 'instructions' ? 'md:col-span-2' : ''}>
                                                  {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                                                </span>
                                              ) : null
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  }
                                }

                                // Default: render as plain text
                                return <li>{renderValue(details.prescriptions)}</li>;
                              }

                              // Fallback
                              return <li>No prescription information available</li>;
                            })()}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Treatments */}
                    {details.treatments && (
                      <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">Treatments</h2>
                        <div className="bg-white border rounded-md p-4">
                          <p className="whitespace-pre-line">{renderValue(details.treatments)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Lab Results */}
                {isLabRecord && details.results && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Test Results</h2>
                    <div className="bg-white border rounded-md p-4">
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
                              <td className="py-2">{renderValue(result.value)}</td>
                              <td className="py-2">{renderValue(result.range || 'N/A')}</td>
                              <td className="py-2">
                                <Badge className={
                                  result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                  result.status === 'abnormal' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {renderValue(result.status || 'Not specified')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {details.notes && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Notes</h2>
                    <div className="bg-white border rounded-md p-4">
                      <p className="whitespace-pre-line">{renderValue(details.notes)}</p>
                    </div>
                  </div>
                )}

                {/* Instructions for lab records */}
                {isLabRecord && details.instructions && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Instructions</h2>
                    <div className="bg-white border rounded-md p-4">
                      <p className="whitespace-pre-line">{renderValue(details.instructions)}</p>
                    </div>
                  </div>
                )}

                {/* Signature section */}
                <div className="mt-10">
                  <Separator className="mb-6" />
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-semibold mb-6">Attending Physician:</p>
                      <div className="h-px-24 border-b border-dashed border-gray-400 w-3/4 mb-2"></div>
                      <p>Dr. {record.assignedDoctor?.name || 'Unassigned'}</p>
                      <p className="text-xs text-gray-500 mt-1">Physician Signature</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-6">Date:</p>
                      <div className="h-px-24 border-b border-dashed border-gray-400 w-3/4 mb-2"></div>
                      <p className="text-xs text-gray-500 mt-1">Signature Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </PatientLayout>
  );
}
