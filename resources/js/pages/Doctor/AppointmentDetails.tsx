import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Calendar,
    Clock,
    User,
    FileText,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Download,
    FilePlus
} from "lucide-react";
import { UserData } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from 'axios';

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface AppointmentNote {
    date: string;
    note: string;
    by: string;
}

interface PatientFile {
    name: string;
    path: string;
    url: string;
    size: number;
    type: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    appointment_date: string;
    record_type: string;
    status: string;
    details: AppointmentNote[] | string | null;
    created_at: string;
    updated_at: string;
}

interface AppointmentDetailsProps {
    user: UserData;
    appointment: Appointment;
    patientFiles: PatientFile[];
}

export default function AppointmentDetails({ user, appointment, patientFiles = [] }: AppointmentDetailsProps) {
    const [showConfirmComplete, setShowConfirmComplete] = useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        status: '',
        notes: '',
    });

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper function to format time
    const formatTime = (dateString: string) => {
        // Use the raw date string from appointment details if available
        if (typeof appointment.details === 'string') {
            try {
                const details = JSON.parse(appointment.details);
                if (details.appointment_time) {
                    return details.appointment_time;
                }
            } catch {
                // Continue with normal formatting if parsing fails
            }
        }

        const date = new Date(dateString);
        // Format without timezone adjustment to display the time as stored
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Helper to format file size
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    // Helper to get icon based on file type
    const getFileIcon = (fileType: string) => {
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('doc')) return '📝';
        return '📎';
    };

    // Format details based on its type
    const renderDetails = () => {
        if (!appointment.details) return <p className="text-gray-500 italic">No details provided</p>;

        // Try to parse if it's a JSON string
        if (typeof appointment.details === 'string') {
            try {
                // Check if it looks like a JSON string
                if (appointment.details.trim().startsWith('{') && appointment.details.trim().endsWith('}')) {
                    const detailsObj = JSON.parse(appointment.details);
                    return (
                        <div className="space-y-5">
                            {detailsObj.patient_info && (
                                <div className="bg-green-50 p-4 rounded-md">
                                    <h3 className="text-md font-semibold text-green-800 mb-2">Patient Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {detailsObj.patient_info.name && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Name:</h4>
                                                <p className="text-gray-700">{detailsObj.patient_info.name}</p>
                                            </div>
                                        )}
                                        {detailsObj.patient_info.birthdate && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Birthdate:</h4>
                                                <p className="text-gray-700">{new Date(detailsObj.patient_info.birthdate).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        {detailsObj.patient_info.age && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Age:</h4>
                                                <p className="text-gray-700">{detailsObj.patient_info.age} years</p>
                                            </div>
                                        )}
                                        {detailsObj.patient_info.height && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Height:</h4>
                                                <p className="text-gray-700">{detailsObj.patient_info.height} cm</p>
                                            </div>
                                        )}
                                        {detailsObj.patient_info.weight && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Weight:</h4>
                                                <p className="text-gray-700">{detailsObj.patient_info.weight} kg</p>
                                            </div>
                                        )}
                                        {detailsObj.patient_info.bmi && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">BMI:</h4>
                                                <p className="text-gray-700">{detailsObj.patient_info.bmi}</p>
                                            </div>
                                        )}
                                        {detailsObj.patient_info.address && (
                                            <div className="md:col-span-2">
                                                <h4 className="text-sm font-medium text-gray-700">Address:</h4>
                                                <p className="text-gray-700">{detailsObj.patient_info.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Vital Signs */}
                            {detailsObj.vital_signs && (
                                <div className="bg-purple-50 p-4 rounded-md">
                                    <h3 className="text-md font-semibold text-purple-800 mb-2">Vital Signs</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {detailsObj.vital_signs.temperature && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Temperature:</h4>
                                                <p className="text-gray-700">{detailsObj.vital_signs.temperature} °C</p>
                                            </div>
                                        )}
                                        {detailsObj.vital_signs.pulse_rate && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Pulse Rate:</h4>
                                                <p className="text-gray-700">{detailsObj.vital_signs.pulse_rate} BPM</p>
                                            </div>
                                        )}
                                        {detailsObj.vital_signs.respiratory_rate && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Respiratory Rate:</h4>
                                                <p className="text-gray-700">{detailsObj.vital_signs.respiratory_rate} breaths/min</p>
                                            </div>
                                        )}
                                        {detailsObj.vital_signs.blood_pressure && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Blood Pressure:</h4>
                                                <p className="text-gray-700">{detailsObj.vital_signs.blood_pressure} mmHg</p>
                                            </div>
                                        )}
                                        {detailsObj.vital_signs.oxygen_saturation && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700">Oxygen Saturation:</h4>
                                                <p className="text-gray-700">{detailsObj.vital_signs.oxygen_saturation}%</p>
                                            </div>
                                        )}
                                        {detailsObj.vital_signs.recorded_at && (
                                            <div className="col-span-1 md:col-span-3">
                                                <h4 className="text-sm font-medium text-gray-700">Recorded At:</h4>
                                                <p className="text-gray-700">{new Date(detailsObj.vital_signs.recorded_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }
            } catch (error) {
                console.error("Error parsing appointment details:", error);
                // Not valid JSON, display as regular text
            }
            return <p className="text-gray-700">{appointment.details}</p>;
        }

        if (Array.isArray(appointment.details)) {
            return (
                <div className="space-y-4">
                    {appointment.details.map((note, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{note.by}</span>
                                <span className="text-gray-500">{new Date(note.date).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-700">{note.note}</p>
                        </div>
                    ))}
                </div>
            );
        }

        return <p className="text-gray-500 italic">Unknown format</p>;
    };

    const handleSubmit = (status: string) => {
        setData('status', status);

        // Use axios directly instead of Inertia's post
        axios.post(route('doctor.appointments.updateStatus'), {
            appointment_id: appointment.id,
            status: status === 'completed' ? 'confirmed' : (status === 'cancelled' ? 'cancelled' : 'confirmed'),
            notes: data.notes
        })
        .then(() => {
                setShowConfirmComplete(false);
                setShowConfirmCancel(false);
                setData('notes', '');
            // Redirect to dashboard after successful confirmation
            window.location.href = route('doctor.dashboard');
        })
        .catch(error => {
            console.error('Error updating appointment:', error);
        });
    };

    return (
        <DoctorLayout user={user}>
            <Head title="Appointment Details" />
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Button variant="ghost" asChild className="mb-4">
                            <Link href={route('doctor.appointments.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Appointments
                            </Link>
                        </Button>

                        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
                    </div>

                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Appointment Information</CardTitle>
                                    <CardDescription>
                                        View details for this appointment
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant={
                                        appointment.status === 'completed' ? 'default' :
                                        appointment.status === 'pending' ? 'outline' :
                                        'destructive'
                                    }
                                    className="text-sm"
                                >
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium text-gray-900 flex items-center mb-2">
                                        <User className="mr-2 h-4 w-4" />
                                        Patient Information
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-md">
                                        <h4 className="font-semibold text-lg">{appointment.patient.name}</h4>
                                        <p className="text-gray-600">{appointment.patient.email}</p>
                                        <div className="mt-2">
                                            <Button asChild variant="outline" size="sm" className="mt-2">
                                                <Link href={route('doctor.patients.show', appointment.patient.id)}>
                                                    View Patient Profile
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 flex items-center mb-2">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Appointment Date & Time
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-md">
                                        <div className="text-lg font-medium">{formatDate(appointment.appointment_date)}</div>
                                        <div className="text-gray-600 flex items-center">
                                            <Clock className="mr-2 h-4 w-4" />
                                            {formatTime(appointment.appointment_date)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 flex items-center mb-2">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Details & Notes
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-md">
                                    {renderDetails()}
                                </div>
                            </div>

                            {/* Patient Uploaded Files Section */}
                            {patientFiles.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 flex items-center mb-2">
                                        <FilePlus className="mr-2 h-4 w-4" />
                                        Patient Uploaded Files
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-md">
                                        <div className="space-y-3">
                                            {patientFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl" aria-hidden="true">
                                                            {getFileIcon(file.type)}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                                        download
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Download
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex justify-between">
                            <div className="text-sm text-gray-500">
                                Created: {new Date(appointment.created_at).toLocaleString()}
                                {appointment.updated_at !== appointment.created_at && (
                                    <span> | Updated: {new Date(appointment.updated_at).toLocaleString()}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {appointment.status === 'pending' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => setShowConfirmCancel(true)}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancel Appointment
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowConfirmComplete(true)}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Confirm with Notes
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                // Use axios directly instead of Inertia's post
                                                axios.post(route('doctor.appointments.updateStatus'), {
                                                    appointment_id: appointment.id,
                                                    status: 'confirmed'
                                                })
                                                .then(() => {
                                                    window.location.href = route('doctor.dashboard');
                                                })
                                                .catch(error => {
                                                    console.error('Error confirming appointment:', error);
                                                });
                                            }}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Confirm & Go to Dashboard
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Confirm Complete Modal */}
                    {showConfirmComplete && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Confirm Appointment</CardTitle>
                                <CardDescription>
                                    Add any additional notes for this confirmation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder="Add notes about this appointment confirmation..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={4}
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmComplete(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleSubmit('completed')}
                                    disabled={processing}
                                >
                                    Confirm Appointment
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Confirm Cancel Modal */}
                    {showConfirmCancel && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Cancel Appointment</CardTitle>
                                <CardDescription>
                                    Please provide a reason for cancellation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert variant="destructive" className="mb-4">
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>
                                        This action cannot be undone and will notify the patient.
                                    </AlertDescription>
                                </Alert>
                                <Textarea
                                    placeholder="Reason for cancellation..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={4}
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmCancel(false)}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleSubmit('cancelled')}
                                    disabled={processing}
                                >
                                    Cancel Appointment
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </DoctorLayout>
    );
}
