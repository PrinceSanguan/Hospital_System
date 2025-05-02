import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserData } from '@/types';
import { ArrowLeft, FileText, Calendar, Clock, Edit, Plus, Pill, X, Clipboard, AlertCircle } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import PatientMedicalRecords from '@/components/doctor/PatientMedicalRecords';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface VitalSign {
  name: string;
  value: string;
  unit: string;
}

interface PatientViewProps {
  user: UserData;
  patient: {
    id: number;
    name: string;
    email: string;
    created_at: string;
    patientRecords: Array<{
      id: number;
      record_type: string;
      details: string;
      status: string;
      created_at: string;
      appointment_date?: string;
      prescriptions?: Prescription[];
      vital_signs?: Record<string, VitalSign>;
    }>;
    recordStats: {
      total: number;
      pending: number;
      completed: number;
    };
    groupedRecords: {
      all: Array<any>;
      medical_records: Array<any>;
      checkups: Array<any>;
      lab_results: Array<any>;
      pending: Array<any>;
      completed: Array<any>;
    };
  };
}

// Error Boundary Component
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PatientView error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-4 text-gray-700">There was an error loading the patient data.</p>
          <pre className="bg-gray-100 p-4 rounded text-sm text-left overflow-auto max-h-40">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const PatientView = ({ user, patient }: PatientViewProps) => {
  // State for the dialog
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewingRecord, setIsViewingRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [activeRecordType, setActiveRecordType] = useState('all');

  // Inertia form handler
  const { data, setData, post, processing, reset } = useForm({
    patient_id: patient.id.toString(),
    assigned_doctor_id: user.id ? user.id.toString() : "",
    record_type: "medical_record",
    status: "completed",
    appointment_date: new Date().toISOString().split('T')[0],
    details: "",
    lab_results: {},
    vital_signs: {
      temperature: { value: "", unit: "°C" },
      heart_rate: { value: "", unit: "bpm" },
      blood_pressure: { value: "", unit: "mmHg" },
      respiratory_rate: { value: "", unit: "breaths/min" },
      oxygen_saturation: { value: "", unit: "%" }
    },
    prescriptions: [] as Prescription[]
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
  const updateVitalSign = (key: string, value: string) => {
    const newVitalSigns = { ...data.vital_signs };
    newVitalSigns[key].value = value;
    setData("vital_signs", newVitalSigns);
  };

  // Function to view a record
  const viewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewingRecord(true);
  };

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post(route('doctor.records.store'), {
      onSuccess: () => {
        reset();
        setIsCreateModalOpen(false);
      }
    });
  };

  // Get active records based on selected type
  const getActiveRecords = () => {
    if (!patient.groupedRecords) return [];

    switch (activeRecordType) {
      case 'medical_records':
        return patient.groupedRecords.medical_records || [];
      case 'checkups':
        return patient.groupedRecords.checkups || [];
      case 'lab_results':
        return patient.groupedRecords.lab_results || [];
      case 'pending':
        return patient.groupedRecords.pending || [];
      case 'completed':
        return patient.groupedRecords.completed || [];
      case 'all':
      default:
        return patient.groupedRecords.all || [];
    }
  };

  // Get formatted record type label
  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'medical_record':
        return 'Medical Record';
      case 'medical_checkup':
        return 'Medical Checkup';
      case 'laboratory':
        return 'Laboratory Results';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };

  const activeRecords = getActiveRecords();

  // Add validation for patient data
  useEffect(() => {
    // Log the structure for debugging
    console.log("Patient data:", patient);
  }, [patient]);

  return (
    <DoctorLayout user={user}>
      <Head title={`Patient: ${patient.name}`} />
      <ErrorBoundary>
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mb-6">
              <Button asChild variant="outline" className="mb-4">
                <Link href={route('doctor.patients.index')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patients
                </Link>
              </Button>

              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Patient Profile: {patient.name}</h1>
                <Button asChild>
                  <Link href="#">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Patient
                  </Link>
                </Button>
              </div>
            </div>

            {/* Patient Information */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-base">{patient.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-base">{patient.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Registered Since</h3>
                    <p className="mt-1 text-base">{new Date(patient.created_at).toLocaleDateString()}</p>
                  </div>
                  {patient.recordStats && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Records</h3>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline">{patient.recordStats.total} Total</Badge>
                        <Badge variant="outline" className="bg-yellow-50">{patient.recordStats.pending} Pending</Badge>
                        <Badge variant="outline" className="bg-green-50">{patient.recordStats.completed} Completed</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Medical Records and Appointments */}
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="records" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Medical Records
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="records">
                <PatientMedicalRecords
                  records={Array.isArray(patient.patientRecords) ? patient.patientRecords : []}
                  onAddRecord={() => setIsCreateModalOpen(true)}
                />

                {/* Create Record Dialog */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Medical Record</DialogTitle>
                      <DialogDescription>
                        Create a new medical record for {patient.name}.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4 py-4">
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
                        </div>

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
                            </SelectContent>
                          </Select>
                        </div>

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
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="details" className="text-right pt-2">
                            Details
                          </Label>
                          <Textarea
                            id="details"
                            value={data.details}
                            onChange={(e) => setData('details', e.target.value)}
                            placeholder="Enter record details, diagnosis, and treatment plan"
                            className="col-span-3 min-h-[100px]"
                          />
                        </div>

                        {/* Vital Signs Section */}
                        <div className="border-t pt-4 mt-2">
                          <h3 className="font-medium text-md mb-3">Vital Signs</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="temperature">Temperature</Label>
                              <div className="flex">
                                <Input
                                  id="temperature"
                                  value={data.vital_signs.temperature.value}
                                  onChange={(e) => updateVitalSign('temperature', e.target.value)}
                                  placeholder="36.5"
                                />
                                <span className="ml-2 flex items-center text-sm text-gray-500">°C</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="heart_rate">Heart Rate</Label>
                              <div className="flex">
                                <Input
                                  id="heart_rate"
                                  value={data.vital_signs.heart_rate.value}
                                  onChange={(e) => updateVitalSign('heart_rate', e.target.value)}
                                  placeholder="72"
                                />
                                <span className="ml-2 flex items-center text-sm text-gray-500">bpm</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="blood_pressure">Blood Pressure</Label>
                              <div className="flex">
                                <Input
                                  id="blood_pressure"
                                  value={data.vital_signs.blood_pressure.value}
                                  onChange={(e) => updateVitalSign('blood_pressure', e.target.value)}
                                  placeholder="120/80"
                                />
                                <span className="ml-2 flex items-center text-sm text-gray-500">mmHg</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="respiratory_rate">Respiratory Rate</Label>
                              <div className="flex">
                                <Input
                                  id="respiratory_rate"
                                  value={data.vital_signs.respiratory_rate.value}
                                  onChange={(e) => updateVitalSign('respiratory_rate', e.target.value)}
                                  placeholder="16"
                                />
                                <span className="ml-2 flex items-center text-sm text-gray-500">breaths/min</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="oxygen_saturation">Oxygen Saturation</Label>
                              <div className="flex">
                                <Input
                                  id="oxygen_saturation"
                                  value={data.vital_signs.oxygen_saturation.value}
                                  onChange={(e) => updateVitalSign('oxygen_saturation', e.target.value)}
                                  placeholder="98"
                                />
                                <span className="ml-2 flex items-center text-sm text-gray-500">%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Prescriptions Section */}
                        <div className="border-t pt-4 mt-2">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium text-md">Prescriptions</h3>
                            <Button
                              type="button"
                              onClick={addPrescription}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Prescription
                            </Button>
                          </div>

                          {data.prescriptions.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 border rounded-md">
                              No prescriptions added yet
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {data.prescriptions.map((prescription, index) => (
                                <div key={index} className="border rounded-md p-4 relative">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 h-7 w-7 p-0"
                                    onClick={() => removePrescription(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>

                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                      <Label>Medication</Label>
                                      <Input
                                        value={prescription.medication}
                                        onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                                        placeholder="Medication name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Dosage</Label>
                                      <Input
                                        value={prescription.dosage}
                                        onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                                        placeholder="e.g., 500mg"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Frequency</Label>
                                      <Input
                                        value={prescription.frequency}
                                        onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                                        placeholder="e.g., Twice daily"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Duration</Label>
                                      <Input
                                        value={prescription.duration}
                                        onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                                        placeholder="e.g., 7 days"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Special Instructions</Label>
                                    <Input
                                      value={prescription.instructions}
                                      onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                                      placeholder="e.g., Take with food"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                          Save Record
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* View Record Dialog */}
                <Dialog open={isViewingRecord} onOpenChange={setIsViewingRecord}>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Medical Record Details</DialogTitle>
                    </DialogHeader>

                    {selectedRecord && (
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-medium">
                              {selectedRecord.record_type === 'medical_checkup' ? 'Medical Checkup' :
                               selectedRecord.record_type === 'laboratory' ? 'Laboratory Results' :
                               'Medical Record'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(selectedRecord.appointment_date || selectedRecord.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`${
                            selectedRecord.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            selectedRecord.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                            'bg-red-100 text-red-800 hover:bg-red-100'
                          }`}>
                            {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium">Details</h4>
                          <div className="mt-2 text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded">
                            {selectedRecord.details || "No details provided"}
                          </div>
                        </div>

                        {selectedRecord.vital_signs && Object.keys(selectedRecord.vital_signs).length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-2">Vital Signs</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(selectedRecord.vital_signs).map(([key, value]: [string, any]) => (
                                value.value && (
                                  <div key={key} className="bg-gray-50 p-2 rounded flex justify-between">
                                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                                    <span>{value.value} {value.unit}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-2">Prescriptions</h4>
                            <div className="space-y-3">
                              {selectedRecord.prescriptions.map((prescription: Prescription, index: number) => (
                                <div key={index} className="border p-3 rounded">
                                  <div className="flex justify-between">
                                    <h5 className="font-medium">{prescription.medication}</h5>
                                    <span>{prescription.dosage}</span>
                                  </div>
                                  <div className="mt-1 text-sm">
                                    <p><span className="text-gray-600">Frequency:</span> {prescription.frequency}</p>
                                    <p><span className="text-gray-600">Duration:</span> {prescription.duration}</p>
                                    {prescription.instructions && (
                                      <p className="mt-1 flex items-start gap-1">
                                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                                        <span>{prescription.instructions}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsViewingRecord(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="appointments">
                <Card>
                  <CardHeader className="pb-2 flex justify-between items-center">
                    <CardTitle>Appointments</CardTitle>
                    <Button asChild>
                      <Link href={route('doctor.appointments.index')}>
                        Schedule Appointment
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!patient.groupedRecords || !patient.groupedRecords.checkups || !Array.isArray(patient.groupedRecords.checkups) || patient.groupedRecords.checkups.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No appointments scheduled for this patient.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {patient.groupedRecords.checkups.map(appointment => (
                          <div key={appointment.id} className="py-4">
                            <div className="flex justify-between mb-2">
                              <h3 className="font-medium">Appointment</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{appointment.details}</p>
                            {appointment.appointment_date && (
                              <div className="flex items-center text-sm font-medium text-blue-600 mb-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(appointment.appointment_date).toLocaleString()}
                              </div>
                            )}
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Created: {new Date(appointment.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ErrorBoundary>
    </DoctorLayout>
  );
};

export default PatientView;
