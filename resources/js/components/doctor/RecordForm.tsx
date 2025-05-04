import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pill, X } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface VitalSign {
  value: string;
  unit: string;
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface RecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: any;
  patient?: Patient | null;
  patients?: Patient[]; // For selection when creating from Records page
}

const RecordForm: React.FC<RecordFormProps> = ({
  isOpen,
  onClose,
  editRecord = null,
  patient = null,
  patients = []
}) => {
  const isEditing = !!editRecord;

  // Format details field if it's JSON
  const formatDetailsField = (details: string | undefined): string => {
    if (!details || typeof details !== 'string') return '';

    // Check if the details look like JSON
    if (details.trim().startsWith('{') && details.trim().endsWith('}')) {
      try {
        // Try to parse it
        const parsedDetails = JSON.parse(details);
        let formattedDetails = '';

        // Extract common JSON properties
        if (parsedDetails.appointment_time) {
          formattedDetails += `Appointment time: ${parsedDetails.appointment_time}\n`;
        }
        if (parsedDetails.reason) {
          formattedDetails += `Reason: ${parsedDetails.reason}\n`;
        }
        if (parsedDetails.notes) {
          formattedDetails += `Notes: ${parsedDetails.notes}\n`;
        }

        // Handle patient info
        if (parsedDetails.patient_info) {
          formattedDetails += '\nPatient Information:\n';
          for (const [key, value] of Object.entries(parsedDetails.patient_info)) {
            formattedDetails += `${key}: ${value}\n`;
          }
        }

        return formattedDetails || details;
      } catch (_) {
        // If it fails to parse, return the original
        return details;
      }
    }

    return details;
  };

  const { data, setData, post, put, processing, errors, reset } = useForm({
    id: editRecord?.id || "",
    patient_id: editRecord?.patient_id || patient?.id || "",
    record_type: editRecord?.record_type || "medical_record",
    status: editRecord?.status || "completed",
    appointment_date: editRecord?.appointment_date || new Date().toISOString().split('T')[0],
    details: formatDetailsField(editRecord?.details) || "",
    lab_results: editRecord?.lab_results || {},
    vital_signs: editRecord?.vital_signs || {
      temperature: { value: "", unit: "°C" },
      heart_rate: { value: "", unit: "bpm" },
      blood_pressure: { value: "", unit: "mmHg" },
      respiratory_rate: { value: "", unit: "breaths/min" },
      oxygen_saturation: { value: "", unit: "%" }
    },
    prescriptions: editRecord?.prescriptions || [] as Prescription[]
  });

  // Function to add a new prescription
  const addPrescription = () => {
    const newPrescriptions = [...data.prescriptions, {
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    }];
    setData("prescriptions", newPrescriptions);
  };

  // Function to remove a prescription
  const removePrescription = (index: number) => {
    const newPrescriptions = [...data.prescriptions];
    newPrescriptions.splice(index, 1);
    setData("prescriptions", newPrescriptions);
  };

  // Function to update a prescription field
  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    const newPrescriptions = [...data.prescriptions];
    newPrescriptions[index][field] = value;
    setData("prescriptions", newPrescriptions);
  };

  // Function to update a vital sign
  const updateVitalSign = (field: string, value: string) => {
    const newVitalSigns = { ...data.vital_signs };
    newVitalSigns[field].value = value;
    setData("vital_signs", newVitalSigns);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      put(route('doctor.records.update', editRecord.id), {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    } else {
      post(route('doctor.records.store'), {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Medical Record' : 'Add New Medical Record'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the medical record details.'
              : patient
                ? `Create a new medical record for ${patient.name}.`
                : 'Create a new medical record.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Patient Selection - only show when creating from Records page and no patient is provided */}
            {!patient && patients.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patient_id" className="text-right">
                  Patient
                </Label>
                <Select
                  value={data.patient_id.toString()}
                  onValueChange={(value) => setData('patient_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patient_id && <p className="text-red-500 text-sm col-start-2 col-span-3">{errors.patient_id}</p>}
              </div>
            )}

            {/* Record Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="record_type" className="text-right">
                Record Type
              </Label>
              <Select
                value={data.record_type}
                onValueChange={(value) => setData('record_type', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_record">Medical Record</SelectItem>
                  <SelectItem value="laboratory">Laboratory Results</SelectItem>
                  <SelectItem value="medical_checkup">Medical Checkup</SelectItem>
                </SelectContent>
              </Select>
              {errors.record_type && <p className="text-red-500 text-sm col-start-2 col-span-3">{errors.record_type}</p>}
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={data.status}
                onValueChange={(value) => setData('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-sm col-start-2 col-span-3">{errors.status}</p>}
            </div>

            {/* Appointment Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appointment_date" className="text-right">
                Date
              </Label>
              <Input
                id="appointment_date"
                type="date"
                value={data.appointment_date}
                onChange={(e) => setData('appointment_date', e.target.value)}
                className="col-span-3"
              />
              {errors.appointment_date && <p className="text-red-500 text-sm col-start-2 col-span-3">{errors.appointment_date}</p>}
            </div>

            {/* Details */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details" className="text-right">
                Details
              </Label>
              <Textarea
                id="details"
                value={data.details}
                onChange={(e) => setData('details', e.target.value)}
                className="col-span-3"
                rows={4}
              />
              {errors.details && <p className="text-red-500 text-sm col-start-2 col-span-3">{errors.details}</p>}
            </div>

            {/* Vital Signs */}
            {(data.record_type === 'medical_checkup' || data.record_type === 'medical_record') && (
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right pt-2">
                  Vital Signs
                </Label>
                <div className="col-span-3 space-y-3 border rounded-md p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Temperature (°C)</Label>
                      <Input
                        type="text"
                        value={data.vital_signs.temperature.value}
                        onChange={(e) => updateVitalSign('temperature', e.target.value)}
                        placeholder="e.g. 36.8"
                      />
                    </div>
                    <div>
                      <Label>Heart Rate (bpm)</Label>
                      <Input
                        type="text"
                        value={data.vital_signs.heart_rate.value}
                        onChange={(e) => updateVitalSign('heart_rate', e.target.value)}
                        placeholder="e.g. 72"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Blood Pressure (mmHg)</Label>
                      <Input
                        type="text"
                        value={data.vital_signs.blood_pressure.value}
                        onChange={(e) => updateVitalSign('blood_pressure', e.target.value)}
                        placeholder="e.g. 120/80"
                      />
                    </div>
                    <div>
                      <Label>Respiratory Rate (breaths/min)</Label>
                      <Input
                        type="text"
                        value={data.vital_signs.respiratory_rate.value}
                        onChange={(e) => updateVitalSign('respiratory_rate', e.target.value)}
                        placeholder="e.g. 16"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Oxygen Saturation (%)</Label>
                    <Input
                      type="text"
                      value={data.vital_signs.oxygen_saturation.value}
                      onChange={(e) => updateVitalSign('oxygen_saturation', e.target.value)}
                      placeholder="e.g. 98"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Prescriptions */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-right pt-2">
                <Label>Prescriptions</Label>
              </div>
              <div className="col-span-3 space-y-3">
                {data.prescriptions.map((prescription, index) => (
                  <div key={index} className="border rounded-md p-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removePrescription(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label>Medication</Label>
                        <Input
                          value={prescription.medication}
                          onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                          placeholder="Medication name"
                        />
                      </div>
                      <div>
                        <Label>Dosage</Label>
                        <Input
                          value={prescription.dosage}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label>Frequency</Label>
                        <Input
                          value={prescription.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                          placeholder="e.g. twice daily"
                        />
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input
                          value={prescription.duration}
                          onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                          placeholder="e.g. 7 days"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <Textarea
                        value={prescription.instructions}
                        onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        placeholder="Special instructions"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPrescription}
                  className="w-full"
                >
                  <Pill className="mr-2 h-4 w-4" />
                  Add Prescription
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {isEditing ? 'Update Record' : 'Create Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordForm;
