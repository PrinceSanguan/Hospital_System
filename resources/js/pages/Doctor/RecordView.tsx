import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserData } from '@/types';
import { ArrowLeft, Edit, Calendar, Clock, Pill, User } from 'lucide-react';

interface VitalSign {
  name: string;
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

interface PatientRecord {
  id: number;
  patient_id: number;
  assigned_doctor_id: number;
  record_type: string;
  status: string;
  details: string;
  appointment_date: string;
  created_at: string;
  updated_at: string;
  vital_signs?: Record<string, VitalSign>;
  prescriptions?: Prescription[];
  lab_results?: Record<string, unknown>;
}

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface RecordViewProps {
  user: UserData;
  record: PatientRecord;
  patient: Patient;
}

export default function RecordView({ user, record, patient }: RecordViewProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get record type label
  const getRecordTypeLabel = (type: string): string => {
    switch (type) {
      case 'medical_record':
        return 'Medical Record';
      case 'medical_checkup':
        return 'Medical Checkup';
      case 'laboratory':
        return 'Laboratory Test';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };

  // Get status label with appropriate styling
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = 'default';

    switch (status) {
      case 'completed':
        variant = 'default';
        break;
      case 'pending':
        variant = 'outline';
        break;
      case 'cancelled':
        variant = 'destructive';
        break;
    }

    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Add this function to parse and display details in a formatted way
  const formatDetails = (details: string) => {
    try {
      // Try to parse the details as JSON
      const detailsObj = JSON.parse(details);

      return (
        <div className="space-y-4">
          {/* Appointment Details */}
          {detailsObj.appointment_time && (
            <div className="flex gap-2 items-start">
              <span className="font-medium w-32">Appointment Time:</span>
              <span>{detailsObj.appointment_time}</span>
            </div>
          )}

          {/* Reason for Visit */}
          {detailsObj.reason && (
            <div className="flex gap-2 items-start">
              <span className="font-medium w-32">Reason:</span>
              <span>{detailsObj.reason}</span>
            </div>
          )}

          {/* Notes */}
          {detailsObj.notes && (
            <div className="flex gap-2 items-start">
              <span className="font-medium w-32">Notes:</span>
              <span>{detailsObj.notes}</span>
            </div>
          )}

          {/* Patient Info */}
          {detailsObj.patient_info && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                {detailsObj.patient_info.name && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Name:</span>
                    <span>{detailsObj.patient_info.name}</span>
                  </div>
                )}
                {detailsObj.patient_info.age && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Age:</span>
                    <span>{detailsObj.patient_info.age}</span>
                  </div>
                )}
                {detailsObj.patient_info.height && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Height:</span>
                    <span>{detailsObj.patient_info.height} cm</span>
                  </div>
                )}
                {detailsObj.patient_info.weight && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Weight:</span>
                    <span>{detailsObj.patient_info.weight} kg</span>
                  </div>
                )}
                {detailsObj.patient_info.bmi && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">BMI:</span>
                    <span>{detailsObj.patient_info.bmi}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vital Signs from details (if not in separate vital_signs object) */}
          {(detailsObj.temperature || detailsObj.pulse_rate || detailsObj.respiratory_rate ||
            detailsObj.blood_pressure || detailsObj.oxygen_saturation) && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Vital Signs</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                {detailsObj.temperature && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Temperature:</span>
                    <span>{detailsObj.temperature}°C</span>
                  </div>
                )}
                {detailsObj.pulse_rate && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Pulse Rate:</span>
                    <span>{detailsObj.pulse_rate} bpm</span>
                  </div>
                )}
                {detailsObj.respiratory_rate && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Respiratory Rate:</span>
                    <span>{detailsObj.respiratory_rate} breaths/min</span>
                  </div>
                )}
                {detailsObj.blood_pressure && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Blood Pressure:</span>
                    <span>{detailsObj.blood_pressure} mmHg</span>
                  </div>
                )}
                {detailsObj.oxygen_saturation && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Oxygen Saturation:</span>
                    <span>{detailsObj.oxygen_saturation}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          {detailsObj.doctor_notes && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Doctor's Notes</h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p>{detailsObj.doctor_notes}</p>
              </div>
            </div>
          )}

          {/* Completion Information */}
          {(detailsObj.completed_at || detailsObj.completed_by) && (
            <div className="mt-4 text-sm text-gray-500">
              {detailsObj.completed_by && <div>Completed by: {detailsObj.completed_by}</div>}
              {detailsObj.completed_at && <div>Completed at: {new Date(detailsObj.completed_at).toLocaleString()}</div>}
            </div>
          )}
        </div>
      );
    } catch {
      // If it's not valid JSON, return the raw text
      return <p className="whitespace-pre-wrap">{details}</p>;
    }
  };

  return (
    <DoctorLayout user={user}>
      <Head title={`Medical Record - ${patient.name}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={route('doctor.records.index')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Records
                </Link>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={route('doctor.records.edit', { id: record.id })}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Record
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Record Info */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{getRecordTypeLabel(record.record_type)}</CardTitle>
                      <CardDescription>Record ID: {record.id}</CardDescription>
                    </div>
                    <div>{renderStatusBadge(record.status)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Appointment Date: {formatDate(record.appointment_date)}</span>
                    </div>
                    <div className="flex gap-2 items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Created: {formatDate(record.created_at)}</span>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-medium text-lg">Details</h3>
                      <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                        {formatDetails(record.details)}
                      </div>
                    </div>

                    {/* Vital Signs */}
                    {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
                      <div className="mt-2">
                        <h3 className="font-medium text-lg">Vital Signs</h3>
                        <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(record.vital_signs).map(([key, data]) => (
                              data.value && (
                                <div key={key} className="flex flex-col">
                                  <span className="text-sm text-gray-500">{key.replace('_', ' ').toUpperCase()}</span>
                                  <span className="font-medium">{data.value} {data.unit}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lab Results */}
                    {record.lab_results && Object.keys(record.lab_results).length > 0 && (
                      <div className="mt-2">
                        <h3 className="font-medium text-lg">Laboratory Results</h3>
                        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(record.lab_results).map(([key, value]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-sm text-gray-500">{key.replace('_', ' ').toUpperCase()}</span>
                                <span className="font-medium">{value as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prescriptions */}
                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div className="mt-2">
                        <h3 className="font-medium text-lg">Prescriptions</h3>
                        <div className="mt-2 space-y-4">
                          {record.prescriptions.map((prescription, index) => (
                            <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-900/30">
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{prescription.medication}</span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Dosage:</span> {prescription.dosage}
                                </div>
                                <div>
                                  <span className="text-gray-500">Frequency:</span> {prescription.frequency}
                                </div>
                                <div>
                                  <span className="text-gray-500">Duration:</span> {prescription.duration}
                                </div>
                                {prescription.instructions && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Instructions:</span> {prescription.instructions}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient Info */}
            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">{patient.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div>{patient.email}</div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={route('doctor.patients.show', patient.id)}>
                          View Patient Profile
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
