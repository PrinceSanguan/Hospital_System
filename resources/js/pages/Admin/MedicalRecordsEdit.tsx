import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmationModal from '@/components/ConfirmationModal';

// Sample medications for dropdown
const MEDICATIONS = [
  "Acetaminophen", "Ibuprofen", "Aspirin", "Amoxicillin", "Ciprofloxacin",
  "Metformin", "Atorvastatin", "Lisinopril", "Amlodipine", "Omeprazole",
  "Metoprolol", "Levothyroxine", "Simvastatin", "Losartan", "Gabapentin",
  "Hydrochlorothiazide", "Sertraline", "Fluoxetine", "Escitalopram", "Citalopram",
  "Pantoprazole", "Montelukast", "Albuterol", "Prednisone", "Tramadol"
];

// Frequency options for dropdown
const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times a day",
  "Four times a day",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Before meals",
  "After meals",
  "At bedtime",
  "Others"
];

// Dosage options for dropdown
const DOSAGE_OPTIONS = [
  "5mg", "10mg", "20mg", "25mg", "50mg", "100mg", "200mg", "250mg", "500mg",
  "1g", "2g", "5ml", "10ml", "15ml", "20ml", "1 tablet", "2 tablets",
  "1 capsule", "2 capsules", "1 tsp", "2 tsp", "1 tbsp"
];

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface Prescription {
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
  prescriptions?: Prescription[] | string[];
  notes?: string;
  followup_date?: string;
  [key: string]: string | number | string[] | Prescription[] | Record<string, string | number> | undefined;
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
  details: string | MedicalRecordDetails;
  created_at: string;
  updated_at: string;
}

interface MedicalRecordsEditProps {
  user: User;
  record: MedicalRecord;
  patients: Patient[];
  doctors: Doctor[];
}

