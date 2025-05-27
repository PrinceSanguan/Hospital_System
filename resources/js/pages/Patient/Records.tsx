import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Bell, ChevronRight, ClipboardList } from 'lucide-react';

interface User {
    name: string;
    email: string;
    role: string;
}

interface Doctor {
    id: number;
    name: string;
}

interface RecordDetails {
    appointment_time?: string;
    vital_signs?: {
        temperature?: string | number;
        blood_pressure?: string;
        pulse_rate?: string | number;
        oxygen_saturation?: string | number;
    };
    diagnosis?: string;
    prescriptions?: string[];
    notes?: string;
    followup_date?: string;
    [key: string]: string | number | boolean | string[] | Record<string, string | number> | undefined;
}

interface MedicalRecord {
    id: number;
    patient_id: number;
    assignedDoctor: Doctor;
    record_type: string;
    appointment_date: string;
    status: string;
    details: string | RecordDetails;
    created_at: string;
    updated_at: string;
}

interface RecordsProps {
    user: User;
    records: MedicalRecord[];
    notifications: Array<{
        id: number;
        title: string;
        message: string;
        read: boolean;
        created_at: string;
    }>;
}

export default function Records({ user, records, notifications = [] }: RecordsProps) {
    // Calculate unread notifications
    const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <Badge className="bg-green-500">Completed</Badge>;
            case 'pending':
                return (
                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                        Pending
                    </Badge>
                );
            case 'cancelled':
                return <Badge className="bg-red-600 text-white">Cancelled</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getRecordTypeDisplay = (recordType: string): string => {
        switch (recordType.toLowerCase()) {
            case 'medical_record':
                return 'Medical Record';
            case 'medical_checkup':
                return 'Medical Checkup';
            case 'prescription':
                return 'Prescription';
            default:
                return recordType.replace('_', ' ');
        }
    };

    const formatDate = (dateString: string): string => {
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const getDiagnosis = (details: string | RecordDetails): string => {
        if (typeof details === 'string') {
            try {
                details = JSON.parse(details) as RecordDetails;
            } catch {
                return 'N/A';
            }
        }

        return details?.diagnosis || 'N/A';
    };

    // Filter records by type
    const medicalCheckups = records.filter((record) => record.record_type === 'medical_checkup');

    return (
        <PatientLayout user={user}>
            <Head title="Medical Records" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Medical Records</h1>
                            <p className="text-gray-600 dark:text-gray-400">View all your medical records and request access to specific records</p>
                        </div>
                        <Button variant="ghost" size="icon" className="relative" onClick={() => router.visit(route('patient.notifications.index'))}>
                            <Bell size={20} />
                            {unreadNotificationsCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    {unreadNotificationsCount}
                                </Badge>
                            )}
                        </Button>
                    </div>

                    <Tabs defaultValue="all">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All Records</TabsTrigger>
                            <TabsTrigger value="checkups">Medical Checkups</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ClipboardList className="h-5 w-5 text-blue-500" />
                                        All Medical Records
                                    </CardTitle>
                                    <CardDescription>Your complete medical history</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <caption className="text-muted-foreground mt-4 text-sm">A list of your medical records</caption>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Diagnosis/Notes</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {records.length > 0 ? (
                                                records.map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>{formatDate(record.appointment_date)}</TableCell>
                                                        <TableCell className="font-medium">{getRecordTypeDisplay(record.record_type)}</TableCell>
                                                        <TableCell>
                                                            {record.assignedDoctor ? `Dr. ${record.assignedDoctor.name}` : 'No doctor assigned'}
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate">{getDiagnosis(record.details)}</TableCell>
                                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={route('patient.records.show', record.id)}>
                                                                    <ChevronRight className="mr-1 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-4 text-center">
                                                        No medical records found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="checkups">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ClipboardList className="h-5 w-5 text-blue-500" />
                                        Medical Checkups
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Diagnosis</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {medicalCheckups.length > 0 ? (
                                                medicalCheckups.map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>{formatDate(record.appointment_date)}</TableCell>
                                                        <TableCell>
                                                            {record.assignedDoctor ? `Dr. ${record.assignedDoctor.name}` : 'No doctor assigned'}
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate">{getDiagnosis(record.details)}</TableCell>
                                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={route('patient.records.show', record.id)}>
                                                                    <ChevronRight className="mr-1 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-4 text-center">
                                                        No medical checkups found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PatientLayout>
    );
}
