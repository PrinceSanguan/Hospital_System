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
  address?: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
  doctorProfile?: {
    specialization?: string;
  };
}

interface MedicalRecordDetails {
  appointment_time?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  prescriptions?: string[] | Record<string, string> | string | Array<PrescriptionItem>;
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
  patient_info?: {
    birthdate?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  patient_address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  [key: string]: string | number | string[] | Record<string, string | number | {value: string|number, status?: string, range?: string}> | Array<PrescriptionItem> | undefined | Record<string, unknown>;
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
  doctor_id?: number;
  assigned_doctor_id?: number;
  assignedDoctor?: Doctor;
  record_type: string;
  appointment_date: string;
  status: string;
  reason?: string;
  details: string | MedicalRecordDetails;
  created_at: string;
  updated_at: string;
  vital_signs?: Record<string, string | number>;
  lab_results?: Record<string, LabTestResult>;
  prescriptions?: string[] | Record<string, string> | Array<PrescriptionItem>;
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

interface PrescriptionItemInterface {
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

// Add interface for patient details
interface PatientDetails {
  id?: number;
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  [key: string]: string | number | undefined;
}

export default function RecordDetails({ user, record }: RecordDetailsProps) {
  const [doctorInfo, setDoctorInfo] = useState<{name: string, specialization: string | null}>({
    name: record.assignedDoctor?.name || '',
    specialization: record.assignedDoctor?.doctorProfile?.specialization || null
  });

  // Add state for loading indicators
  const [isLoadingDoctor, setIsLoadingDoctor] = useState<boolean>(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);

  // Add component initialization debug log
  useEffect(() => {
    console.log('=== RecordDetails Component Initialized ===');
    console.log('Full record data:', record);
    console.log('Record assigned_doctor_id:', record.assigned_doctor_id);
    console.log('Record doctor_id:', record.doctor_id);
    console.log('Record assignedDoctor:', record.assignedDoctor);
    console.log('Record details type:', typeof record.details);

    // If details is a string, try to parse and log it
    if (typeof record.details === 'string') {
      try {
        const parsedDetails = JSON.parse(record.details);
        console.log('Record details (parsed):', parsedDetails);
      } catch (e) {
        console.error('Error parsing record details as JSON:', e);
        console.log('Raw details string:', record.details);
      }
    } else {
      console.log('Record details (object):', record.details);
    }

    console.log('User data:', user);
  }, []);

  // Fetch patient details including address when component mounts
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!record.patient_id) return;

      setIsLoadingAddress(true);
      try {
        console.log('Fetching patient details for ID:', record.patient_id);
        const response = await axios.get(route('api.patients.details', record.patient_id));

        if (response.data && response.data.patient) {
          setPatientDetails(response.data.patient);
          console.log('Fetched patient details:', response.data.patient);
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    // Check first if details might contain address information
    if (typeof record.details === 'string') {
      try {
        const parsedDetails = JSON.parse(record.details);
        if (parsedDetails.address ||
            (parsedDetails.patient_info && parsedDetails.patient_info.address)) {
          // If details already has address info, don't make the API call
          console.log('Found address in record details:', parsedDetails);
          return;
        }
      } catch (e) {
        console.error('Error parsing record details string', e);
      }
    } else if (typeof record.details === 'object' && record.details) {
      if (record.details.address ||
          (record.details.patient_info && record.details.patient_info.address)) {
        // If details already has address info, don't make the API call
        console.log('Found address in record details object:', record.details);
        return;
      }
    }

    // Otherwise fetch patient details from API
    fetchPatientDetails();
  }, [record.patient_id, record.details]);

  // Get patient address from various possible locations
  const patientAddress = (): string => {
    if (isLoadingAddress) {
      return 'Loading address...';
    }

    // First try to directly parse details if it's a string
    if (typeof record.details === 'string') {
      try {
        const parsedDetails = JSON.parse(record.details);

        // Check direct address in parsed details
        if (parsedDetails.address && typeof parsedDetails.address === 'string' &&
            parsedDetails.address.trim() !== '') {
          return parsedDetails.address;
        }

        // Check patient_info.address in parsed details
        if (parsedDetails.patient_info && parsedDetails.patient_info.address &&
            typeof parsedDetails.patient_info.address === 'string' &&
            parsedDetails.patient_info.address.trim() !== '') {
          return parsedDetails.patient_info.address;
        }
      } catch (e) {
        console.error('Error parsing details string to extract address', e);
      }
    }

    // First check if we have fetched patient details
    if (patientDetails && patientDetails.address &&
        typeof patientDetails.address === 'string' &&
        patientDetails.address.trim() !== '') {
      return patientDetails.address;
    }

    // Check if address is in details
    if (details.address && typeof details.address === 'string' && details.address.trim() !== '') {
      return details.address;
    }

    // Check if address is in patient_info section of details
    if (details.patient_info && details.patient_info.address &&
        typeof details.patient_info.address === 'string' &&
        details.patient_info.address.trim() !== '') {
      return details.patient_info.address;
    }

    // Check for direct property address on user
    if (user.address && typeof user.address === 'string' && user.address.trim() !== '') {
      return user.address;
    }

    // Check for basic details that might contain address
    if (details.patient_address && typeof details.patient_address === 'string' && details.patient_address.trim() !== '') {
      return details.patient_address;
    }

    // If we have province, city, etc., try to construct an address
    const addressParts = [];
    if (details.barangay) addressParts.push(details.barangay);
    if (details.city) addressParts.push(details.city);
    if (details.province) addressParts.push(details.province);
    if (details.zip_code) addressParts.push(details.zip_code);

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }

    // Default fallback address from the database
    return typeof record.details === 'object' && record.details && 'address' in record.details ?
      String(record.details.address) : 'No address on record';
  };

  // Update useEffect to check for doctor info and call API if needed
  useEffect(() => {
    setIsLoadingDoctor(true);
    console.log('Record doctor data:', record);
    console.log('Record assigned_doctor_id:', record.assigned_doctor_id);

    // Try to get doctor info from record.details without making an API call
    if (typeof record.details === 'object') {
      const details = record.details;
      if (details.doctor_name || details.attending_physician) {
        setDoctorInfo({
          name: String(details.doctor_name || details.attending_physician || ''),
          specialization: details.doctor_specialization || details.specialty ?
            String(details.doctor_specialization || details.specialty) : null
        });
        console.log('Found doctor info in record details');
        setIsLoadingDoctor(false);
        return;
      }
    }

    // If record.assignedDoctor has data, use it
    if (record.assignedDoctor && record.assignedDoctor.name) {
      setDoctorInfo({
        name: record.assignedDoctor.name,
        specialization: record.assignedDoctor.doctorProfile?.specialization || null
      });
      console.log('Using assignedDoctor data from record');
      setIsLoadingDoctor(false);
      return;
    }

    // If we have an assigned_doctor_id but no doctor info loaded yet, fetch it
    if (record.assigned_doctor_id) {
      console.log('Fetching doctor info for assigned_doctor_id:', record.assigned_doctor_id);
      // Make direct API call with the ID from the record
      fetchDoctorInfoById(record.assigned_doctor_id);
      return;
    }

    // If we have a doctor_id but no doctor info loaded yet, fetch it
    if (record.doctor_id) {
      console.log('Fetching doctor info for doctor_id:', record.doctor_id);
      // Make direct API call with the ID from the record
      fetchDoctorInfoById(record.doctor_id);
      return;
    }

    setIsLoadingDoctor(false);
  }, [record]);

  // New function to fetch doctor info directly using ID
  const fetchDoctorInfoById = async (doctorId: number) => {
    try {
      console.log('Directly fetching doctor info for ID:', doctorId);
      const response = await axios.get(route('api.doctors.profile', doctorId));

      if (response.data && response.data.doctor) {
        setDoctorInfo({
          name: response.data.doctor.name || '',
          specialization: response.data.doctor.specialty || response.data.doctor.specialization || null
        });
        console.log('Successfully fetched doctor data:', response.data.doctor);
      } else {
        console.error('Doctor profile API returned empty data');
      }
    } catch (error) {
      console.error('Error fetching doctor information by ID:', error);
    } finally {
      setIsLoadingDoctor(false);
    }
  };

  // Get record type display name
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
          } else {
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

  const details = parseDetails();

  // Handler for print button
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Update the getDoctorDisplay function to handle loading state
  const getDoctorDisplay = () => {
    // Debug logging
    console.log('getDoctorDisplay called with:', {
      isLoadingDoctor,
      doctorInfo,
      assignedDoctorId: record.assigned_doctor_id,
      doctorId: record.doctor_id,
      assignedDoctor: record.assignedDoctor
    });

    if (isLoadingDoctor) {
      return 'Loading doctor information...';
    }

    // First try from fetched state
    if (doctorInfo.name) {
      return `Dr. ${doctorInfo.name}${doctorInfo.specialization ? `, ${doctorInfo.specialization}` : ''}`;
    }

    // Fallback to record data
    if (record.assignedDoctor && record.assignedDoctor.name) {
      return `Dr. ${record.assignedDoctor.name}${record.assignedDoctor.doctorProfile?.specialization ?
        `, ${record.assignedDoctor.doctorProfile.specialization}` : ''}`;
    }

    // Try additional fields that might contain doctor info in the details object
    if (typeof record.details === 'object') {
      const details = record.details;
      if (details.doctor_name || details.attending_physician) {
        return `Dr. ${details.doctor_name || details.attending_physician}${
          details.doctor_specialization || details.specialty ?
          `, ${details.doctor_specialization || details.specialty}` : ''}`;
      }
    }

    // Check if we still have an assigned_doctor_id but failed to load the data
    if (record.assigned_doctor_id || record.doctor_id) {
      return `Doctor ID: ${record.assigned_doctor_id || record.doctor_id} (loading failed)`;
    }

    return 'No doctor assigned';
  };

  // Determine if this is a lab record
  const isLabRecord = record.record_type?.toLowerCase() === 'laboratory';

  // Update renderPrescriptionItem to use PrescriptionItemInterface instead of any
  const renderPrescriptionItem = (item: string | PrescriptionItemInterface | Record<string, unknown>, index: number) => {
    if (typeof item === 'string') {
      return (
        <tr key={index}>
          <td className="p-3 border border-gray-200">{item}</td>
          <td className="p-3 border border-gray-200">-</td>
          <td className="p-3 border border-gray-200">-</td>
          <td className="p-3 border border-gray-200">-</td>
          <td className="p-3 border border-gray-200">-</td>
        </tr>
      );
    } else {
      // Cast to unknown first, then to Record to avoid TypeScript errors
      const itemObj = item as Record<string, string>;
      return (
        <tr key={index}>
          <td className="p-3 border border-gray-200">{itemObj.medication || '-'}</td>
          <td className="p-3 border border-gray-200">{itemObj.dosage || '-'}</td>
          <td className="p-3 border border-gray-200">{itemObj.frequency || '-'}</td>
          <td className="p-3 border border-gray-200">{itemObj.duration || '-'}</td>
          <td className="p-3 border border-gray-200">{itemObj.instructions || '-'}</td>
        </tr>
      );
    }
  };

  return (
    <PatientLayout user={user}>
      <div className="bg-gray-100">
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

        <main className="container mx-auto py-6 px-4 md:px-6 print:bg-white print:p-0 print:m-0 print:dark:bg-white print:overflow-visible">
          {/* Header Actions - hide when printing */}
          <div className="flex items-center mb-6 print:hidden">
            <Button variant="ghost" asChild className="mr-4 p-0">
              <Link href={isLabRecord ? route('patient.records.lab-results') : route('patient.records.index')}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isLabRecord ? 'Laboratory Results' : 'Medical Record'}
              </h1>
              <p className="text-gray-500">
                Viewing your {isLabRecord ? 'lab results' : 'medical record'} from {formatDate(record.appointment_date)}
              </p>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-1"
                disabled={isLabRecord}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          {/* Medical Record Card - redesigned to match the MedicalRecordsView layout */}
          <Card className="border-t-4 border-t-blue-500 print:shadow-none print:border-none print:hidden">
            <CardContent className="p-0">
              {/* Patient & Record Information - 3 column layout */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Patient Name</h3>
                      <p className="font-medium">{user?.name || 'Unknown Patient'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Address</h3>
                      <p className="font-medium bg-blue-50 text-blue-700 inline-block px-2 py-0.5 rounded">{patientAddress()}</p>
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
                      <p className="font-medium">{formatTime(details.appointment_time) || 'Not specified'}</p>
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
                    {record.reason && (
                      <div>
                        <h3 className="text-sm text-gray-500 mb-1">Reason for Visit</h3>
                        <p className="font-medium">{record.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Medical Information */}
              <div className="p-6">
                {/* Diagnosis */}
                {details.diagnosis && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Diagnosis</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.diagnosis}</p>
                    </div>
                  </div>
                )}

                {/* Vital Signs */}
                {details.vital_signs && Object.keys(details.vital_signs).some(key =>
                  details.vital_signs![key] !== null && details.vital_signs![key] !== undefined && details.vital_signs![key] !== ''
                ) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Vital Signs</h3>
                    <div className="bg-gray-50 p-4 rounded-md grid grid-cols-2 md:grid-cols-3 gap-4">
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

                {/* Prescriptions */}
                {details.prescriptions && (
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
                          {(() => {
                            if (Array.isArray(details.prescriptions)) {
                              return details.prescriptions.map((item, index) =>
                                renderPrescriptionItem(item, index)
                              );
                            } else if (typeof details.prescriptions === 'object' && details.prescriptions !== null) {
                              return Object.entries(details.prescriptions).map(([key, value], index) => {
                                if (typeof value === 'object' && value !== null) {
                                  return renderPrescriptionItem(value as PrescriptionItemInterface, index);
                                } else {
                                  return (
                                    <tr key={index}>
                                      <td className="p-3 border border-gray-200">{key}</td>
                                      <td className="p-3 border border-gray-200">{value?.toString() || '-'}</td>
                                      <td className="p-3 border border-gray-200">-</td>
                                      <td className="p-3 border border-gray-200">-</td>
                                      <td className="p-3 border border-gray-200">-</td>
                                    </tr>
                                  );
                                }
                              });
                            } else if (typeof details.prescriptions === 'string') {
                              return renderPrescriptionItem(details.prescriptions, 0);
                            }
                            return null;
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {details.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.notes}</p>
                    </div>
                  </div>
                )}

                {/* Medical History */}
                {details.medical_history && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Medical History</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="whitespace-pre-line">{details.medical_history}</p>
                    </div>
                  </div>
                )}

                {/* Lab Results */}
                {isLabRecord && details.results && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Test Results</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 border border-gray-200">Test</th>
                            <th className="text-left p-3 border border-gray-200">Result</th>
                            <th className="text-left p-3 border border-gray-200">Reference Range</th>
                            <th className="text-left p-3 border border-gray-200">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(details.results || {}).map(([test, result], index) => (
                            <tr key={index}>
                              <td className="p-3 border border-gray-200">{test}</td>
                              <td className="p-3 border border-gray-200">
                                {typeof result === 'object' && result !== null
                                  ? renderValue(result.value)
                                  : renderValue(result)}
                              </td>
                              <td className="p-3 border border-gray-200">
                                {typeof result === 'object' && result !== null && result.range
                                  ? result.range
                                  : '-'}
                              </td>
                              <td className="p-3 border border-gray-200">
                                {typeof result === 'object' && result !== null && result.status
                                  ? <Badge className={
                                    result.status.toLowerCase() === 'normal' ? 'bg-green-500' :
                                    result.status.toLowerCase() === 'high' ? 'bg-red-500' :
                                    result.status.toLowerCase() === 'low' ? 'bg-blue-500' :
                                    'bg-gray-500'
                                  }>{result.status}</Badge>
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                Viewing medical record from {formatDate(record.appointment_date)}
              </p>
            </div>

            {/* Horizontal line */}
            <div className="border-t border-gray-300 my-4"></div>

            {/* Introduction */}
            <div className="text-sm mb-4">
              <p>The following information is a comprehensive medical record of the patient, intended for professional use only. This document ensures a detailed overview of the patient's medical history and current health status.</p>
            </div>

            {/* Patient Information Table - simplified for printing */}
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
                    <td className="p-2 border border-gray-300">{user?.name || 'Unknown Patient'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Date of Birth:</td>
                    <td className="p-2 border border-gray-300">
                      {formatDate(details.patient_info?.birthdate || details.date_of_birth) || 'Not provided'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Email:</td>
                    <td className="p-2 border border-gray-300">
                      {user?.email || details.patient_info?.email || 'Not provided'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Address:</td>
                    <td className="p-2 border border-gray-300">{patientAddress()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Doctor:</td>
                    <td className="p-2 border border-gray-300">{getDoctorDisplay()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Record Type:</td>
                    <td className="p-2 border border-gray-300">{getRecordTypeDisplay(record.record_type)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Status:</td>
                    <td className="p-2 border border-gray-300">{record.status}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Appointment Date:</td>
                    <td className="p-2 border border-gray-300">{formatDate(record.appointment_date)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Appointment Time:</td>
                    <td className="p-2 border border-gray-300">{formatTime(details.appointment_time) || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Created Date:</td>
                    <td className="p-2 border border-gray-300">{formatDate(record.created_at) || 'Not available'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Follow-up Date:</td>
                    <td className="p-2 border border-gray-300">{formatDate(details.followup_date) || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

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
            {details.prescriptions && (
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
                    {(() => {
                      if (Array.isArray(details.prescriptions)) {
                        return details.prescriptions.map((item, index) =>
                          renderPrescriptionItem(item, index)
                        );
                      } else if (typeof details.prescriptions === 'object' && details.prescriptions !== null) {
                        return Object.entries(details.prescriptions).map(([key, value], index) => {
                          if (typeof value === 'object' && value !== null) {
                            return renderPrescriptionItem(value as PrescriptionItemInterface, index);
                          } else {
                            return (
                              <tr key={index}>
                                <td className="p-2 border border-gray-300">{key}</td>
                                <td className="p-2 border border-gray-300">{value?.toString() || '-'}</td>
                                <td className="p-2 border border-gray-300">-</td>
                                <td className="p-2 border border-gray-300">-</td>
                                <td className="p-2 border border-gray-300">-</td>
                              </tr>
                            );
                          }
                        });
                      } else if (typeof details.prescriptions === 'string') {
                        return renderPrescriptionItem(details.prescriptions, 0);
                      }
                      return null;
                    })()}
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

            {/* Medical History */}
            {details.medical_history && (
              <div className="mb-4">
                <h3 className="text-base font-bold mb-1 text-blue-800">Medical History</h3>
                <div className="p-3 border border-gray-300 rounded">
                  <p className="whitespace-pre-line">{details.medical_history}</p>
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
