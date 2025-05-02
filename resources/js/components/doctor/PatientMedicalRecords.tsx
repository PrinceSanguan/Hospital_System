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
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{record.details}</p>
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
                  {selectedRecord.details || "No details provided"}
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
