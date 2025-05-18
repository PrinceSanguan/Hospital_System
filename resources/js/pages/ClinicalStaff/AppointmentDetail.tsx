import React, { useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { ArrowLeftIcon} from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { toast } from "react-hot-toast";
import ConfirmationModal from '@/components/ConfirmationModal';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface Patient {
    id: number;
    name: string;
    reference_number?: string;
    email?: string;
}

interface Doctor {
    id: number;
    name: string;
}

interface AppointmentDetails {
    appointment_time?: string;
    reason?: string;
    notes?: string;
    patient_info?: {
        name?: string;
        birthdate?: string;
        age?: number;
        height?: number;
        weight?: number;
        bmi?: number;
        address?: string;
        gender?: string;
        phone?: string;
        email?: string;
    };
    vital_signs?: {
        temperature?: number;
        pulse_rate?: number;
        respiratory_rate?: number;
        blood_pressure?: string;
        oxygen_saturation?: number;
        recorded_at?: string;
    };
    medical_history?: string;
}

interface AppointmentProps {
    appointment: {
        id: number;
        patient: Patient;
        doctor?: Doctor;
        appointment_date: string;
        status: string;
        reason?: string;
        details: AppointmentDetails | string;
        reference_number?: string;
    };
    user: User;
}

export default function AppointmentDetail({ appointment, user }: AppointmentProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<string>(appointment.status);
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showStatusForm, setShowStatusForm] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject'>('approve');



    // Parse details if it's a string
    const details = typeof appointment.details === 'string'
        ? JSON.parse(appointment.details)
        : appointment.details;

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Badge variant="outline">Pending</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'MMMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    // Component for printable medical record
    const PrintableMedicalRecord = React.forwardRef<HTMLDivElement>((_, ref) => (
        <div ref={ref} className="p-6 bg-white print:p-0">
            <div className="medical-record-container">
                {/* Header with title */}
                <div className="medical-record-header">
                    <h1 className="medical-record-title">Medical Record</h1>
                    <p className="medical-record-physician">
                        Physician: {appointment.doctor?.name || '[YOUR NAME]'}, {user?.role || '[YOUR COMPANY NAME]'}
                    </p>
                </div>

                {/* Introduction */}
                <div className="medical-record-description">
                    <p>
                        The following information is a comprehensive medical record of the patient, intended for
                        professional use only. This document ensures a detailed overview of the patient's medical
                        history and current health status.
                    </p>
                </div>

                {/* Patient Information Table */}
                <table className="patient-info-table">
                    <tbody>
                        <tr>
                            <th>Patient Information</th>
                            <th>Details</th>
                        </tr>
                        <tr>
                            <td>Name:</td>
                            <td>{details.patient_info?.name || appointment.patient.name}</td>
                        </tr>
                        <tr>
                            <td>Date of Birth:</td>
                            <td>{details.patient_info?.birthdate || 'Not provided'}</td>
                        </tr>
                        <tr>
                            <td>Gender:</td>
                            <td>{details.patient_info?.gender || 'Not provided'}</td>
                        </tr>
                        <tr>
                            <td>Contact Number:</td>
                            <td>{details.patient_info?.phone || '222 555 7777'}</td>
                        </tr>
                        <tr>
                            <td>Email:</td>
                            <td>{details.patient_info?.email || 'email@you.mail'}</td>
                        </tr>
                        <tr>
                            <td>Address:</td>
                            <td>{details.patient_info?.address || details.address || 'Address not provided'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Medical History */}
                <div className="medical-history-section">
                    <h2 className="section-title">Medical History</h2>
                    <p className="medical-history">
                        {details.patient_info?.name || appointment.patient.name} {details.medical_history ||
                        `has a history of ${appointment.reason || details.reason || 'medical conditions requiring attention'}.
                        The patient was seen on ${formatDate(appointment.appointment_date)} for a medical consultation.
                        ${details.diagnosis ? `Diagnosis: ${details.diagnosis}. ` : ''}
                        ${details.notes ? `The physician noted: ${details.notes}. ` : ''}
                        ${details.treatments ? `Treatment plan includes: ${details.treatments}. ` : ''}
                        Patient reports no major surgeries or hospitalizations in the past five years.`}
                    </p>
                </div>
            </div>
        </div>
    ));

    // Handle status update with confirmation
    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();

        if (status === 'confirmed') {
            setConfirmAction('approve');
            setShowConfirmModal(true);
        } else if (status === 'cancelled') {
            setConfirmAction('reject');
            setShowConfirmModal(true);
        } else {
            submitStatusUpdate();
        }
    };

    // Submit the status update to the server
    const submitStatusUpdate = async () => {
        setIsSubmitting(true);

        try {
            const response = await axios.post(route('staff.appointments.status', appointment.id), {
                status,
                notes
            });

            if (response.data.success) {
                toast.success('Appointment status updated successfully');
                // Reload the page to show updated status
                window.location.reload();
            } else {
                toast.error('Failed to update appointment status');
            }
        } catch (error) {
            console.error('Error updating appointment status:', error);
            toast.error('An error occurred while updating the appointment status');
        } finally {
            setIsSubmitting(false);
            setShowConfirmModal(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Head title={`Appointment Details - ${appointment.reference_number || `APP-${appointment.id}`}`} />

            {/* Sidebar Component */}
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header Component */}
                <Header user={user} />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Link href={route('staff.appointments.index')}>
                                    <Button variant="outline" size="sm">
                                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                                        Back to Appointments
                                    </Button>
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-4">
                                    Medical Record
                                </h1>
                            </div>
                        </div>

                        {/* Status Update Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Appointment Status</CardTitle>
                                <CardDescription>
                                    Update the appointment status on behalf of doctors
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!showStatusForm ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Status:</p>
                                            <div className="mt-1">{getStatusBadge(appointment.status)}</div>
                                        </div>
                                        <Button
                                            onClick={() => setShowStatusForm(true)}
                                            variant="outline"
                                        >
                                            Update Status
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateStatus} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={status}
                                                onValueChange={setStatus}
                                            >
                                                <SelectTrigger id="status">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                placeholder="Add notes about this status change"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowStatusForm(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? 'Updating...' : 'Update Status'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Regular UI for screen viewing */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Appointment Information</CardTitle>
                                <CardDescription>
                                    Reference #: {appointment.reference_number || `APP-${appointment.id}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Appointment Time:</p>
                                        <p>{details.appointment_time || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Appointment Date:</p>
                                        <p>{formatDate(appointment.appointment_date)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason:</p>
                                    <p>{appointment.reason || details.reason || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Notes:</p>
                                    <p>{details.notes || 'No additional notes'}</p>
                                </div>
                                {appointment.doctor && (
                                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Doctor:</p>
                                            <p>Dr. {appointment.doctor.name}</p>
                                        </div>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Link href={route('staff.doctor-schedules.view', appointment.doctor.id)}>
                                                View Doctor Schedule
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Patient Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Patient Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</p>
                                        <p>{details.patient_info?.name || appointment.patient.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthdate:</p>
                                        <p>{details.patient_info?.birthdate || 'Not recorded'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Age:</p>
                                        <p>{details.patient_info?.age ? `${details.patient_info.age} years` : 'Not recorded'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Height:</p>
                                        <p>{details.patient_info?.height ? `${details.patient_info.height} cm` : 'Not recorded'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight:</p>
                                        <p>{details.patient_info?.weight ? `${details.patient_info.weight} kg` : 'Not recorded'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">BMI:</p>
                                        <p>{details.patient_info?.bmi || 'Not calculated'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</p>
                                    <p>{details.patient_info?.email || appointment.patient?.email || 'Not recorded'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address:</p>
                                    <p>{details.patient_info?.address || details.address || 'Not recorded'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Link href={route('staff.clinical.info.edit', appointment.id)}>
                                <Button>Edit Medical Record</Button>
                            </Link>
                            {appointment.doctor && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Doctor:</p>
                                    <p>Dr. {appointment.doctor.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Hidden printable view - only visible when printing */}
                        <div className="hidden">
                            <PrintableMedicalRecord ref={printRef} />
                        </div>
                    </div>

                    {/* Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={showConfirmModal}
                        onClose={() => setShowConfirmModal(false)}
                        onConfirm={submitStatusUpdate}
                        title={`Are you sure you want to ${confirmAction} this appointment?`}
                        actionType={confirmAction}
                    />
                </main>
            </div>
        </div>
    );
}
