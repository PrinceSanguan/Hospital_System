import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
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
  quantity: string;
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
}

export default function MedicalRecordsEdit({ user, record, patients }: MedicalRecordsEditProps) {
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
    return record.details;
  };

  const details = parseDetails();

  // Convert prescriptions to the structured format if they are strings
  const convertPrescriptions = (): Prescription[] => {
    if (!details.prescriptions) return [createEmptyPrescription()];

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
              instructions: parsed.instructions || '',
              quantity: parsed.quantity || ''
            };
          }
        } catch {
          // If parsing fails, just use the string as medication name
          return {
            medication: prescStr,
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            quantity: ''
          };
        }

        return createEmptyPrescription();
      });
    } else if (Array.isArray(details.prescriptions)) {
      // Already in structured format
      return details.prescriptions as Prescription[];
    }

    return [createEmptyPrescription()];
  };

  const createEmptyPrescription = (): Prescription => {
    return {
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: ''
    };
  };

  // Initialize form with existing data
  const { data, setData, put, processing, errors } = useForm({
    patient_id: record.patient?.id.toString() || '',
    assigned_doctor_id: user.id.toString(), // Always assign to the current doctor
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

  // Log any debugging information
  useEffect(() => {
    console.log('Record:', record);
    console.log('Current doctor ID:', user.id);
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSaveConfirmation(true);
  };

  const confirmSave = () => {
    put(route('doctor.clinical.info.update', record.id));
    setShowSaveConfirmation(false);
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

  const recordTypeOptions = [
    { value: 'medical_record', label: 'General Medical Record' },
    { value: 'medical_checkup', label: 'Medical Checkup' },
    { value: 'prescription', label: 'Prescription' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
          <Head title="Edit Medical Record" />

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild className="p-0">
                    <Link href={route('doctor.clinical.info')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Edit Medical Record
                  </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Update medical record information for your patient
                </p>
              </div>
            </div>

            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Medical Record Details</CardTitle>
                  <CardDescription>
                    Edit the details for your patient's medical record
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">Patient <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('patient_id', value)}
                      value={data.patient_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name} ({patient.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.patient_id && (
                      <p className="text-sm text-red-500">{errors.patient_id}</p>
                    )}
                  </div>

                  {/* Record Type */}
                  <div className="space-y-2">
                    <Label htmlFor="record_type">Record Type <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('record_type', value)}
                      value={data.record_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select record type" />
                      </SelectTrigger>
                      <SelectContent>
                        {recordTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.record_type && (
                      <p className="text-sm text-red-500">{errors.record_type}</p>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointment_date">Date <span className="text-red-500">*</span></Label>
                      <Input
                        id="appointment_date"
                        type="date"
                        value={data.appointment_date}
                        onChange={(e) => setData('appointment_date', e.target.value)}
                      />
                      {errors.appointment_date && (
                        <p className="text-sm text-red-500">{errors.appointment_date}</p>
                      )}
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

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => setData('status', value)}
                      value={data.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-500">{errors.status}</p>
                    )}
                  </div>

                  {/* Vital Signs */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vital Signs</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.temperature">Temperature (°C)</Label>
                            <Input
                              id="vital_signs.temperature"
                              value={data.vital_signs.temperature}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                temperature: e.target.value
                              })}
                              placeholder="36.5"
                              className="w-24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.blood_pressure">Blood Pressure</Label>
                            <Input
                              id="vital_signs.blood_pressure"
                              value={data.vital_signs.blood_pressure}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                blood_pressure: e.target.value
                              })}
                              placeholder="120/80"
                              className="w-24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.pulse_rate">Pulse Rate (bpm)</Label>
                            <Input
                              id="vital_signs.pulse_rate"
                              value={data.vital_signs.pulse_rate}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                pulse_rate: e.target.value
                              })}
                              placeholder="80"
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.respiratory_rate">Respiratory Rate</Label>
                            <Input
                              id="vital_signs.respiratory_rate"
                              value={data.vital_signs.respiratory_rate}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                respiratory_rate: e.target.value
                              })}
                              placeholder="16"
                              className="w-24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.oxygen_saturation">Oxygen Saturation (%)</Label>
                            <Input
                              id="vital_signs.oxygen_saturation"
                              value={data.vital_signs.oxygen_saturation}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                oxygen_saturation: e.target.value
                              })}
                              placeholder="98"
                              className="w-24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.height">Height (cm)</Label>
                            <Input
                              id="vital_signs.height"
                              value={data.vital_signs.height}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                height: e.target.value
                              })}
                              placeholder="170"
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vital_signs.weight">Weight (kg)</Label>
                            <Input
                              id="vital_signs.weight"
                              value={data.vital_signs.weight}
                              onChange={(e) => setData('vital_signs', {
                                ...data.vital_signs,
                                weight: e.target.value
                              })}
                              placeholder="70"
                              className="w-24"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Enter diagnosis details"
                      value={data.diagnosis}
                      onChange={(e) => setData('diagnosis', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Prescriptions */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Prescriptions</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPrescription}
                      >
                        Add Prescription
                      </Button>
                    </div>

                    {data.prescriptions.map((prescription, index) => (
                      <div key={index} className="border p-4 rounded-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label>Medication</Label>
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
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Dosage</Label>
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
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label>Frequency</Label>
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
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Duration</Label>
                            <Input
                              placeholder="e.g. 7 days"
                              value={prescription.duration}
                              onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              placeholder="e.g. 30 tablets"
                              value={prescription.quantity}
                              onChange={(e) => updatePrescription(index, 'quantity', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mb-2">
                          <Label>Instructions</Label>
                          <Textarea
                            placeholder="Enter special instructions"
                            value={prescription.instructions}
                            onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                            rows={2}
                          />
                        </div>
                        {data.prescriptions.length > 1 && (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePrescription(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any additional notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Follow-up Date */}
                  <div className="space-y-2">
                    <Label htmlFor="followup_date">Follow-up Date</Label>
                    <Input
                      id="followup_date"
                      type="date"
                      value={data.followup_date}
                      onChange={(e) => setData('followup_date', e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={route('doctor.clinical.info')}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={processing}>
                    Update Medical Record
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Save Confirmation Modal */}
          <ConfirmationModal
            isOpen={showSaveConfirmation}
            onClose={() => setShowSaveConfirmation(false)}
            onConfirm={confirmSave}
            title="Are you sure you want to save these changes?"
            actionType="save"
          />
        </main>
      </div>
    </div>
  );
}
