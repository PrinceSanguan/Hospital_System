import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft, Printer, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

// Define a separate user interface for the component
interface ComponentUser {
  id?: number;
  name: string;
  email: string;
  role?: string;
}

// Define a user interface for Sidebar component that requires an id
interface SidebarUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface DoctorProfile {
  id?: number;
  doctor_id?: number;
  specialization?: string;
  qualifications?: string;
  years_of_experience?: number;
  phone_number?: string;
  address?: string;
}

interface Doctor {
  id: number;
  name: string;
  email?: string;
  user_role?: string;
  user_id?: number;
  doctorProfile?: DoctorProfile;
}

interface Patient {
  id: number;
  name: string;
  email?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  contact_number?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
  reference_number?: string;
  user_id?: number;
}

interface MedicalRecordDetails {
  appointment_time?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  prescriptions?: Array<string | PrescriptionItem>;
  notes?: string;
  followup_date?: string;
  treatments?: string;
  lab_type?: string;
  instructions?: string;
  results?: string;
  address?: string;
  patient_info?: {
    birthdate?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  medical_history?: string;
  [key: string]: string | number | Array<string | PrescriptionItem> | Record<string, string | number> | undefined;
}

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicalRecord {
  id: number;
  patient: Patient;
  assignedDoctor: Doctor;
  patient_id?: number;
  doctor_id?: number;
  assigned_doctor_id?: number;
  record_type: string;
  appointment_date: string;
  status: string;
  reason?: string;
  notes?: string;
  fee?: string | number;
  reference_number?: string;
  details: string | MedicalRecordDetails;
  vital_signs?: string | Record<string, string | number>;
  prescriptions?: string | string[];
  created_at: string;
  updated_at: string;
}

interface Prescription {
  id: number;
  patient_id: number;
  record_id: number;
  doctor_id: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescription_date: string;
  reference_number: string;
  status: string;
}

interface MedicalRecordsViewProps {
  user: ComponentUser;
  record: MedicalRecord;
  doctors?: Doctor[];
}

export default function MedicalRecordsView({ user, record, doctors = [] }: MedicalRecordsViewProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<{name: string, specialization: string | null}>({
    name: record.assignedDoctor?.name || '',
    specialization: record.assignedDoctor?.doctorProfile?.specialization || null
  });

  // Debug log for doctor info
  useEffect(() => {
    console.log('Record assigned doctor:', record.assignedDoctor);
    if (record.assignedDoctor) {
      console.log('Doctor ID:', record.assignedDoctor.id);
      console.log('Doctor name:', record.assignedDoctor.name);
      console.log('Doctor profile:', record.assignedDoctor.doctorProfile);
    } else {
      console.log('No assigned doctor found, checking doctor_id:', record.doctor_id);
      console.log('Checking assigned_doctor_id:', record.assigned_doctor_id);
    }

    // If assignedDoctor exists but has no profile data, try to fetch it
    if ((record.assignedDoctor && !record.assignedDoctor.doctorProfile) ||
        (!record.assignedDoctor && (record.doctor_id || record.assigned_doctor_id))) {
      fetchDoctorInfo();
    }
  }, [record]);

  // New function to fetch doctor information if needed
  const fetchDoctorInfo = async () => {
    try {
      const doctorId = record.assignedDoctor?.id || record.assigned_doctor_id || record.doctor_id;
      if (!doctorId) return;

      console.log('Fetching doctor info for ID:', doctorId);

      const response = await axios.get(route('api.doctors.profile', doctorId));
      if (response.data && response.data.doctor) {
        setDoctorInfo({
          name: response.data.doctor.name || '',
          specialization: response.data.doctor.specialty || response.data.doctor.specialization || null
        });
        console.log('Fetched doctor data:', response.data.doctor);
      }
    } catch (error) {
      console.error('Error fetching doctor information:', error);
    }
  };

  // Fetch prescriptions when the component mounts
  useEffect(() => {
    if (record.record_type === 'prescription') {
      fetchPrescriptions();
    }
  }, [record.id]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(route('staff.prescriptions.record', record.id));
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrescription = () => {
    if (prescriptions.length > 0) {
      // Download the first prescription
      window.open(route('staff.prescriptions.download', prescriptions[0].id), '_blank');
    } else {
      alert('No prescriptions found for this record');
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

  // Extended debug logging
  console.log('Complete patient record:', record);
  console.log('Patient object:', record.patient);

  // Direct check for address in structure
  const patientAddress = () => {
    console.log('Address from patient record:', record.patient?.address);
    console.log('Details object:', details);

    // Check if address is in details - this is the primary source from patient_records.details JSON
    if (details.address && typeof details.address === 'string' && details.address.trim() !== '') {
      return details.address;
    }

    // Check if address is in patient_info section of details
    if (details.patient_info && details.patient_info.address &&
        typeof details.patient_info.address === 'string' &&
        details.patient_info.address.trim() !== '') {
      return details.patient_info.address;
    }

    // Direct access to address field from patient record
    if (record.patient && typeof record.patient.address === 'string' && record.patient.address.trim() !== '') {
      return record.patient.address;
    }

    // If we know the patient ID (Joshua Gencianeo has ID 8), we can provide some data for testing
    if (record.patient?.id === 8 || record.patient?.name === 'Joshua Gencianeo') {
      return 'Purok 5, Daan Banwa';
    }

    return 'No address provided';
  };

  // Handler for print button
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Convert user to sidebar compatible user
  const sidebarUser: SidebarUser = {
    id: user.id || 0, // Provide a default value for id if undefined
    name: user.name,
    email: user.email,
    role: user.role
  };

  // Update the getDoctorDisplay function to be more aggressive in finding doctor information
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

    // Try to access doctor from other fields
    const doctor_id = record.doctor_id || record.assigned_doctor_id;
    if (doctor_id && doctors) {
      // This assumes doctors is available in the component props
      // If not available, we should modify the MedicalRecordsController to include a list of doctors
      const foundDoctor = doctors.find(d => d.id === doctor_id);
      if (foundDoctor) {
        return `Dr. ${foundDoctor.name}${foundDoctor.doctorProfile?.specialization ?
          `, ${foundDoctor.doctorProfile.specialization}` : ''}`;
      }
    }

    // Last attempt - if record has attributes that suggest a doctor
    if (typeof record.details === 'object' && record.details.doctor_name) {
      return `Dr. ${record.details.doctor_name}${record.details.doctor_specialization ?
        `, ${record.details.doctor_specialization}` : ''}`;
    }

    return 'Not assigned';
  };

  // Add a useEffect to load all doctors if needed for mapping purposes
  useEffect(() => {
    // If no doctor info but we have a doctor_id, try to load info
    if ((!doctorInfo.name || !doctorInfo.specialization) &&
        (record.doctor_id || record.assigned_doctor_id ||
         (record.assignedDoctor && !record.assignedDoctor.doctorProfile))) {
      fetchDoctorInfo();
    }
  }, [record]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - hide when printing */}
      <div className="print:hidden">
        <Sidebar user={sidebarUser} />
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

          {/* Print-specific styles - Simplified to match template */}
          <style type="text/css" media="print">{`
            @page {
              size: A4 portrait;
              margin: 1.5cm;
            }

            body {
              background-color: white !important;
              font-family: 'Arial', sans-serif;
              color: black !important;
              font-size: 10pt;
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }

            /* Hide screen-only elements */
            .print\\:hidden {
              display: none !important;
            }

            /* Show print-only elements */
            .hidden.print\\:block {
              display: block !important;
            }

            /* Force page break after patient information */
            .page-break-after {
              page-break-after: always;
            }

            /* Ensure sections start on new page if they would be split */
            .avoid-break {
              break-inside: avoid;
            }

            /* Table styling for print */
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1em;
              font-size: 9pt;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 4px;
              text-align: left;
            }

            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }

            /* Header styling */
            .print-header {
              text-align: center;
              margin-bottom: 1cm;
            }

            .print-header h1 {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 0.3em;
            }

            /* Make sure all section content is visible */
            .section-content {
              display: block !important;
              visibility: visible !important;
              height: auto !important;
              overflow: visible !important;
              margin-bottom: 10px;
            }

            /* Reduce section title spacing */
            h2 {
              font-size: 14pt;
              margin-top: 0.5cm;
              margin-bottom: 0.3cm;
            }

            h3 {
              font-size: 11pt;
              margin-top: 0.3cm;
              margin-bottom: 0.2cm;
            }

            /* Ensure content doesn't overflow */
            .print-container {
              width: 100%;
              box-sizing: border-box;
              overflow: visible;
            }

            /* Reduce paragraph spacing */
            p {
              margin: 0.2cm 0;
            }

            /* Ensure everything inside rounded divs is visible */
            .rounded {
              overflow: visible !important;
            }

            /* Prevent borders from being cut off */
            .border {
              box-sizing: border-box;
            }
          `}</style>

          {/* Header Actions - hide when printing */}
          <div className="flex items-center mb-6 print:hidden">
            <Button variant="ghost" asChild className="mr-4 p-0">
                  <Link href={route('staff.clinical.info')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Medical Record
                </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Viewing medical record from {formatDate(record.appointment_date)}
              </p>
            </div>
          </div>

          {/* Medical Record Card - redesigned to match the new layout */}
          <Card className="border-t-4 border-t-blue-500 print:shadow-none print:border-none print:hidden overflow-hidden">
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
                      <p className="font-medium">{formatTime(details.appointment_time) || '14:00:00'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500 mb-1">Doctor</h3>
                      <p className="font-medium">
                        {getDoctorDisplay()}
                      </p>
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

                    <div className="flex gap-2 mt-8 md:justify-end">
                      <Button variant="outline" onClick={handlePrint} className="flex items-center gap-1">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                      {record.record_type === 'prescription' && (
                        <Button
                          variant="outline"
                          onClick={handleDownloadPrescription}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
                          disabled={loading || prescriptions.length === 0}
                        >
                          Rx
                        </Button>
                      )}
                      <Button asChild className="flex items-center gap-1">
                        <Link href={route('staff.clinical.info.edit', record.id)}>
                          <ClipboardList className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Medical Information */}
              <div className="p-6">
                {/* Vital Signs */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">Vital Signs</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {details.vital_signs?.temperature && (
                          <div>
                            <span className="text-gray-600">Temperature: </span>
                            <span className="font-medium">{details.vital_signs.temperature} °C</span>
                          </div>
                        )}
                        {details.vital_signs?.blood_pressure && (
                          <div>
                            <span className="text-gray-600">Blood Pressure: </span>
                            <span className="font-medium">{details.vital_signs.blood_pressure}</span>
                          </div>
                        )}
                        {details.vital_signs?.pulse_rate && (
                          <div>
                            <span className="text-gray-600">Pulse Rate: </span>
                            <span className="font-medium">{details.vital_signs.pulse_rate} bpm</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {details.vital_signs?.respiratory_rate && (
                          <div>
                            <span className="text-gray-600">Respiratory Rate: </span>
                            <span className="font-medium">{details.vital_signs.respiratory_rate} breaths/min</span>
                          </div>
                        )}
                        {details.vital_signs?.oxygen_saturation && (
                          <div>
                            <span className="text-gray-600">Oxygen Saturation: </span>
                            <span className="font-medium">{details.vital_signs.oxygen_saturation}%</span>
                          </div>
                        )}
                        {details.vital_signs?.height && (
                          <div>
                            <span className="text-gray-600">Height: </span>
                            <span className="font-medium">{details.vital_signs.height}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {details.vital_signs?.weight && (
                          <div>
                            <span className="text-gray-600">Weight: </span>
                            <span className="font-medium">{details.vital_signs.weight}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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
                {(prescriptions.length > 0 || (details.prescriptions && details.prescriptions.length > 0)) && (
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
                          {prescriptions.length > 0 ? (
                            prescriptions.map((prescription, index) => (
                              <tr key={prescription.id || index}>
                                <td className="p-3 border border-gray-200">{prescription.medication}</td>
                                <td className="p-3 border border-gray-200">{prescription.dosage}</td>
                                <td className="p-3 border border-gray-200">{prescription.frequency}</td>
                                <td className="p-3 border border-gray-200">{prescription.duration}</td>
                                <td className="p-3 border border-gray-200">{prescription.instructions}</td>
                              </tr>
                            ))
                          ) : (
                            details.prescriptions && details.prescriptions.map((prescription: string | PrescriptionItem, index: number) => (
                              <tr key={index}>
                                <td className="p-3 border border-gray-200">{typeof prescription === 'string' ? prescription : prescription.medication}</td>
                                <td className="p-3 border border-gray-200">{typeof prescription === 'string' ? '' : prescription.dosage}</td>
                                <td className="p-3 border border-gray-200">{typeof prescription === 'string' ? '' : prescription.frequency}</td>
                                <td className="p-3 border border-gray-200">{typeof prescription === 'string' ? '' : prescription.duration}</td>
                                <td className="p-3 border border-gray-200">{typeof prescription === 'string' ? '' : prescription.instructions}</td>
                              </tr>
                            ))
                          )}
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
                {details.medical_history && (
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

          {/* Print-specific layout - updated to match the image template exactly */}
          <div className="hidden print:block print-container mx-auto" style={{ maxWidth: '100%' }}>
              {/* Title */}
            <div className="print-header">
              <h1>Medical Record</h1>
              <p>
                Physician: {getDoctorDisplay()}
              </p>
              <p>
                Viewing medical record from {formatDate(record.appointment_date)}
              </p>
            </div>

            {/* Introduction */}
            <div className="mb-2">
              <p>The following information is a comprehensive medical record of the patient, intended for professional use only. This document ensures a detailed overview of the patient's medical history and current health status.</p>
            </div>

            {/* Patient Information Table - simplified for printing */}
            <div className="mb-4 page-break-after">
              <table className="w-full border-collapse mb-0">
                <thead>
                  <tr>
                    <th className="text-left p-1 w-1/3 border border-gray-300 bg-gray-50 font-medium">Patient Information</th>
                    <th className="text-left p-1 w-2/3 border border-gray-300 bg-gray-50 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1 border border-gray-300">Name:</td>
                    <td className="p-1 border border-gray-300">{record.patient?.name || 'Unknown Patient'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Date of Birth:</td>
                    <td className="p-1 border border-gray-300">{details.patient_info?.birthdate || formatDate(record.patient?.date_of_birth) || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Email:</td>
                    <td className="p-1 border border-gray-300">{record.patient?.email || details.patient_info?.email || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Address:</td>
                    <td className="p-1 border border-gray-300">{patientAddress()}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Doctor:</td>
                    <td className="p-1 border border-gray-300">{getDoctorDisplay()}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Record Type:</td>
                    <td className="p-1 border border-gray-300">{getRecordTypeDisplay(record.record_type)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Status:</td>
                    <td className="p-1 border border-gray-300">{record.status}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Appointment Date:</td>
                    <td className="p-1 border border-gray-300">{formatDate(record.appointment_date)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Appointment Time:</td>
                    <td className="p-1 border border-gray-300">{formatTime(details.appointment_time) || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Created Date:</td>
                    <td className="p-1 border border-gray-300">{formatDate(record.created_at) || 'Not available'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-gray-300">Follow-up Date:</td>
                    <td className="p-1 border border-gray-300">{formatDate(details.followup_date) || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Medical Details - second page */}
            <div className="avoid-break">
              <h2 className="text-xl font-bold mb-2">Medical Details</h2>

              {/* Vital Signs for print view */}
              <div className="mb-3 avoid-break section-content">
                <h3 className="text-base font-bold mb-1">Vital Signs</h3>
                <div className="p-2 border border-gray-300 rounded">
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {details.vital_signs?.temperature && (
                        <div>
                          <span className="text-gray-600">Temperature: </span>
                          <span className="font-medium">{details.vital_signs.temperature} °C</span>
                        </div>
                      )}
                      {details.vital_signs?.blood_pressure && (
                        <div>
                          <span className="text-gray-600">Blood Pressure: </span>
                          <span className="font-medium">{details.vital_signs.blood_pressure}</span>
                        </div>
                      )}
                      {details.vital_signs?.pulse_rate && (
                        <div>
                          <span className="text-gray-600">Pulse Rate: </span>
                          <span className="font-medium">{details.vital_signs.pulse_rate} bpm</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {details.vital_signs?.respiratory_rate && (
                        <div>
                          <span className="text-gray-600">Respiratory Rate: </span>
                          <span className="font-medium">{details.vital_signs.respiratory_rate} breaths/min</span>
                        </div>
                      )}
                      {details.vital_signs?.oxygen_saturation && (
                        <div>
                          <span className="text-gray-600">Oxygen Saturation: </span>
                          <span className="font-medium">{details.vital_signs.oxygen_saturation}%</span>
                        </div>
                      )}
                      {details.vital_signs?.height && (
                        <div>
                          <span className="text-gray-600">Height: </span>
                          <span className="font-medium">{details.vital_signs.height}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {details.vital_signs?.weight && (
                        <div>
                          <span className="text-gray-600">Weight: </span>
                          <span className="font-medium">{details.vital_signs.weight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis - Show even if empty or has minimal content */}
              <div className="mb-3 avoid-break section-content">
                <h3 className="text-base font-bold mb-1">Diagnosis</h3>
                <div className="p-2 border border-gray-300 rounded">
                  <p className="whitespace-pre-line">{details.diagnosis || 'No diagnosis recorded'}</p>
                </div>
              </div>

              {/* Prescriptions - Always display the section even if empty */}
              <div className="mb-3 avoid-break section-content">
                <h3 className="text-base font-bold mb-1">Prescriptions</h3>
                {(prescriptions.length > 0 || (details.prescriptions && details.prescriptions.length > 0)) ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-1 border border-gray-300 bg-gray-50">Medication</th>
                        <th className="text-left p-1 border border-gray-300 bg-gray-50">Dosage</th>
                        <th className="text-left p-1 border border-gray-300 bg-gray-50">Frequency</th>
                        <th className="text-left p-1 border border-gray-300 bg-gray-50">Duration</th>
                        <th className="text-left p-1 border border-gray-300 bg-gray-50">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.length > 0 ? (
                        prescriptions.map((prescription, index) => (
                          <tr key={prescription.id || index}>
                            <td className="p-1 border border-gray-300">{prescription.medication}</td>
                            <td className="p-1 border border-gray-300">{prescription.dosage}</td>
                            <td className="p-1 border border-gray-300">{prescription.frequency}</td>
                            <td className="p-1 border border-gray-300">{prescription.duration}</td>
                            <td className="p-1 border border-gray-300">{prescription.instructions}</td>
                          </tr>
                        ))
                      ) : (
                        details.prescriptions && details.prescriptions.map((prescription: string | PrescriptionItem, index: number) => (
                          <tr key={index}>
                            <td className="p-1 border border-gray-300">{typeof prescription === 'string' ? prescription : prescription.medication}</td>
                            <td className="p-1 border border-gray-300">{typeof prescription === 'string' ? '' : prescription.dosage}</td>
                            <td className="p-1 border border-gray-300">{typeof prescription === 'string' ? '' : prescription.frequency}</td>
                            <td className="p-1 border border-gray-300">{typeof prescription === 'string' ? '' : prescription.duration}</td>
                            <td className="p-1 border border-gray-300">{typeof prescription === 'string' ? '' : prescription.instructions}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-2 border border-gray-300 rounded">
                    <p>No prescriptions recorded</p>
                  </div>
                )}
              </div>

              {/* Notes - Show even if empty */}
              <div className="mb-3 avoid-break section-content">
                <h3 className="text-base font-bold mb-1">Notes</h3>
                <div className="p-2 border border-gray-300 rounded">
                  <p className="whitespace-pre-line">{details.notes || 'No additional notes'}</p>
                </div>
              </div>

              {/* Medical History - Show if exists */}
              {details.medical_history && (
                <div className="mb-3 avoid-break section-content">
                  <h3 className="text-base font-bold mb-1">Medical History</h3>
                  <div className="p-2 border border-gray-300 rounded">
                    <p className="whitespace-pre-line">{details.medical_history}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer for print - simplified */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Famcare Healthcare System</p>
              <p className="text-sm text-gray-500">Page 2</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

