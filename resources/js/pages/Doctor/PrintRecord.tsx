import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { UserData } from '@/types';

interface Patient {
    id: number;
    name: string;
    email: string;
    profile?: {
        address?: string;
        phone?: string;
        dob?: string;
        gender?: string;
    };
}

interface Doctor {
    id: number;
    name: string;
    email: string;
    profile?: {
        specialty?: string;
        license_number?: string;
    };
}

interface MedicalRecord {
    id: number;
    patient: Patient;
    assigned_doctor: Doctor;
    appointment_date: string;
    record_type: string;
    diagnosis?: string;
    details: string | Record<string, unknown>;
    lab_results?: Record<string, unknown>;
    vital_signs?: Record<string, unknown>;
    prescriptions?: Record<string, unknown>[];
    status: string;
    created_at: string;
}

interface PrintRecordProps {
    user: UserData;
    record: MedicalRecord;
}

export default function PrintRecord({ user, record }: PrintRecordProps) {
    useEffect(() => {
        // Automatically trigger print when component loads
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    // Format date for display
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    // Get record type label
    const getRecordTypeLabel = (type: string): string => {
        switch (type) {
            case 'medical_checkup':
                return 'Medical Checkup';
            case 'medical_record':
                return 'Medical Record';
            case 'laboratory':
                return 'Laboratory Test';
            case 'vaccination':
                return 'Vaccination';
            case 'surgery':
                return 'Surgery';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
        }
    };

    // Parse details if it's a string
    const getDetails = (): Record<string, unknown> => {
        if (typeof record.details === 'string') {
            try {
                return JSON.parse(record.details);
            } catch {
                return { notes: record.details };
            }
        }
        return record.details as Record<string, unknown>;
    };

    const details = getDetails();

    return (
        <div className="bg-white print:bg-white">
            <Head title="Print Medical Certificate" />

            <div className="p-8 max-w-4xl mx-auto">
                {/* Document Header */}
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        {/* Logo with text fallback */}
                        <div className="h-16 w-16 bg-blue-600 text-white flex items-center justify-center rounded-md font-bold text-xl">
                            CH
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Famcare Health</h1>
                            <p className="text-sm text-gray-600">Medical Center & Healthcare System</p>
                            <p className="text-xs text-gray-500">123 Healthcare Avenue • Medical City • Phone: (555) 123-4567</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">OFFICIAL MEDICAL RECORD</p>
                        <p className="text-sm text-gray-600">Record ID: #{record.id}</p>
                        <p className="text-xs text-gray-500">Date Issued: {formatDate(new Date().toISOString())}</p>
                    </div>
                </div>

                {/* Watermark */}
                <div className="absolute top-1/4 left-0 w-full text-center opacity-10 text-gray-500 rotate-45 text-9xl font-bold pointer-events-none z-10">
                    CONFIDENTIAL
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">MEDICAL CERTIFICATE</h1>
                </div>

                {/* Patient Information */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">PATIENT INFORMATION</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Name:</p>
                            <p className="font-medium">{record.patient.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email:</p>
                            <p className="font-medium">{record.patient.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Address:</p>
                            <p className="font-medium">{record.patient.profile?.address || 'Not available'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date of Birth:</p>
                            <p className="font-medium">{record.patient.profile?.dob ? formatDate(record.patient.profile.dob) : 'Not available'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Gender:</p>
                            <p className="font-medium">{record.patient.profile?.gender || 'Not available'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phone:</p>
                            <p className="font-medium">{record.patient.profile?.phone || 'Not available'}</p>
                        </div>
                    </div>
                </div>

                {/* Record Information */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">RECORD INFORMATION</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Record Type:</p>
                            <p className="font-medium">{getRecordTypeLabel(record.record_type)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date:</p>
                            <p className="font-medium">{formatDate(record.appointment_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status:</p>
                            <p className="font-medium capitalize">{record.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Doctor:</p>
                            <p className="font-medium">{record.assigned_doctor?.name || user.name}</p>
                        </div>
                    </div>
                </div>

                {/* Diagnosis & Treatment */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">DIAGNOSIS & TREATMENT</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Diagnosis:</p>
                            <p className="font-medium">{record.diagnosis || (details.diagnosis as string) || 'No diagnosis recorded'}</p>
                        </div>

                        {record.vital_signs && (
                            <div>
                                <p className="text-sm text-gray-500">Vital Signs:</p>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    {Object.entries(record.vital_signs).map(([key, value]) => (
                                        <div key={key} className="flex justify-between border-b last:border-0 py-1">
                                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                                            <span>{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {details.treatment && (
                            <div>
                                <p className="text-sm text-gray-500">Treatment:</p>
                                <p className="font-medium">{typeof details.treatment === 'string' ? details.treatment : ''}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Physician Signature */}
                <div className="mt-16">
                    <div className="border-t pt-4 w-64 mx-auto text-center">
                        <p className="font-medium">{record.assigned_doctor?.name || user.name}</p>
                        <p className="text-sm text-gray-500">Licensed Physician</p>
                        {record.assigned_doctor?.profile?.license_number && (
                            <p className="text-xs text-gray-400">License #: {record.assigned_doctor.profile.license_number}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <Separator className="my-8" />
                <div className="text-center text-xs text-gray-500">
                    <p>This medical certificate was issued on {formatDate(new Date().toISOString())} by Famcare Health Medical Center.</p>
                    <p>For verification purposes, please contact our office at (555) 123-4567 or email at records@famcarehealth.com</p>
                    <p className="mt-2">© {new Date().getFullYear()} Famcare Health. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
