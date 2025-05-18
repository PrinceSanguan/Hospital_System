import React, { useState, useEffect } from 'react';
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
import { Pill, X, Printer, Search } from 'lucide-react';
import axios from 'axios';

// Sample medications for search dropdown - in production, this would come from your API
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

interface RecordData {
  id: string;
  patient_id: string;
  record_type: string;
  status: string;
  appointment_date: string;
  details: string;
  lab_results: Record<string, unknown>;
  reference_number: string;
  vital_signs: {
    temperature: VitalSign;
    heart_rate: VitalSign;
    blood_pressure: VitalSign;
    respiratory_rate: VitalSign;
    oxygen_saturation: VitalSign;
  };
  prescriptions: Prescription[];
}

interface RecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: RecordData | null;
  patient?: Patient | null;
  patients?: Patient[]; // For selection when creating from Records page
  user?: { name: string; email: string; }; // Add user to props
}

// Toast notification function
const toast = (message: { title: string; description: string; status: string }) => {
  // Simple implementation that just shows an alert
  alert(`${message.title}: ${message.description}`);
};

const RecordForm: React.FC<RecordFormProps> = ({
  isOpen,
  onClose,
  editRecord = null,
  patient = null,
  patients = [],
  user = { name: 'Doctor', email: '' } // Default user value
}) => {
  const isEditing = !!editRecord;
  const [medicationSearchOpen, setMedicationSearchOpen] = useState<number | null>(null);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [formData, setFormData] = useState<any>({
    id: "",
    patient_id: "",
    record_type: "medical_record",
    status: "completed",
    appointment_date: new Date().toISOString().split('T')[0],
    details: "",
    lab_results: {},
    reference_number: "",
    vital_signs: {
      temperature: { value: "", unit: "°C" },
      heart_rate: { value: "", unit: "bpm" },
      blood_pressure: { value: "", unit: "mmHg" },
      respiratory_rate: { value: "", unit: "breaths/min" },
      oxygen_saturation: { value: "", unit: "%" }
    },
    prescriptions: [] as Prescription[]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Initialize form data from editRecord or patient
  useEffect(() => {
    if (isOpen) {
      let initialData = { ...formData };
      if (isEditing && editRecord) {
        // Format details for readability if it's JSON
        let details = editRecord.details;
        try {
          const parsedDetails = JSON.parse(editRecord.details);
          if (typeof parsedDetails === 'object') {
            // Convert to readable format for display
            let formattedDetails = '';
            Object.entries(parsedDetails).forEach(([key, value]) => {
              const readableKey = key.replace(/_/g, ' ');
              formattedDetails += `${readableKey}: ${value}\n`;
            });
            details = formattedDetails;
          }
        } catch {
          // Not JSON, use as is
        }

        initialData = {
          id: editRecord.id || "",
          patient_id: editRecord.patient_id || "",
          record_type: editRecord.record_type || "medical_record",
          status: editRecord.status || "completed",
          appointment_date: editRecord.appointment_date ?
            new Date(editRecord.appointment_date).toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0],
          details: details,
          lab_results: editRecord.lab_results || {},
          reference_number: editRecord.reference_number || "",
          vital_signs: editRecord.vital_signs || {
            temperature: { value: "", unit: "°C" },
            heart_rate: { value: "", unit: "bpm" },
            blood_pressure: { value: "", unit: "mmHg" },
            respiratory_rate: { value: "", unit: "breaths/min" },
            oxygen_saturation: { value: "", unit: "%" }
          },
          prescriptions: editRecord.prescriptions || []
        };
      } else if (patient) {
        // New record for a specific patient
        initialData = {
          ...initialData,
          patient_id: patient.id.toString(),
          reference_number: generateReferenceNumber(patient.id)
        };
      }

      setFormData(initialData);
    }
  }, [isOpen, editRecord, patient]);

  // Generate a unique reference number
  const generateReferenceNumber = (patientId: number): string => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `REF-${year}${month}${day}-${patientId}-${randomDigits}`;
  };

  // Form field change handler
  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Function to add a new prescription
  const addPrescription = () => {
    const newPrescription = {
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    };

    setFormData({
      ...formData,
      prescriptions: [...formData.prescriptions, newPrescription]
    });
  };

  // Function to remove a prescription
  const removePrescription = (index: number) => {
    const updatedPrescriptions = [...formData.prescriptions];
    updatedPrescriptions.splice(index, 1);

    setFormData({
      ...formData,
      prescriptions: updatedPrescriptions
    });
  };

  // Function to update a prescription field
  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    const updatedPrescriptions = [...formData.prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value
    };

    setFormData({
      ...formData,
      prescriptions: updatedPrescriptions
    });
  };

  // Function to update a vital sign
  const updateVitalSign = (field: string, value: string) => {
    const updatedVitalSigns = { ...formData.vital_signs };
    updatedVitalSigns[field] = {
      ...updatedVitalSigns[field],
      value: value
    };

    setFormData({
      ...formData,
      vital_signs: updatedVitalSigns
    });
  };

  // Convert display details back to original format for submission
  const prepareDetailsForSubmission = (displayDetails: string): string => {
    if (!editRecord || !editRecord.details) return displayDetails;

    // If original was JSON and current differs only in formatting, use original
    try {
      // Check if the original was JSON
      const originalJson = JSON.parse(editRecord.details);

      // Simple check: if display version looks like our formatting and hasn't been edited further
      const formattedLines = Object.entries(originalJson).map(([key, value]) =>
        `${key.replace(/_/g, ' ')}: ${value}`
      );

      // Create a normalized version for comparison (removing extra spaces, line breaks)
      const normalizedFormatted = formattedLines.join('\n').replace(/\s+/g, ' ').trim();
      const normalizedDisplay = displayDetails.replace(/\s+/g, ' ').trim();

      // If they match in content (ignoring formatting), return the original JSON
      if (normalizedFormatted === normalizedDisplay) {
        return editRecord.details;
      }
    } catch {
      // Not JSON, continue
    }

    return displayDetails;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setFormErrors({});

    try {
      // Prepare data for submission (restore original JSON if needed)
      const submissionData = {
        ...formData,
        details: prepareDetailsForSubmission(formData.details)
      };

      let response;
    if (isEditing) {
        // For editing, use axios directly
        response = await axios.put(
          route('doctor.records.update', submissionData.id),
          submissionData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          }
        );

        if (response.data.success) {
          toast({
            title: "Success",
            description: "Record updated successfully",
            status: "success"
          });
          onClose();
        } else {
          setFormErrors(response.data.errors || {});
          toast({
            title: "Error",
            description: response.data.message || "Failed to update the record",
            status: "error"
          });
        }
      } else {
        // For new records, use axios too for consistency
        response = await axios.post(
          route('doctor.records.store'),
          submissionData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          }
        );

        if (response.data.success) {
          toast({
            title: "Success",
            description: "Record created successfully",
            status: "success"
          });
          onClose();
        } else {
          setFormErrors(response.data.errors || {});
          toast({
            title: "Error",
            description: response.data.message || "Failed to create the record",
            status: "error"
          });
        }
      }
    } catch (error: any) {
      console.error('Error saving record:', error);

      // Extract validation errors if available
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }

      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save the record. Please check the form and try again.",
        status: "error"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle print prescription
  const handlePrintPrescription = () => {
    setIsPrintReady(true);
    setTimeout(() => {
      window.print();
      setIsPrintReady(false);
    }, 100);
  };

  // Print styles
  useEffect(() => {
    if (isPrintReady) {
      const style = document.createElement('style');
      style.id = 'print-styles';
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-prescription, .print-prescription * {
            visibility: visible !important;
            display: block !important;
          }
          .print-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 20px;
            margin: 0;
            color: black !important;
            background: white !important;
            font-family: Arial, sans-serif !important;
            line-height: 1.5 !important;
          }
          .no-print {
            display: none !important;
          }

          /* Professional prescription format */
          .prescription-header {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
            text-align: center;
          }
          .prescription-header h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            margin-top: 0;
          }
          .prescription-header h2 {
            font-size: 14px;
            font-weight: normal;
            margin-bottom: 5px;
            margin-top: 0;
          }
          .prescription-patient-info {
            margin-bottom: 20px;
          }
          .prescription-patient-info p {
            margin: 5px 0;
            line-height: 1.4;
          }
          .prescription-patient-info p strong {
            display: inline-block;
            min-width: 120px;
            font-weight: bold;
          }
          .prescription-rx {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            font-style: italic;
          }
          .prescription-items {
            margin-bottom: 20px;
          }
          .prescription-items table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .prescription-items th {
            text-align: left;
            border-bottom: 1px solid #333;
            padding: 8px 10px;
            font-weight: bold;
          }
          .prescription-items td {
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
          }
          .prescription-instructions {
            margin-top: 20px;
            margin-bottom: 20px;
          }
          .prescription-instructions h3 {
            font-weight: bold;
            margin-bottom: 10px;
            margin-top: 0;
          }
          .prescription-instructions p {
            margin: 5px 0;
            line-height: 1.4;
          }
          .prescription-footer {
            margin-top: 40px;
            text-align: right;
          }
          .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin-left: auto;
            padding-top: 5px;
            text-align: center;
          }
          .prescription-date {
            margin-top: 30px;
            text-align: left;
          }

          @page {
            size: 8.5in 11in;
            margin: 0.5in;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleElement = document.getElementById('print-styles');
        if (styleElement) {
          document.head.removeChild(styleElement);
        }
      };
    }
  }, [isPrintReady]);

  // Get patient info
  const getPatientInfo = () => {
    if (patient) {
      return patient;
    } else if (patients.length > 0 && formData.patient_id) {
      const selectedPatientId = parseInt(formData.patient_id.toString());
      return patients.find(p => p.id === selectedPatientId) || null;
    }
    return null;
  };

  // Get formatted date
  const getFormattedDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Record' : 'New Record'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this medical record.' : 'Create a new medical record for the patient.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Patient Selection - only show if no patient is provided */}
            {!patient && patients.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patient" className="text-right">
                  Patient
                </Label>
                <Select
                  value={formData.patient_id?.toString() || ""}
                  onValueChange={(value) => handleChange('patient_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.patient_id && <p className="text-red-500 text-sm col-start-2 col-span-3">{formErrors.patient_id}</p>}
              </div>
            )}

            {/* Record Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="record_type" className="text-right">
                Record Type
              </Label>
              <Select
                value={formData.record_type || "medical_record"}
                onValueChange={(value) => handleChange('record_type', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_record">Medical Record</SelectItem>
                  <SelectItem value="medical_checkup">Medical Checkup</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.record_type && <p className="text-red-500 text-sm col-start-2 col-span-3">{formErrors.record_type}</p>}
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status || "completed"}
                onValueChange={(value) => handleChange('status', value)}
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
              {formErrors.status && <p className="text-red-500 text-sm col-start-2 col-span-3">{formErrors.status}</p>}
            </div>

        {/* Reference Number */}
        <div className="hidden">
            <Label htmlFor="reference_number" className="text-right">
                Reference
            </Label>
            <Input
                id="reference_number"
                value={formData.reference_number || ""}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                className="col-span-3"
            />
            {formErrors.reference_number && (
                <div className="col-start-2 col-span-3">
                <p className="text-red-500 text-sm">{formErrors.reference_number}</p>
                </div>
            )}
        </div>

            {/* Appointment Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appointment_date" className="text-right">
                Date
              </Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date || ""}
                onChange={(e) => handleChange('appointment_date', e.target.value)}
                className="col-span-3"
              />
              {formErrors.appointment_date && <p className="text-red-500 text-sm col-start-2 col-span-3">{formErrors.appointment_date}</p>}
            </div>

            {/* Details */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details" className="text-right">
                Details
              </Label>
              <Textarea
                id="details"
                value={formData.details || ""}
                onChange={(e) => handleChange('details', e.target.value)}
                className="col-span-3"
                rows={4}
              />
              {formErrors.details && <p className="text-red-500 text-sm col-start-2 col-span-3">{formErrors.details}</p>}
            </div>

            {/* Medical Records (formerly Vital Signs) */}
            {(formData.record_type === 'medical_checkup' || formData.record_type === 'medical_record') && (
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right pt-2">
                  Medical Records
                </Label>
                <div className="col-span-3 space-y-3 border rounded-md p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Temperature (°C)</Label>
                      <Input
                        type="text"
                        value={formData.vital_signs?.temperature?.value || ""}
                        onChange={(e) => updateVitalSign('temperature', e.target.value)}
                        placeholder="e.g. 36.8"
                      />
                    </div>
                    <div>
                      <Label>Heart Rate (bpm)</Label>
                      <Input
                        type="text"
                        value={formData.vital_signs?.heart_rate?.value || ""}
                        onChange={(e) => updateVitalSign('heart_rate', e.target.value)}
                        placeholder="e.g. 72"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Blood Pressure(mmHg)</Label>
                      <Input
                        type="text"
                        value={formData.vital_signs?.blood_pressure?.value || ""}
                        onChange={(e) => updateVitalSign('blood_pressure', e.target.value)}
                        placeholder="e.g. 120/80"
                      />
                    </div>
                    <div>
                      <Label>Respiratory Rate (breaths/min)</Label>
                      <Input
                        type="text"
                        value={formData.vital_signs?.respiratory_rate?.value || ""}
                        onChange={(e) => updateVitalSign('respiratory_rate', e.target.value)}
                        placeholder="e.g. 16"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Oxygen Saturation (%)</Label>
                    <Input
                      type="text"
                      value={formData.vital_signs?.oxygen_saturation?.value || ""}
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
                {formData.prescriptions?.map((prescription: Prescription, index: number) => (
                  <div key={index} className="border rounded-md p-3 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 no-print"
                      onClick={() => removePrescription(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label>Medication</Label>
                        <div className="relative">
                        <Input
                            value={prescription.medication || ""}
                            onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                            placeholder="Search medication..."
                            className="pr-8"
                            onClick={() => setMedicationSearchOpen(index)}
                          />
                          <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
                          {medicationSearchOpen === index && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  placeholder="Filter medications..."
                                  className="w-full p-2 border border-gray-300 rounded-md mb-2"
                                  value={prescription.medication || ""}
                          onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                                />
                              </div>
                              <ul>
                                {MEDICATIONS.filter(med =>
                                  med.toLowerCase().includes((prescription.medication || "").toLowerCase())
                                ).map(medication => (
                                  <li
                                    key={medication}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      updatePrescription(index, 'medication', medication);
                                      setMedicationSearchOpen(null);
                                    }}
                                  >
                                    {medication}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Dosage</Label>
                        <Input
                          value={prescription.dosage || ""}
                          onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={prescription.frequency || ""}
                          onValueChange={(value) => updatePrescription(index, 'frequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input
                          value={prescription.duration || ""}
                          onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                          placeholder="e.g. 7 days"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <Textarea
                        value={prescription.instructions || ""}
                        onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        placeholder="Special instructions"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPrescription}
                    className="w-full no-print"
                >
                  <Pill className="mr-2 h-4 w-4" />
                  Add Prescription
                </Button>

                  {formData.prescriptions?.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePrintPrescription}
                      className="no-print"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Prescription
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Printable Prescription Format */}
          <div className="print-prescription" style={{ display: isPrintReady ? 'block' : 'none' }}>
            <div className="prescription-header">
              <h1>Famcare Medical Center</h1>
              <h2>123 Medical Drive, Healthcare City, HC 12345 • Phone: (123) 456-7890</h2>
            </div>

            <div className="prescription-patient-info">
              <p><strong>Patient:</strong> {getPatientInfo()?.name || 'Not specified'}</p>
              <p><strong>Email:</strong> {getPatientInfo()?.email || 'Not specified'}</p>
              <p><strong>Reference:</strong> {formData.reference_number || 'Not specified'}</p>
              <p><strong>Date:</strong> {getFormattedDate()}</p>
            </div>

            <div className="prescription-rx">Rx</div>

            {formData.prescriptions?.length > 0 ? (
              <div className="prescription-items">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Medication</th>
                      <th style={{ width: '20%' }}>Dosage</th>
                      <th style={{ width: '25%' }}>Frequency</th>
                      <th style={{ width: '25%' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.prescriptions.map((prescription: Prescription, idx: number) => (
                      <tr key={idx}>
                        <td>{prescription.medication || '---'}</td>
                        <td>{prescription.dosage || '---'}</td>
                        <td>{prescription.frequency || '---'}</td>
                        <td>{prescription.duration || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Instructions section */}
                <div className="prescription-instructions">
                  <h3>Instructions:</h3>
                  {formData.prescriptions.some((p: Prescription) => p.instructions) ? (
                    formData.prescriptions.map((prescription: Prescription, idx: number) => (
                      prescription.instructions && (
                        <div key={idx}>
                          <p><strong>{prescription.medication}:</strong> {prescription.instructions}</p>
                        </div>
                      )
                    ))
                  ) : (
                    <p>No specific instructions provided.</p>
                  )}
                </div>
              </div>
            ) : (
              <p>No prescriptions have been added to this record.</p>
            )}

            <div className="prescription-footer">
              <div className="signature-line">Dr. {user?.name || 'Doctor'}</div>
            </div>

            <div className="prescription-date">
              <p>Date: {getFormattedDate()}</p>
            </div>
          </div>

          <DialogFooter className="no-print">
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
