import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { PrinterIcon, PencilIcon } from '@heroicons/react/24/outline';

// Define a separate user interface for the component
interface ComponentUser {
  id?: number;
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

export default function MedicalRecordsView({ user, record }: MedicalRecordsViewProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [, setLoading] = useState<boolean>(false);
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
      const response = await axios.get(route('admin.prescriptions.record', record.id));
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrescription = () => {
    if (prescriptions.length > 0) {
      window.open(route('admin.prescriptions.download', prescriptions[0].id), '_blank');
    } else {
      alert('No prescription available for download');
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
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch {
      console.error('Invalid date:', dateString);
      return dateString;
    }
  };

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const parseDetails = (): MedicalRecordDetails => {
    if (!record.details) return {};

    // If details is a string, try to parse it as JSON
    if (typeof record.details === 'string') {
      try {
        return JSON.parse(record.details) as MedicalRecordDetails;
      } catch (e) {
        console.error('Failed to parse details JSON:', e);
        return { notes: record.details };
      }
    }

    // If it's already an object, return it
    return record.details as MedicalRecordDetails;
  };

  const parseVitalSigns = () => {
    if (!record.vital_signs) return {};

    // If vital_signs is a string, try to parse it as JSON
    if (typeof record.vital_signs === 'string') {
      try {
        return JSON.parse(record.vital_signs);
      } catch (e) {
        console.error('Failed to parse vital signs JSON:', e);
        return {};
      }
    }

    // If it's already an object, return it
    return record.vital_signs;
  };

  const parsePrescriptions = () => {
    if (!record.prescriptions) return [];

    // If prescriptions is a string, try to parse it as JSON
    if (typeof record.prescriptions === 'string') {
      try {
        return JSON.parse(record.prescriptions);
      } catch (e) {
        console.error('Failed to parse prescriptions JSON:', e);
        return [];
      }
    }

    // If it's already an array, return it
    return record.prescriptions;
  };

  const patientAddress = () => {
    const details = parseDetails();

    // Check different possible locations for address
    if (details.patient_info?.address) {
      return details.patient_info.address;
    }

    if (details.address) {
      return details.address;
    }

    if (record.patient?.address) {
      return record.patient.address;
    }

    return 'No address on file';
  };

  const handlePrint = () => {
    window.open(route('admin.medical-records.pdf', record.id), '_blank');
  };

  const getDoctorDisplay = () => {
    if (doctorInfo.name) {
      return (
        <div>
          <span className="font-semibold">{doctorInfo.name}</span>
          {doctorInfo.specialization && (
            <span className="block text-sm text-gray-500">{doctorInfo.specialization}</span>
          )}
        </div>
      );
    }

    if (record.assignedDoctor) {
      return (
        <div>
          <span className="font-semibold">{record.assignedDoctor.name}</span>
          {record.assignedDoctor.doctorProfile?.specialization && (
            <span className="block text-sm text-gray-500">{record.assignedDoctor.doctorProfile.specialization}</span>
          )}
        </div>
      );
    }

    return 'Unassigned';
  };

  const details = parseDetails();
  const vitalSigns = parseVitalSigns();
  const recordPrescriptions = parsePrescriptions();

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto p-4">
        {/* Back button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            className="flex items-center text-sm text-gray-500 hover:text-black"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Main medical record card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Header with title and buttons */}
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Record</h1>
                <p className="text-sm text-gray-500">Viewing medical record from {formatDate(record.appointment_date)}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handlePrint}
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="default"
                  className="bg-black hover:bg-gray-800 flex items-center"
                >
                  <Link href={route('admin.medical-records.edit', record.id)} className="flex items-center">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </div>
            </div>

            {/* Patient information section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Patient Name</h3>
                <p className="text-base font-medium">{record.patient.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                <p className="text-base">{patientAddress()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Record Type</h3>
                <p className="text-base">{getRecordTypeDisplay(record.record_type)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Appointment Date</h3>
                <p className="text-base">{formatDate(record.appointment_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Appointment Time</h3>
                <p className="text-base">{formatTime(details.appointment_time)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Follow-up Date</h3>
                <p className="text-base">{parseDetails().followup_date ? formatDate(parseDetails().followup_date as string) : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor</h3>
                <p className="text-base">{getDoctorDisplay()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created On</h3>
                <p className="text-base">{formatDate(record.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge
                  variant={record.status.toLowerCase() === 'pending' ? 'warning' :
                          record.status.toLowerCase() === 'completed' ? 'success' : 'outline'}
                  className="px-2 py-0.5 rounded-full"
                >
                  {record.status}
                </Badge>
              </div>
            </div>

            {/* Diagnosis Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Diagnosis</h2>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="whitespace-pre-line">{parseDetails().diagnosis || 'No diagnosis information available'}</p>
              </div>
            </div>

            {/* Prescriptions Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Prescriptions</h2>
              {parsePrescriptions().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left p-3 border border-slate-200 font-medium">Medication</th>
                        <th className="text-left p-3 border border-slate-200 font-medium">Dosage</th>
                        <th className="text-left p-3 border border-slate-200 font-medium">Frequency</th>
                        <th className="text-left p-3 border border-slate-200 font-medium">Duration</th>
                        <th className="text-left p-3 border border-slate-200 font-medium">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsePrescriptions().map((prescription, index) => (
                        <tr key={index} className="border-b border-slate-200">
                          <td className="p-3 border border-slate-200">{prescription.medication}</td>
                          <td className="p-3 border border-slate-200">{prescription.dosage}</td>
                          <td className="p-3 border border-slate-200">{prescription.frequency}</td>
                          <td className="p-3 border border-slate-200">{prescription.duration}</td>
                          <td className="p-3 border border-slate-200">{prescription.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-md text-center">
                  <p className="text-gray-500">No prescriptions found for this record</p>
                </div>
              )}
            </div>

            {/* Vital Signs Section */}
            {Object.keys(parseVitalSigns()).length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Vital Signs</h2>
                <div className="bg-slate-50 p-4 rounded-md grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(parseVitalSigns()).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                      <p>{String(value)} {key === 'temperature' ? '°C' :
                                           key === 'pulse_rate' ? 'bpm' :
                                           key === 'respiratory_rate' ? 'breaths/min' :
                                           key === 'oxygen_saturation' ? '%' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {parseDetails().notes && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Notes</h2>
                <div className="bg-slate-50 p-4 rounded-md">
                  <p className="whitespace-pre-line">{parseDetails().notes as string}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
