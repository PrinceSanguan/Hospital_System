import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/AdminLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { format } from 'date-fns';

interface Patient {
    id: number;
    name: string;
}

interface MedicalRecord {
    id: number;
    date: string;
    appointment_date: string;
    patient: Patient;
    record_type: string;
    details: string;
    raw_details: Record<string, unknown>;
    status: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    per_page: number;
    from: number;
    to: number;
    total: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

type BadgeVariantType = 'outline' | 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info';

interface MedicalRecordsProps {
    user: {
        name: string;
        email: string;
        role: string;
    };
    medicalRecords: PaginatedData<MedicalRecord>;
}

export default function MedicalRecords({ user, medicalRecords }: MedicalRecordsProps) {
    // Remove the state variables for the dialog
    // const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    // const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    // Function to view medical record details - modified to navigate to the view page
    const viewRecordDetails = (record: MedicalRecord) => {
        router.visit(route('admin.medical-records.show', record.id));
    };

    const filteredRecords = medicalRecords && medicalRecords.data ? medicalRecords.data : [];

    // Function to render status badge with appropriate color
    const renderStatusBadge = (status: string) => {
        let variant: BadgeVariantType = 'outline';

        switch (status.toLowerCase()) {
            case 'completed':
                variant = 'success';
                break;
            case 'pending':
                variant = 'warning';
                break;
            case 'confirmed':
                variant = 'info';
                break;
            case 'cancelled':
                variant = 'destructive';
                break;
            default:
                variant = 'outline';
        }

        return (
            <Badge variant={variant} className="rounded-full px-3 py-0.5 text-xs font-medium">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Function to format the date for display
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    // Function to extract diagnosis from the details
    const extractDiagnosis = (record: MedicalRecord): string => {
        if (!record.details) return 'No details available';

        try {
            // If details is a string, try to parse it as JSON
            if (typeof record.details === 'string') {
                const details = JSON.parse(record.details);
                if (details.diagnosis) return details.diagnosis;

                // Check if it's in the format {"appointment_time":"09:00","diagnosis":"Headache","notes":"test","followup_date":null}
                if (typeof details === 'object' && details !== null) {
                    return details.diagnosis || 'No diagnosis specified';
                }
            }

            // If details is already an object
            if (typeof record.details === 'object' && record.details !== null) {
                return (record.details as Record<string, unknown>).diagnosis?.toString() || 'No diagnosis specified';
            }

            return 'No diagnosis available';
        } catch {
            return 'Unable to parse details';
        }
    };

    return (
        <AdminLayout user={user}>
            <div className="container mx-auto p-4">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                            <p className="text-sm text-gray-500">View and manage all medical records</p>
                        </div>
                        <Button variant="default" className="rounded-md bg-black hover:bg-gray-800">
                            <Link href={route('admin.medical-records.create')} className="flex items-center">
                                <PlusIcon className="mr-2 h-4 w-4" /> Add New Record
                            </Link>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">Patient</th>
                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">Record Type</th>
                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">Details</th>
                                    <th className="border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((record) => {
                                        // Check if this is a pending appointment that shouldn't be editable
                                        const isPendingAppointment =
                                            record.record_type === 'medical_checkup' && record.status.toLowerCase() === 'pending';

                                        return (
                                            <tr key={record.id} className="border-b border-gray-100">
                                                <td className="px-4 py-3 text-sm text-gray-800">
                                                    {formatDate(record.appointment_date || record.date)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{record.patient.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{record.record_type.replace('_', ' ')}</td>
                                                <td className="px-4 py-3 text-sm text-gray-800">{extractDiagnosis(record)}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {renderStatusBadge(record.status)}
                                                    {isPendingAppointment && (
                                                        <span className="ml-2 block text-xs text-gray-500 italic">Awaiting doctor approval</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-6 text-center text-gray-500">
                                            No medical records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 text-center text-xs text-gray-500">A list of medical records</div>
                </div>

                {/* Removed the Record Details Dialog */}
            </div>
        </AdminLayout>
    );
}
