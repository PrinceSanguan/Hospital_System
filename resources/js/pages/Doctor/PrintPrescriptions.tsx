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

interface Prescription {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

interface MedicalRecord {
    id: number;
    patient: Patient;
    assigned_doctor: Doctor;
    appointment_date: string;
    record_type: string;
    diagnosis?: string;
    details: string | Record<string, unknown>;
    prescriptions?: Prescription[];
    status: string;
    created_at: string;
}

interface PrintPrescriptionsProps {
    user: UserData;
    record: MedicalRecord;
}

export default function PrintPrescriptions({ user, record }: PrintPrescriptionsProps) {
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
            <Head title="Print Prescriptions" />

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
                        <p className="font-semibold">PRESCRIPTION</p>
                        <p className="text-sm text-gray-600">Record ID: #{record.id}</p>
                        <p className="text-xs text-gray-500">Date Issued: {formatDate(new Date().toISOString())}</p>
                    </div>
                </div>

                {/* Watermark */}
                <div className="absolute top-1/4 left-0 w-full text-center opacity-10 text-gray-500 rotate-45 text-9xl font-bold pointer-events-none z-10">
                    Rx
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">PRESCRIPTION</h1>
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
                            <p className="text-sm text-gray-500">Date:</p>
                            <p className="font-medium">{formatDate(record.appointment_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Address:</p>
                            <p className="font-medium">{record.patient.profile?.address || 'Not available'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Date of Birth:</p>
                            <p className="font-medium">{record.patient.profile?.dob ? formatDate(record.patient.profile.dob) : 'Not available'}</p>
                        </div>
                    </div>
                </div>

                {/* Prescriptions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">PRESCRIBED MEDICATIONS</h2>

                    {record.prescriptions && record.prescriptions.length > 0 ? (
                        <div className="space-y-6">
                            {record.prescriptions.map((prescription, index) => (
                                <div key={index} className="border rounded-md p-4 bg-gray-50">
                                    <div className="flex items-center mb-2">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-2">
                                            Rx
                                        </div>
                                        <h3 className="text-lg font-bold">{prescription.name}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <p className="text-sm text-gray-500">Dosage:</p>
                                            <p className="font-medium">{prescription.dosage}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Frequency:</p>
                                            <p className="font-medium">{prescription.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Duration:</p>
                                            <p className="font-medium">{prescription.duration}</p>
                                        </div>
                                        {prescription.instructions && (
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-500">Instructions:</p>
                                                <p className="font-medium">{prescription.instructions}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                            <p className="text-gray-500">No prescriptions available</p>
                        </div>
                    )}
                </div>

                {/* Notes */}
                {details.prescription_notes !== undefined && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">NOTES</h2>
                        <p className="whitespace-pre-line">{typeof details.prescription_notes === 'string' ? details.prescription_notes : String(details.prescription_notes)}</p>
                    </div>
                )}

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
                    <p>This prescription was issued on {formatDate(new Date().toISOString())} by Famcare Health Medical Center.</p>
                    <p>For verification purposes, please contact our office at (555) 123-4567 or email at pharmacy@famcarehealth.com</p>
                    <p className="mt-2">© {new Date().getFullYear()} Famcare Health. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
