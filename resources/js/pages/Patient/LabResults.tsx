import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Head, Link, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Bell, ChevronRight, ClipboardList } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Doctor {
    id: number;
    name: string;
    specialty?: string;
}

interface LabTestResult {
    value: string | number;
    range?: string;
    status?: string;
}

interface LabRecord {
    id: string;
    patient_id: number;
    assigned_doctor_id?: number;
    assigned_doctor?: Doctor;
    record_type: string;
    appointment_date: string;
    status: string;
    details: string | null;
    created_at: string;
    updated_at: string;
    is_file?: boolean;
}

interface PaginatedLabRecords {
    data: LabRecord[];
    links: Record<string, unknown>;
    meta: Record<string, unknown>;
}

interface Props {
    user: User;
    labRecords: PaginatedLabRecords;
    notifications: Array<{
        id: number;
        title: string;
        message: string;
        read: boolean;
        created_at: string;
    }>;
}

// Function to parse details with better error handling
const parseDetails = (details: string | null | undefined): Record<string, any> | null => {
    if (!details || details === '') return null;

    // If details is already an object, return it
    if (typeof details === 'object') {
        return details;
    }

    // Try to parse JSON string
    try {
        const parsed = JSON.parse(details);
        return typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        console.error('Error parsing details:', error);
        return null;
    }
};

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';

    try {
        return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

// Helper function to handle file download
const handleDownload = (recordId: string): void => {
    try {
        window.open(`/patients/lab-results/${recordId}/download`, '_blank');
    } catch (error) {
        console.error('Error opening download link:', error);
    }
};

export default function LabResults({ user, labRecords, notifications = [] }: Props) {
    // Ensure labRecords and labRecords.data exist
    const records = labRecords?.data || [];

    // Calculate unread notifications
    const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;

    return (
        <PatientLayout user={user}>
            <Head title="Laboratory Results" />
            <div className="container mx-auto p-6">
                {/* Header with notification */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Laboratory Results</h1>
                        <p className="mt-1 text-gray-600">View your laboratory test results</p>
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

                <Card className="mx-auto w-full">
                    <CardHeader className="bg-primary/5">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="text-primary h-6 w-6" />
                            <CardTitle>Laboratory Results</CardTitle>
                        </div>
                        <CardDescription>View your laboratory test results</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {records.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Test Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => {
                                        // Safely parse details
                                        const details = parseDetails(record.details);
                                        const isFileRecord = Boolean(record.is_file);
                                        const labType = (details?.lab_type as string) || 'Laboratory Test';
                                        const doctorName = record.assigned_doctor?.name || 'Self-requested';

                                        // Use the safer date formatting
                                        const displayDate = formatDate(record.appointment_date || record.created_at);

                                        return (
                                            <TableRow key={record.id}>
                                                <TableCell>{displayDate}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{labType}</div>
                                                    {details?.notes && typeof details.notes === 'string' && (
                                                        <div className="max-w-xs truncate text-sm text-gray-500">{details.notes}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isFileRecord ? (
                                                        <Badge className="border border-green-200 bg-green-100 text-green-800">File uploaded</Badge>
                                                    ) : record.status?.toLowerCase() === 'completed' ? (
                                                        <Badge className="border border-green-200 bg-green-100 text-green-800">Completed</Badge>
                                                    ) : (
                                                        <Badge className="border border-yellow-200 bg-yellow-100 text-yellow-800">
                                                            {record.status || 'Pending'}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{doctorName}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isFileRecord ? (
                                                            <>
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link
                                                                        href={`/patient/records/lab-results/${record.id}`}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        <span>View</span>
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const url = `/patient/records/lab-results/${record.id}/download`;
                                                                        window.location.href = url;
                                                                    }}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    Download
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link
                                                                        href={`/patient/records/lab-results/${record.id}`}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        <span>View</span>
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const url = `/patient/records/lab-results/${record.id}/download`;
                                                                        window.location.href = url;
                                                                    }}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    Download
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2">No laboratory results found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
