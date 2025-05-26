import React, { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { UserData } from '@/types';

interface Doctor {
  id: number;
  name: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface RecordCreateProps {
  user: UserData;
  patients: Patient[];
  doctors?: Doctor[];
  recordTypes?: Array<{value: string; label: string}>;
  statusOptions?: Array<{value: string; label: string}>;
}

export default function RecordCreate({
  user = { id: 0, name: 'Doctor', email: '', role: 'doctor' }, // Provide default values with id
  patients = [],
  recordTypes = [],
  statusOptions = []
}: RecordCreateProps) {
  const currentDate = new Date();

  // Debug - Log user object to see what's coming from the backend
  console.log('User object from props:', user);

  // Initialize form with doctor's ID immediately
  const { data, setData, post, processing, errors } = useForm({
    patient_id: '',
    assigned_doctor_id: '', // We'll set this in handleSubmit
    record_type: 'medical_record',
    appointment_date: currentDate.toISOString().split('T')[0],
    appointment_time: '09:00',
    status: 'completed',
    diagnosis: '',
    notes: '',
    followup_date: '',
    vital_signs: {
      temperature: '36.5',
      blood_pressure: '120/80',
      heart_rate: '80',
      respiratory_rate: '16',
      oxygen_saturation: '98',
      height: '170',
      weight: '70',
    },
    prescriptions: [
      {
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      }
    ]
  });

  // Debug - Log form data to see if assigned_doctor_id is set
  console.log('Initial form data:', data);

  // Update assigned doctor ID when user changes
  useEffect(() => {
    console.log('useEffect triggered - user object:', user);
    if (user && user.id !== undefined) {
      console.log('Setting assigned_doctor_id to:', String(user.id));
      setData('assigned_doctor_id', String(user.id));
    } else {
      console.log('User ID is undefined or missing');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Debug - Log form data before submission
    console.log('Form data before submission:', data);
    console.log('Current user before submission:', user);

    // IMPORTANT: In the Doctor records creation, we don't need to send assigned_doctor_id
    // The backend will automatically assign the record to the authenticated doctor
    // So we'll create a copy of the data without this field

    // Convert form data to the format expected by the backend
    const formattedData = {
      ...data,
      // Omit assigned_doctor_id as the server will use Auth::id()
      details: JSON.stringify({
        diagnosis: data.diagnosis,
        notes: data.notes,
        appointment_time: data.appointment_time,
        followup_date: data.followup_date,
      }),
    };

    // Debug - Log formatted data to be sent
    console.log('Formatted data being sent:', formattedData);

    post(route('doctor.records.store'), {
      ...formattedData,
      _method: 'POST'
    });
  };

  const addPrescription = () => {
    setData('prescriptions', [
      ...data.prescriptions,
      {
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      }
    ]);
  };

  const removePrescription = (index: number) => {
    const updatedPrescriptions = [...data.prescriptions];
    updatedPrescriptions.splice(index, 1);
    setData('prescriptions', updatedPrescriptions);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updatedPrescriptions = [...data.prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value
    };
    setData('prescriptions', updatedPrescriptions);
  };

  // Show form regardless of user state
  return (
    <DoctorLayout user={user}>
      <Head title="Create Medical Record" />

      <div className="p-6">
        <div className="mb-6">
          <Link href={route('doctor.clinical.info')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Create Medical Record
          </Link>
          <p className="text-gray-600">Create new medical record information for your patient</p>
          {/* Debug display */}
          {!user?.id && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4">
              <p>Debug: User ID is missing. Current user object:</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Medical Record Details</h3>
                <p className="text-sm text-gray-500 mb-4">Add the details for your patient's medical record</p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patient_id" className="mb-1 block">
                      Patient <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="patient_id"
                      className="w-full px-3 py-2 border rounded-md"
                      value={data.patient_id}
                      onChange={(e) => setData('patient_id', e.target.value)}
                      required
                    >
                      <option value="">Select a patient</option>
                      {patients.length > 0 ? (
                        patients.map((patient) => (
                          <option key={patient.id} value={patient.id.toString()}>
                            {patient.name} ({patient.email})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No patients assigned to you</option>
                      )}
                    </select>
                    {errors.patient_id && (
                      <div className="text-red-500 text-sm mt-1">{errors.patient_id}</div>
                    )}
                    {patients.length === 0 && (
                      <p className="text-amber-600 text-sm mt-1">
                        You don't have any patients assigned yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="record_type" className="mb-1 block">
                      Record Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="record_type"
                      className="w-full px-3 py-2 border rounded-md"
                      value={data.record_type}
                      onChange={(e) => setData('record_type', e.target.value)}
                      required
                    >
                      {recordTypes.length > 0 ? (
                        recordTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="medical_record">Medical Record</option>
                          <option value="laboratory">Laboratory</option>
                          <option value="medical_checkup">Medical Checkup</option>
                        </>
                      )}
                    </select>
                    {errors.record_type && (
                      <div className="text-red-500 text-sm mt-1">{errors.record_type}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appointment_date" className="mb-1 block">
                        Date <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="appointment_date"
                          type="date"
                          value={data.appointment_date}
                          onChange={(e) => setData('appointment_date', e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                      {errors.appointment_date && (
                        <div className="text-red-500 text-sm mt-1">{errors.appointment_date}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="appointment_time" className="mb-1 block">
                        Time
                      </Label>
                      <div className="relative">
                        <Input
                          id="appointment_time"
                          type="time"
                          value={data.appointment_time}
                          onChange={(e) => setData('appointment_time', e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status" className="mb-1 block">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="status"
                      className="w-full px-3 py-2 border rounded-md"
                      value={data.status}
                      onChange={(e) => setData('status', e.target.value)}
                      required
                    >
                      {statusOptions.length > 0 ? (
                        statusOptions.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      )}
                    </select>
                    {errors.status && (
                      <div className="text-red-500 text-sm mt-1">{errors.status}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Vital Signs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="temperature" className="mb-1 block">Temperature (°C)</Label>
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
                    <Label htmlFor="blood_pressure" className="mb-1 block">Blood Pressure (mmHg)</Label>
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
                    <Label htmlFor="heart_rate" className="mb-1 block">Pulse Rate (bpm)</Label>
                    <Input
                      id="heart_rate"
                      type="text"
                      value={data.vital_signs.heart_rate}
                      onChange={(e) => setData('vital_signs', {
                        ...data.vital_signs,
                        heart_rate: e.target.value
                      })}
                      placeholder="80"
                    />
                  </div>

                  <div>
                    <Label htmlFor="respiratory_rate" className="mb-1 block">Respiratory Rate</Label>
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
                    <Label htmlFor="oxygen_saturation" className="mb-1 block">Oxygen Saturation (%)</Label>
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
                    <Label htmlFor="height" className="mb-1 block">Height (cm)</Label>
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
                    <Label htmlFor="weight" className="mb-1 block">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="text"
                      value={data.vital_signs.weight || ''}
                      onChange={(e) => setData('vital_signs', {
                        ...data.vital_signs,
                        weight: e.target.value
                      })}
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Diagnosis & Notes</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="diagnosis" className="mb-1 block">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      value={data.diagnosis}
                      onChange={(e) => setData('diagnosis', e.target.value)}
                      placeholder="Enter diagnosis"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="mb-1 block">Notes</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Enter medical notes"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="followup_date" className="mb-1 block">Follow-up Date (if needed)</Label>
                    <Input
                      id="followup_date"
                      type="date"
                      value={data.followup_date}
                      onChange={(e) => setData('followup_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Prescriptions</h3>
                  <Button type="button" variant="outline" onClick={addPrescription} className="flex items-center gap-1 text-sm">
                    <PlusIcon className="w-4 h-4" />
                    Add Prescription
                  </Button>
                </div>

                {data.prescriptions.map((prescription, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-4 mb-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Prescription #{index + 1}</h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePrescription(index)}
                          className="flex items-center gap-1"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`medication-${index}`}>Medication</Label>
                        <Input
                          id={`medication-${index}`}
                          value={prescription.medication}
                          onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                          placeholder="Medication name"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                        <Input
                          id={`dosage-${index}`}
                          value={prescription.dosage}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                        <Input
                          id={`frequency-${index}`}
                          value={prescription.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                          placeholder="e.g., 3 times a day"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`duration-${index}`}>Duration</Label>
                        <Input
                          id={`duration-${index}`}
                          value={prescription.duration}
                          onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor={`instructions-${index}`}>Instructions</Label>
                        <Textarea
                          id={`instructions-${index}`}
                          value={prescription.instructions}
                          onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                          placeholder="Special instructions"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Link href={route('doctor.clinical.info')}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={processing || !data.patient_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Record
            </Button>
          </div>
        </form>
      </div>
    </DoctorLayout>
  );
}
