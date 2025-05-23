import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface LabRecord {
    id: string | number;
    patient_id: number;
    record_type: string;
    appointment_date: string;
    status: string;
    details: string;
    created_at: string;
    updated_at: string;
    is_file?: boolean;
}

interface LabResultDetailProps {
    user: User;
    record: LabRecord;
}

export default function LabResultDetail({ user, record }: LabResultDetailProps) {
    const parseDetails = () => {
        if (typeof record.details === 'string') {
            try {
                return JSON.parse(record.details);
            } catch {
                return {};
            }
        }
        return record.details || {};
    };

    const details = parseDetails();

    const formatDate = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    return (
        <PatientLayout user={user}>
            <Head title="Laboratory Result Details" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center">
                        <Button variant="ghost" asChild className="mr-4 p-0">
                            <Link href="/patient/records/lab-results">
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Laboratory Result</h1>
                            <p className="text-gray-600">Viewing lab result from {formatDate(record.appointment_date)}</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lab Result Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-2 font-semibold text-gray-700">Test Information</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-500">Test Type:</span>
                                            <p className="font-medium">{details.lab_type || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Date:</span>
                                            <p className="font-medium">{formatDate(record.appointment_date)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Status:</span>
                                            <p className="font-medium capitalize">{record.status}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-2 font-semibold text-gray-700">Additional Information</h3>
                                    <div className="space-y-2">
                                        {details.notes && (
                                            <div>
                                                <span className="text-sm text-gray-500">Notes:</span>
                                                <p className="font-medium">{details.notes}</p>
                                            </div>
                                        )}
                                        {record.is_file && (
                                            <div>
                                                <span className="text-sm text-gray-500">Type:</span>
                                                <p className="font-medium">Uploaded File</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t pt-6">
                                <Button
                                    onClick={() => {
                                        const url = `/patient/records/lab-results/${record.id}/download`;
                                        window.location.href = url;
                                    }}
                                    className="mr-4"
                                >
                                    Download Result
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/patient/records/lab-results">Back to Lab Results</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PatientLayout>
    );
}
