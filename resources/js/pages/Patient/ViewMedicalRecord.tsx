import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

interface User {
  name: string;
  email: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
  doctorProfile?: {
    specialization?: string;
    qualifications?: string;
  };
}

interface Patient {
  id: number;
  name: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
}

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicalRecordDetails {
  appointment_time?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  prescriptions?: Array<string | PrescriptionItem>;
  notes?: string;
  followup_date?: string;
  treatments?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  address?: string;
  medical_history?: string;
  patient_info?: {
    birthdate?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  [key: string]: string | number | Array<string | PrescriptionItem> | Record<string, string | number> | {
    birthdate?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | undefined;
}

interface MedicalRecord {
  id: number;
  patient: Patient;
  assignedDoctor: Doctor;
  doctor_id?: number;
  assigned_doctor_id?: number;
  record_type: string;
  appointment_date: string;
  status: string;
  details: string | MedicalRecordDetails;
  created_at: string;
  updated_at: string;
}

interface RecordRequest {
  id: number;
  status: string;
  request_reason: string;
  approved_at: string;
  approved_by: number;
  expires_at: string | null;
}

interface ViewMedicalRecordProps {
  user: User;
  record: MedicalRecord;
  request: RecordRequest;
}

export default function ViewMedicalRecord({ user, record, request }: ViewMedicalRecordProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<{name: string, specialization: string | null}>({
    name: record.assignedDoctor?.name || '',
    specialization: record.assignedDoctor?.doctorProfile?.specialization || null
  });

  // Fetch doctor information if needed
  useEffect(() => {
    if ((record.assignedDoctor && !record.assignedDoctor.doctorProfile) ||
        (!record.assignedDoctor && (record.doctor_id || record.assigned_doctor_id))) {
      fetchDoctorInfo();
    }
  }, [record]);

  const fetchDoctorInfo = async () => {
    try {
      const doctorId = record.assignedDoctor?.id || record.assigned_doctor_id || record.doctor_id;
      if (!doctorId) return;

      const response = await axios.get(route('doctors.profile', doctorId));
      if (response.data && response.data.doctor) {
        setDoctorInfo({
          name: response.data.doctor.name || '',
          specialization: response.data.doctor.specialty || response.data.doctor.specialization || null
        });
      }
    } catch (error) {
      console.error('Error fetching doctor information:', error);
    }
  };

  const getDoctorDisplay = () => {
    // First try from fetched state
    if (doctorInfo.name) {
      return `Dr. ${doctorInfo.name}${doctorInfo.specialization ? `, ${doctorInfo.specialization}` : ''}`;
    }

    // Fallback to record data
    if (record.assignedDoctor && record.assignedDoctor.name) {
      return `Dr. ${record.assignedDoctor.name}${record.assignedDoctor.doctorProfile?.specialization ?
        `, ${record.assignedDoctor.doctorProfile.specialization}` : ''}`;
    }

    // Last attempt - if record has attributes that suggest a doctor
    if (typeof record.details === 'object' && record.details.doctor_name) {
      return `Dr. ${record.details.doctor_name}${record.details.doctor_specialization ?
        `, ${record.details.doctor_specialization}` : ''}`;
    }

    return 'Not assigned';
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

  // Convert prescriptions to structured format if needed
  const parsePrescriptions = (): PrescriptionItem[] => {
    if (!details.prescriptions) return [];

    return (details.prescriptions as Array<string | PrescriptionItem>).map(prescription => {
      if (typeof prescription === 'string') {
        try {
          const parsed = JSON.parse(prescription);
          if (typeof parsed === 'object') {
            return {
              medication: parsed.medication || '',
              dosage: parsed.dosage || '',
              frequency: parsed.frequency || '',
              duration: parsed.duration || '',
              instructions: parsed.instructions || ''
            };
          }
        } catch {
          // If parsing fails, return basic structure
          return {
            medication: prescription,
            dosage: '',
            frequency: '',
            duration: '',
            instructions: ''
          };
        }
      } else {
        // Already in structured format
        return prescription as PrescriptionItem;
      }
    }).filter((item): item is PrescriptionItem => item !== undefined);
  };

  const prescriptions = parsePrescriptions();

  const getPatientAddress = (): string => {
    if (record.patient?.address) return record.patient.address;
    if (details.address && typeof details.address === 'string') return details.address;
    if (details.patient_info && details.patient_info.address) return details.patient_info.address as string;
    return 'No address provided';
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <PatientLayout user={user}>
      <div className={`bg-gray-100 dark:bg-gray-900 ${isPrinting ? 'print:bg-white print:h-auto' : ''}`}>
        <Head title={`Medical Record - ${formatDate(record.appointment_date)}`} />

        {/* Print-specific styles */}
        <style type="text/css" media="print">{`
          @page {
            size: A4 portrait;
            margin: 2cm;
          }

          body {
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
        `}</style>

        <main className="container mx-auto py-6 px-4 md:px-6 print:bg-white print:p-0 print:dark:bg-white print:overflow-visible">
          {/* Header Actions - hide when printing */}
          <div className={`flex justify-between items-center mb-6 print:hidden`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="p-0">
                  <Link href={route('patient.records.requests.index')}>
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
            </div>
          </div>

          {/* Access Information - hide when printing */}
          <Card className="mb-6 border-l-4 border-l-blue-500 print:hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Record Access Information</h3>
                  <p className="text-sm text-gray-500">This record was made available to you on {formatDate(request.approved_at)}</p>
                  {request.expires_at && (
                    <p className="text-sm text-orange-500">Access expires on {formatDate(request.expires_at)}</p>
                  )}
                </div>
                <Badge className="bg-green-500">Approved</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Medical Record Card - identical to staff view */}
          <Card className="border-t-4 border-t-blue-500 print:hidden">
            <CardContent className="p-0">
              {/* Patient & Record Information - 3 column layout */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Patient Name</h3>
                      <p className="font-medium">{record.patient?.name || 'Unknown Patient'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Address</h3>
                      <p className="font-medium bg-blue-50 text-blue-700 inline-block px-2 py-0.5 rounded">{getPatientAddress()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Record Type</h3>
                      <p className="font-medium text-blue-600">{getRecordTypeDisplay(record.record_type)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Status</h3>
                      <div className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium lowercase">
                        {record.status.toLowerCase()}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Appointment Date</h3>
                      <p className="font-medium">{formatDate(record.appointment_date)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Appointment Time</h3>
                      <p className="font-medium">{formatTime(details.appointment_time) || '14:00:00'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Doctor</h3>
                      <p className="font-medium">{getDoctorDisplay()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Created On</h3>
                      <p className="font-medium">{formatDate(record.created_at)}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Follow-up Date</h3>
                      <p className="font-medium">{formatDate(details.followup_date) || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Medical Information */}
              <div className="p-6">
                {/* Diagnosis */}
                {details.diagnosis && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Diagnosis</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.diagnosis}</p>
                    </div>
                  </div>
                )}

                {/* Prescriptions */}
                {prescriptions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Prescriptions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 border border-gray-200">Medication</th>
                            <th className="text-left p-3 border border-gray-200">Dosage</th>
                            <th className="text-left p-3 border border-gray-200">Frequency</th>
                            <th className="text-left p-3 border border-gray-200">Duration</th>
                            <th className="text-left p-3 border border-gray-200">Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptions.map((prescription, index) => (
                            <tr key={index}>
                              <td className="p-3 border border-gray-200">{prescription.medication}</td>
                              <td className="p-3 border border-gray-200">{prescription.dosage}</td>
                              <td className="p-3 border border-gray-200">{prescription.frequency}</td>
                              <td className="p-3 border border-gray-200">{prescription.duration}</td>
                              <td className="p-3 border border-gray-200">{prescription.instructions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {details.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Notes</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.notes}</p>
                    </div>
                  </div>
                )}

                {/* Medical History */}
                {details.medical_history && typeof details.medical_history === 'string' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Medical History</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.medical_history}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Print-specific layout */}
          <div className="hidden print:block mx-auto" style={{ maxWidth: '800px' }}>
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">Medical Record</h1>
              <p className="text-sm mt-1">
                Physician: {getDoctorDisplay()}
              </p>
              <p className="text-sm mt-1">
                Patient: {record.patient?.name}
              </p>
            </div>

            {/* Horizontal line */}
            <div className="border-t border-gray-300 my-4"></div>

            {/* Introduction */}
            <div className="text-sm mb-4">
              <p>The following information is a comprehensive medical record of the patient, intended for professional use only. This document ensures a detailed overview of the patient's medical history and current health status.</p>
            </div>

            {/* Patient Information Table */}
            <div className="mb-8">
              <table className="w-full border-collapse mb-0">
                <thead>
                  <tr>
                    <th className="text-left p-2 w-1/3 border border-gray-300 bg-gray-50 font-medium">Patient Information</th>
                    <th className="text-left p-2 w-2/3 border border-gray-300 bg-gray-50 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-300">Name:</td>
                    <td className="p-2 border border-gray-300">{record.patient?.name || 'Unknown Patient'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Date of Birth:</td>
                    <td className="p-2 border border-gray-300">{details.patient_info?.birthdate || formatDate(record.patient?.date_of_birth) || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Gender:</td>
                    <td className="p-2 border border-gray-300">{details.patient_info?.gender || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Contact Number:</td>
                    <td className="p-2 border border-gray-300">{details.patient_info?.phone || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Email:</td>
                    <td className="p-2 border border-gray-300">{record.patient?.email || details.patient_info?.email || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Address:</td>
                    <td className="p-2 border border-gray-300">{getPatientAddress()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Follow-up Date:</td>
                    <td className="p-2 border border-gray-300">{formatDate(details.followup_date) || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Medical History */}
            {(details.medical_history && typeof details.medical_history === 'string') && (
              <div className="mb-4">
                <h3 className="text-base font-bold mb-1">Medical History</h3>
                <div className="p-3 border border-gray-300 rounded">
                  <p className="whitespace-pre-line">{details.medical_history || 'Test'}</p>
                </div>
              </div>
            )}

            {/* Diagnosis */}
            {details.diagnosis && (
              <div className="mb-4">
                <h3 className="text-base font-bold mb-1 text-blue-800">Diagnosis</h3>
                <div className="p-3 border border-gray-300 rounded">
                  <p className="whitespace-pre-line">{details.diagnosis}</p>
                </div>
              </div>
            )}

            {/* Prescriptions */}
            {prescriptions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-base font-bold mb-1 text-blue-800">Prescriptions</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border border-gray-300 bg-gray-50">Medication</th>
                      <th className="text-left p-2 border border-gray-300 bg-gray-50">Dosage</th>
                      <th className="text-left p-2 border border-gray-300 bg-gray-50">Frequency</th>
                      <th className="text-left p-2 border border-gray-300 bg-gray-50">Duration</th>
                      <th className="text-left p-2 border border-gray-300 bg-gray-50">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((prescription, index) => (
                      <tr key={index}>
                        <td className="p-2 border border-gray-300">{prescription.medication}</td>
                        <td className="p-2 border border-gray-300">{prescription.dosage}</td>
                        <td className="p-2 border border-gray-300">{prescription.frequency}</td>
                        <td className="p-2 border border-gray-300">{prescription.duration}</td>
                        <td className="p-2 border border-gray-300">{prescription.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            {details.notes && (
              <div className="mb-4">
                <h3 className="text-base font-bold mb-1 text-blue-800">Notes</h3>
                <div className="p-3 border border-gray-300 rounded">
                  <p className="whitespace-pre-line">{details.notes}</p>
                </div>
              </div>
            )}

            {/* Footer for print */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Famcare Healthcare System</p>
            </div>
          </div>
        </main>
      </div>
    </PatientLayout>
  );
}
