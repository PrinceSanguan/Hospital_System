import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileText, User, Stethoscope, Calendar, Clock,
    CheckCircle, XCircle, AlertCircle, ArrowLeft, Printer
} from 'lucide-react';
import { useState } from 'react';
import { Link } from '@inertiajs/react';

interface Patient {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: string;
    gender: string;
}

interface Doctor {
    id: number;
    name: string;
    email: string;
    specialty?: string;
}

interface Record {
    id: number;
    patient: Patient;
    assigned_doctor: Doctor | null;
    record_type: string;
    status: string;
    appointment_date: string;
    details: string;
    lab_results: any;
    vital_signs: any;
    prescriptions: any;
    created_at: string;
    updated_at: string;
}

interface User {
    name: string;
    email: string;
    role?: string;
}

interface PatientRecordDetailsProps {
    user: User;
    record: Record;
}

export default function PatientRecordDetails({ user, record }: PatientRecordDetailsProps) {
    const [activeTab, setActiveTab] = useState('details');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Pending
                </span>;
            case 'completed':
                return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                </span>;
            case 'cancelled':
                return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    <XCircle className="mr-1 h-3 w-3" />
                    Cancelled
                </span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {status}
                </span>;
        }
    };

    const printRecord = () => {
        window.print();
    };

    return (
        <AdminLayout user={user}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.records.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Records
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Patient Record #{record.id}</h1>
                            <p className="text-muted-foreground">View detailed information about this patient record</p>
                        </div>
                    </div>
                    <Button onClick={printRecord}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Record
                    </Button>
                </div>

                {/* Record Overview */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
                            <div className="flex-1">
                                <h3 className="mb-2 text-lg font-semibold">Record Information</h3>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Record Type:</span>
                                        <span>{record.record_type === 'medical_checkup' ? 'Medical Checkup' : record.record_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Date:</span>
                                        <span>{formatDate(record.appointment_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Time:</span>
                                        <span>{formatTime(record.appointment_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Status:</span>
                                        {getStatusBadge(record.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="mb-2 text-lg font-semibold">Patient Information</h3>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">Name:</span>
                                        <span>{record.patient.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Email:</span>
                                        <span>{record.patient.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Phone:</span>
                                        <span>{record.patient.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Gender:</span>
                                        <span>{record.patient.gender || 'Not specified'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="mb-2 text-lg font-semibold">Assigned Doctor</h3>
                                {record.assigned_doctor ? (
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">Name:</span>
                                            <span>Dr. {record.assigned_doctor.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Email:</span>
                                            <span>{record.assigned_doctor.email}</span>
                                        </div>
                                        {record.assigned_doctor.specialty && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Specialty:</span>
                                                <span>{record.assigned_doctor.specialty}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No doctor assigned to this record</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for Details and Lab Results */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-8 grid w-full grid-cols-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="lab_results">Lab Results</TabsTrigger>
                        <TabsTrigger value="vital_signs">Vital Signs</TabsTrigger>
                        <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <Card>
                            <CardHeader>
                                <CardTitle>Record Details</CardTitle>
                                <CardDescription>
                                    Detailed information about this appointment
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {record.details ? (
                                    <div className="space-y-6">
                                        {(() => {
                                            try {
                                                const detailsObj = typeof record.details === 'string' 
                                                    ? JSON.parse(record.details) 
                                                    : record.details;
                                                
                                                return (
                                                    <>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="rounded-lg border bg-card p-4">
                                                                <h3 className="mb-3 font-semibold">Appointment Information</h3>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between border-b pb-1">
                                                                        <span className="text-muted-foreground">Time</span>
                                                                        <span className="font-medium">{detailsObj.appointment_time || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between border-b pb-1">
                                                                        <span className="text-muted-foreground">Reason</span>
                                                                        <span className="font-medium">{detailsObj.reason || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between border-b pb-1">
                                                                        <span className="text-muted-foreground">Notes</span>
                                                                        <span className="font-medium">{detailsObj.notes || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {detailsObj.patient_info && (
                                                                <div className="rounded-lg border bg-card p-4">
                                                                    <h3 className="mb-3 font-semibold">Patient Information</h3>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">Full Name</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.name || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">Birthdate</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.birthdate || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">Age</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.age || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">Height</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.height || 'N/A'} cm</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">Weight</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.weight || 'N/A'} kg</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">BMI</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.bmi || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-b pb-1">
                                                                            <span className="text-muted-foreground">Address</span>
                                                                            <span className="font-medium">{detailsObj.patient_info.address || 'N/A'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            } catch (error) {
                                                // If parsing fails, display as plain text
                                                return (
                                                    <div className="whitespace-pre-wrap rounded-md border bg-gray-50 p-4">
                                                        {record.details}
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-gray-50 p-4 text-center text-gray-500">
                                        No details provided for this record.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="lab_results">
                        <Card>
                            <CardHeader>
                                <CardTitle>Laboratory Results</CardTitle>
                                <CardDescription>
                                    Test results associated with this record
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {record.lab_results && Object.keys(record.lab_results).length > 0 ? (
                                    <div className="rounded-md border">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Test
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Result
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Reference Range
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {Object.entries(record.lab_results).map(([test, result]: [string, any]) => (
                                                    <tr key={test}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                            {test}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {result.value}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {result.range || 'N/A'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            {result.status === 'normal' ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                                                    Normal
                                                                </span>
                                                            ) : result.status === 'abnormal' ? (
                                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                                                    Abnormal
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                                                    {result.status || 'N/A'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-gray-50 p-4 text-center text-gray-500">
                                        No laboratory results available for this record.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="vital_signs">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vital Signs</CardTitle>
                                <CardDescription>
                                    Patient's vital signs recorded during this visit
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {record.vital_signs && Object.keys(record.vital_signs).length > 0 ? (
                                    <div className="rounded-md border">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Measurement
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Value
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Normal Range
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {Object.entries(record.vital_signs).map(([name, data]: [string, any]) => (
                                                    <tr key={name}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                            {name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {data.value} {data.unit || ''}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {data.range || 'N/A'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            {data.status === 'normal' ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                                                    Normal
                                                                </span>
                                                            ) : data.status === 'abnormal' ? (
                                                                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                                                    Abnormal
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                                                    {data.status || 'N/A'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-gray-50 p-4 text-center text-gray-500">
                                        No vital signs recorded for this visit.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="prescriptions">
                        <Card>
                            <CardHeader>
                                <CardTitle>Prescriptions</CardTitle>
                                <CardDescription>
                                    Medications prescribed to the patient
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {record.prescriptions && record.prescriptions.length > 0 ? (
                                    <div className="rounded-md border">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Medication
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Dosage
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Frequency
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Duration
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                        Instructions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {record.prescriptions.map((prescription: any, index: number) => (
                                                    <tr key={index}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                            {prescription.medication}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {prescription.dosage}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {prescription.frequency}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                            {prescription.duration}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {prescription.instructions}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="rounded-md border bg-gray-50 p-4 text-center text-gray-500">
                                        No prescriptions for this visit.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Record History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Record History</CardTitle>
                        <CardDescription>
                            Timeline of changes to this record
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Record created</p>
                                    <p className="text-sm text-gray-500">{formatDate(record.created_at)} at {formatTime(record.created_at)}</p>
                                </div>
                            </div>

                            {record.created_at !== record.updated_at && (
                                <div className="flex gap-4">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Record updated</p>
                                        <p className="text-sm text-gray-500">{formatDate(record.updated_at)} at {formatTime(record.updated_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
