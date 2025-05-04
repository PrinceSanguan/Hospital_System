import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Button } from "@/components/ui/button";
import { UserData } from '@/types';
import { ArrowLeft } from 'lucide-react';
import RecordForm from '@/components/doctor/RecordForm';

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

interface RecordEditProps {
  user: UserData;
  record: PatientRecord;
  patient: Patient;
}

export default function RecordEdit({ user, record, patient }: RecordEditProps) {
  return (
    <DoctorLayout user={user}>
      <Head title={`Edit Medical Record - ${patient.name}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={route('doctor.records.show', record.id)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Record
                </Link>
              </Button>
            </div>
          </div>

          <RecordForm
            isOpen={true}
            onClose={() => window.history.back()}
            editRecord={record}
            patient={patient}
          />
        </div>
      </div>
    </DoctorLayout>
  );
}