export default function MedicalRecordsEdit({ user, record, patients, doctors }: MedicalRecordsEditProps) {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Parse the record details if it's a string
  const parseDetails = (): MedicalRecordDetails => {
    if (typeof record.details === 'string') {
      try {
        return JSON.parse(record.details) as MedicalRecordDetails;
      } catch {
        return {};
      }
    }
    return record.details as MedicalRecordDetails;
  };

  const details = parseDetails();

  // Convert prescriptions to the structured format if they are strings
  const convertPrescriptions = (): Prescription[] => {
    if (!details.prescriptions) return [createEmptyPrescription()];

    if (Array.isArray(details.prescriptions) && details.prescriptions.length > 0) {
      if (typeof details.prescriptions[0] === 'string') {
        // If we have string prescriptions, convert them to structured format
        return (details.prescriptions as string[]).map(prescStr => {
          try {
            // Try to parse the string as JSON
            const parsed = JSON.parse(prescStr);
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
            // If parsing fails, just use the string as medication name
            return {
              medication: prescStr,
              dosage: '',
              frequency: '',
              duration: '',
              instructions: ''
            };
          }

          return createEmptyPrescription();
        });
      } else {
        // Already in structured format
        return details.prescriptions as Prescription[];
      }
    }

    return [createEmptyPrescription()];
  };

  const createEmptyPrescription = (): Prescription => {
    return {
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
  };

  // Initialize form with existing data
  const { data, setData, put, processing, errors } = useForm({
    patient_id: record.patient?.id.toString() || '',
    assigned_doctor_id: record.assignedDoctor?.id.toString() || record.assigned_doctor_id?.toString() || record.doctor_id?.toString() || '',
    record_type: record.record_type || 'medical_record',
    appointment_date: record.appointment_date || format(new Date(), 'yyyy-MM-dd'),
    appointment_time: details.appointment_time || '09:00',
    diagnosis: details.diagnosis || '',
    notes: details.notes || '',
    status: record.status || 'pending',
    vital_signs: {
      temperature: details.vital_signs?.temperature?.toString() || '',
      blood_pressure: details.vital_signs?.blood_pressure?.toString() || '',
      pulse_rate: details.vital_signs?.pulse_rate?.toString() || '',
      respiratory_rate: details.vital_signs?.respiratory_rate?.toString() || '',
      oxygen_saturation: details.vital_signs?.oxygen_saturation?.toString() || '',
      height: details.vital_signs?.height?.toString() || '',
      weight: details.vital_signs?.weight?.toString() || ''
    },
    prescriptions: convertPrescriptions(),
    followup_date: details.followup_date || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveConfirmation(true);
  };

  const confirmSave = () => {
    setShowSaveConfirmation(false);
    put(route('admin.medical-records.update', record.id));
  };

  const addPrescription = () => {
    setData('prescriptions', [...data.prescriptions, createEmptyPrescription()]);
  };

  const removePrescription = (index: number) => {
    const updatedPrescriptions = [...data.prescriptions];
    updatedPrescriptions.splice(index, 1);
    setData('prescriptions', updatedPrescriptions);
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    const updatedPrescriptions = [...data.prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value
    };
    setData('prescriptions', updatedPrescriptions);
  };

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href={route('admin.medical-records')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Records
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Medical Record</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the basic details of this medical record
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id">Patient</Label>
                  <Select
                    value={data.patient_id}
                    onValueChange={(value) => setData('patient_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.patient_id && <p className="text-sm text-red-500">{errors.patient_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_doctor_id">Doctor</Label>
                  <Select
                    value={data.assigned_doctor_id}
                    onValueChange={(value) => setData('assigned_doctor_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assigned_doctor_id && <p className="text-sm text-red-500">{errors.assigned_doctor_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="record_type">Record Type</Label>
                  <Select
                    value={data.record_type}
                    onValueChange={(value) => setData('record_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select record type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical_record">Medical Record</SelectItem>
                      <SelectItem value="medical_checkup">Medical Checkup</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="laboratory">Laboratory Test</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.record_type && <p className="text-sm text-red-500">{errors.record_type}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date">Date</Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={data.appointment_date}
                      onChange={(e) => setData('appointment_date', e.target.value)}
                    />
                    {errors.appointment_date && <p className="text-sm text-red-500">{errors.appointment_date}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time">Time</Label>
                    <Input
                      id="appointment_time"
                      type="time"
                      value={data.appointment_time}
                      onChange={(e) => setData('appointment_time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => setData('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followup_date">Follow-up Date (Optional)</Label>
                  <Input
                    id="followup_date"
                    type="date"
                    value={data.followup_date}
                    onChange={(e) => setData('followup_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Details</CardTitle>
                <CardDescription>
                  Update diagnosis, notes, and vital signs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    placeholder="Enter diagnosis"
                    value={data.diagnosis}
                    onChange={(e) => setData('diagnosis', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter additional notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Vital Signs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="text"
                        value={data.vital_signs.temperature}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          temperature: e.target.value
                        })}
                        placeholder="36.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="blood_pressure">Blood Pressure</Label>
                      <Input
                        id="blood_pressure"
                        type="text"
                        value={data.vital_signs.blood_pressure}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          blood_pressure: e.target.value
                        })}
                        placeholder="120/80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pulse_rate">Pulse Rate (bpm)</Label>
                      <Input
                        id="pulse_rate"
                        type="text"
                        value={data.vital_signs.pulse_rate}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          pulse_rate: e.target.value
                        })}
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="respiratory_rate">Respiratory Rate</Label>
                      <Input
                        id="respiratory_rate"
                        type="text"
                        value={data.vital_signs.respiratory_rate}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          respiratory_rate: e.target.value
                        })}
                        placeholder="16"
                      />
                    </div>
                    <div>
                      <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
                      <Input
                        id="oxygen_saturation"
                        type="text"
                        value={data.vital_signs.oxygen_saturation}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          oxygen_saturation: e.target.value
                        })}
                        placeholder="98"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="text"
                        value={data.vital_signs.height}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          height: e.target.value
                        })}
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="text"
                        value={data.vital_signs.weight}
                        onChange={(e) => setData('vital_signs', {
                          ...data.vital_signs,
                          weight: e.target.value
                        })}
                        placeholder="70"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prescriptions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
              <CardDescription>
                Add or update prescriptions for this medical record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.prescriptions.map((prescription, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Prescription #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePrescription(index)}
                      disabled={data.prescriptions.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`medication-${index}`}>Medication</Label>
                      <Select
                        value={prescription.medication}
                        onValueChange={(value) => updatePrescription(index, 'medication', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medication" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDICATIONS.map((med) => (
                            <SelectItem key={med} value={med}>
                              {med}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {prescription.medication === 'other' && (
                        <Input
                          type="text"
                          placeholder="Enter medication name"
                          value={prescription.medication === 'other' ? '' : prescription.medication}
                          onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                      <Select
                        value={prescription.dosage}
                        onValueChange={(value) => updatePrescription(index, 'dosage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dosage" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOSAGE_OPTIONS.map((dosage) => (
                            <SelectItem key={dosage} value={dosage}>
                              {dosage}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {prescription.dosage === 'other' && (
                        <Input
                          type="text"
                          placeholder="Enter dosage"
                          value={prescription.dosage === 'other' ? '' : prescription.dosage}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                      <Select
                        value={prescription.frequency}
                        onValueChange={(value) => updatePrescription(index, 'frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {freq}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other (specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {prescription.frequency === 'other' && (
                        <Input
                          type="text"
                          placeholder="Enter frequency"
                          value={prescription.frequency === 'other' ? '' : prescription.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`duration-${index}`}>Duration</Label>
                      <Input
                        id={`duration-${index}`}
                        type="text"
                        placeholder="e.g., 7 days, 2 weeks"
                        value={prescription.duration}
                        onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`instructions-${index}`}>Instructions</Label>
                      <Textarea
                        id={`instructions-${index}`}
                        placeholder="Special instructions for this medication"
                        value={prescription.instructions}
                        onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addPrescription}
                className="w-full"
              >
                Add Prescription
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSaveConfirmation}
          onClose={() => setShowSaveConfirmation(false)}
          onConfirm={confirmSave}
          title="Save Changes"
          message="Are you sure you want to save these changes to the medical record?"
          confirmText="Save Changes"
          cancelText="Cancel"
        />
      </div>
    </AdminLayout>
  );
}
