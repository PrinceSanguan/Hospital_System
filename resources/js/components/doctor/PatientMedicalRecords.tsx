import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Pill, AlertCircle } from 'lucide-react';

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
  record_type: string;
  details: string;
  status: string;
  created_at: string;
  appointment_date?: string;
  prescriptions?: Prescription[];
  vital_signs?: Record<string, VitalSign>;
}

interface PatientMedicalRecordsProps {
  records: PatientRecord[];
  onAddRecord: () => void;
}

const PatientMedicalRecords: React.FC<PatientMedicalRecordsProps> = ({ records, onAddRecord }) => {
  const [activeRecordType, setActiveRecordType] = useState('all');
  const [isViewingRecord, setIsViewingRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);

  // Get filtered records based on selected type
  const getFilteredRecords = () => {
    if (!records) return [];

    switch (activeRecordType) {
      case 'medical_record':
        return records.filter(record => record.record_type === 'medical_record');
      case 'medical_checkup':
        return records.filter(record => record.record_type === 'medical_checkup');
      case 'laboratory':
        return records.filter(record => record.record_type === 'laboratory');
      case 'pending':
        return records.filter(record => record.status === 'pending');
      case 'completed':
        return records.filter(record => record.status === 'completed');
      case 'all':
      default:
        return records;
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

  // Format details for display in the records list
  const formatDetailsPreview = (details: string) => {
    if (!details) return "No details provided";

    try {
      // Check if it's a JSON string
      if (details.trim().startsWith('{') && details.trim().endsWith('}')) {
        const parsedDetails = JSON.parse(details);

        // Format based on content
        if (parsedDetails.reason) {
          return `Reason: ${parsedDetails.reason}`;
        } else if (parsedDetails.notes) {
          return parsedDetails.notes;
        } else if (parsedDetails.doctor_notes) {
          return `Doctor's note: ${parsedDetails.doctor_notes}`;
        }
      }
    } catch {
      // If parsing fails, return the original string
    }

    return details;
  };

  // Parse and display formatted details for the record dialog
  const renderDetailedView = (details: string) => {
    if (!details) return <p>No details provided</p>;

    try {
      // Check if it's a JSON string
      if (details.trim().startsWith('{') && details.trim().endsWith('}')) {
        const parsedDetails = JSON.parse(details);

        return (
          <div className="space-y-4">
            {parsedDetails.appointment_time && (
              <div className="flex gap-2">
                <span className="font-medium">Appointment Time:</span>
                <span>{parsedDetails.appointment_time}</span>
              </div>
            )}

            {parsedDetails.reason && (
              <div className="flex gap-2">
                <span className="font-medium">Reason:</span>
                <span>{parsedDetails.reason}</span>
              </div>
            )}

            {parsedDetails.notes && (
              <div className="flex gap-2">
                <span className="font-medium">Notes:</span>
                <span>{parsedDetails.notes}</span>
              </div>
            )}

            {parsedDetails.doctor_notes && (
              <div className="flex gap-2">
                <span className="font-medium">Doctor Notes:</span>
                <span>{parsedDetails.doctor_notes}</span>
              </div>
            )}

            {/* Patient Info Section */}
            {parsedDetails.patient_info && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <h5 className="font-medium mb-2">Patient Information</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {parsedDetails.patient_info.name && (
                    <div>
                      <span className="text-gray-600">Name:</span> {parsedDetails.patient_info.name}
                    </div>
                  )}
                  {parsedDetails.patient_info.birthdate && (
                    <div>
                      <span className="text-gray-600">Birthdate:</span> {new Date(parsedDetails.patient_info.birthdate).toLocaleDateString()}
                    </div>
                  )}
                  {parsedDetails.patient_info.age && (
                    <div>
                      <span className="text-gray-600">Age:</span> {parsedDetails.patient_info.age}
                    </div>
                  )}
                  {parsedDetails.patient_info.height && (
                    <div>
                      <span className="text-gray-600">Height:</span> {parsedDetails.patient_info.height} cm
                    </div>
                  )}
                  {parsedDetails.patient_info.weight && (
                    <div>
                      <span className="text-gray-600">Weight:</span> {parsedDetails.patient_info.weight} kg
                    </div>
                  )}
                  {parsedDetails.patient_info.bmi && (
                    <div>
                      <span className="text-gray-600">BMI:</span> {parsedDetails.patient_info.bmi}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vital Signs Section */}
            {parsedDetails.vital_signs && (
              <div className="mt-4 p-3 bg-purple-50 rounded-md">
                <h5 className="font-medium mb-2">Vital Signs</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {parsedDetails.vital_signs.temperature && (
                    <div>
                      <span className="text-gray-600">Temperature:</span> {parsedDetails.vital_signs.temperature} °C
                    </div>
                  )}
                  {parsedDetails.vital_signs.pulse_rate && (
                    <div>
                      <span className="text-gray-600">Pulse Rate:</span> {parsedDetails.vital_signs.pulse_rate} BPM
                    </div>
                  )}
                  {parsedDetails.vital_signs.respiratory_rate && (
                    <div>
                      <span className="text-gray-600">Respiratory Rate:</span> {parsedDetails.vital_signs.respiratory_rate} breaths/min
                    </div>
                  )}
                  {parsedDetails.vital_signs.blood_pressure && (
                    <div>
                      <span className="text-gray-600">Blood Pressure:</span> {parsedDetails.vital_signs.blood_pressure} mmHg
                    </div>
                  )}
                  {parsedDetails.vital_signs.oxygen_saturation && (
                    <div>
                      <span className="text-gray-600">Oxygen Saturation:</span> {parsedDetails.vital_signs.oxygen_saturation}%
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
    } catch {
      // If parsing fails, return the original string
    }

    return <p>{details}</p>;
  };

  // View record details
  const viewRecord = (record: PatientRecord) => {
    setSelectedRecord(record);
    setIsViewingRecord(true);
  };

  const filteredRecords = getFilteredRecords();

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex justify-between items-center">
          <CardTitle>Medical Records</CardTitle>
          <Button onClick={onAddRecord}>
            Add New Record
          </Button>
        </CardHeader>
        <CardContent>
          {/* Record Type Filter Tabs */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={activeRecordType === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveRecordType('all')}
              >
                All Records
              </Badge>
              <Badge
                variant={activeRecordType === 'medical_record' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveRecordType('medical_record')}
              >
                Medical Records
              </Badge>
              <Badge
                variant={activeRecordType === 'medical_checkup' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveRecordType('medical_checkup')}
              >
                Checkups
              </Badge>
              <Badge
                variant={activeRecordType === 'laboratory' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveRecordType('laboratory')}
              >
                Lab Results
              </Badge>
              <Badge
                variant={activeRecordType === 'pending' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveRecordType('pending')}
              >
                Pending
              </Badge>
              <Badge
                variant={activeRecordType === 'completed' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveRecordType('completed')}
              >
                Completed
              </Badge>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No medical records available for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium flex items-center">
                      {getRecordTypeLabel(record.record_type)}
                      {record.prescriptions && record.prescriptions.length > 0 && (
                        <Badge variant="outline" className="ml-2 flex items-center">
                          <Pill className="h-3 w-3 mr-1" />
                          {record.prescriptions.length} Prescription(s)
                        </Badge>
                      )}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'completed' ? 'bg-green-100 text-green-800' :
                      record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {formatDetailsPreview(record.details)}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(record.created_at).toLocaleDateString()} -
                      {record.appointment_date && (
                        <span className="ml-1">
                          Visit: {new Date(record.appointment_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewRecord(record)}
                      className="text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                    {getRecordTypeLabel(selectedRecord.record_type)}
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
                  {renderDetailedView(selectedRecord.details)}
                </div>
              </div>

              {selectedRecord.vital_signs && Object.keys(selectedRecord.vital_signs).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Vital Signs</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedRecord.vital_signs).map(([key, value]) => (
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
                    {selectedRecord.prescriptions.map((prescription, index) => (
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
    </>
  );
};

export default PatientMedicalRecords;
