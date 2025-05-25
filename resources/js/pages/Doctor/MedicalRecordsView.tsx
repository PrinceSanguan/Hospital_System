import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
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
  quantity: string;
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
  quantity: string;
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

  // Function to fetch doctor information if needed
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
      const response = await axios.get(route('doctor.prescriptions.record', record.id));
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
      window.open(route('doctor.prescriptions.download', prescriptions[0].id), '_blank');
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

  // Direct check for address in structure
  const patientAddress = () => {
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

          {/* Print-specific styles */}
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

            /* Print-specific styling */
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ccc;
            }

            .print-header h1 {
              font-size: 18pt;
              font-weight: bold;
              margin: 0 0 5px 0;
            }

            .print-header p {
              margin: 5px 0;
              font-size: 11pt;
            }

            .print-section {
              margin-bottom: 15px;
            }

            .print-section h2 {
              font-size: 14pt;
              margin-bottom: 10px;
              font-weight: bold;
            }

            .print-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .print-data-item {
              margin-bottom: 8px;
            }

            .print-data-label {
              font-weight: bold;
              margin-right: 5px;
            }

            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }

            .print-table th, .print-table td {
              border: 1px solid #ddd;
              padding: 5px;
              text-align: left;
            }

            .print-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
          `}</style>

          {/* Header Actions - hide when printing */}
          <div className="flex items-center mb-6 print:hidden">
            <Button variant="ghost" asChild className="mr-4 p-0">
                  <Link href={route('doctor.clinical.info')}>
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

          {/* Medical Record Card */}
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
                        <Link href={route('doctor.clinical.info.edit', record.id)}>
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
                            <th className="text-left p-3 border border-gray-200">Quantity</th>
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
                                <td className="p-3 border border-gray-200">{prescription.quantity || 'N/A'}</td>
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
                                <td className="p-3 border border-gray-200">{typeof prescription === 'string' ? '' : (prescription.quantity || 'N/A')}</td>
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

          {/* Print-specific layout */}
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

            {/* Patient Information */}
            <div className="print-section">
              <h2>Patient Information</h2>
              <div className="print-grid">
                <div className="print-data-item">
                  <span className="print-data-label">Name:</span>
                  <span>{record.patient?.name || 'Unknown Patient'}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Record Type:</span>
                  <span>{getRecordTypeDisplay(record.record_type)}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Address:</span>
                  <span>{patientAddress()}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Status:</span>
                  <span>{record.status}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Record Date:</span>
                  <span>{formatDate(record.appointment_date)}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Follow-up Date:</span>
                  <span>{formatDate(details.followup_date) || 'N/A'}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Time:</span>
                  <span>{formatTime(details.appointment_time) || ''}</span>
                </div>
                <div className="print-data-item">
                  <span className="print-data-label">Created On:</span>
                  <span>{formatDate(record.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="print-section">
              <h2>Vital Signs</h2>
              <div className="print-grid">
                {details.vital_signs?.temperature && (
                  <div className="print-data-item">
                    <span className="print-data-label">Temperature:</span>
                    <span>{details.vital_signs.temperature} °C</span>
                  </div>
                )}
                {details.vital_signs?.blood_pressure && (
                  <div className="print-data-item">
                    <span className="print-data-label">Blood Pressure:</span>
                    <span>{details.vital_signs.blood_pressure}</span>
                  </div>
                )}
                {details.vital_signs?.pulse_rate && (
                  <div className="print-data-item">
                    <span className="print-data-label">Pulse Rate:</span>
                    <span>{details.vital_signs.pulse_rate} bpm</span>
                  </div>
                )}
                {details.vital_signs?.respiratory_rate && (
                  <div className="print-data-item">
                    <span className="print-data-label">Respiratory Rate:</span>
                    <span>{details.vital_signs.respiratory_rate} breaths/min</span>
                  </div>
                )}
                {details.vital_signs?.oxygen_saturation && (
                  <div className="print-data-item">
                    <span className="print-data-label">Oxygen Saturation:</span>
                    <span>{details.vital_signs.oxygen_saturation}%</span>
                  </div>
                )}
                {details.vital_signs?.height && (
                  <div className="print-data-item">
                    <span className="print-data-label">Height:</span>
                    <span>{details.vital_signs.height}</span>
                  </div>
                )}
                {details.vital_signs?.weight && (
                  <div className="print-data-item">
                    <span className="print-data-label">Weight:</span>
                    <span>{details.vital_signs.weight}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnosis */}
            {details.diagnosis && (
              <div className="print-section">
                <h2>Diagnosis</h2>
                <p>{details.diagnosis}</p>
              </div>
            )}

            {/* Prescriptions */}
            {(prescriptions.length > 0 || (details.prescriptions && details.prescriptions.length > 0)) && (
              <div className="print-section">
                <h2>Prescriptions</h2>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Quantity</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.length > 0 ? (
                      prescriptions.map((prescription, index) => (
                        <tr key={index}>
                          <td>{prescription.medication}</td>
                          <td>{prescription.dosage}</td>
                          <td>{prescription.frequency}</td>
                          <td>{prescription.duration}</td>
                          <td>{prescription.quantity || 'N/A'}</td>
                          <td>{prescription.instructions}</td>
                        </tr>
                      ))
                    ) : (
                      details.prescriptions && details.prescriptions.map((prescription: string | PrescriptionItem, index: number) => (
                        <tr key={index}>
                          <td>{typeof prescription === 'string' ? prescription : prescription.medication}</td>
                          <td>{typeof prescription === 'string' ? '' : prescription.dosage}</td>
                          <td>{typeof prescription === 'string' ? '' : prescription.frequency}</td>
                          <td>{typeof prescription === 'string' ? '' : prescription.duration}</td>
                          <td>{typeof prescription === 'string' ? '' : (prescription.quantity || 'N/A')}</td>
                          <td>{typeof prescription === 'string' ? '' : prescription.instructions}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            {details.notes && (
              <div className="print-section">
                <h2>Notes</h2>
                <p>{details.notes}</p>
              </div>
            )}

            {/* Medical History */}
            {details.medical_history && (
              <div className="print-section">
                <h2>Medical History</h2>
                <p>{details.medical_history}</p>
              </div>
            )}

            {/* Footer */}
            <div className="print-section" style={{ marginTop: '50px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '10px' }}>
                    {getDoctorDisplay()}
                    <br />
                    Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
