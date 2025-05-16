import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';

interface LabResult {
    id: number;
    patient: {
        id: number;
        name: string;
        reference_number: string;
    };
    test_type: string;
    test_date: string;
    file_path: string;
    notes: string;
}

interface Props {
    labResult: LabResult;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        }
    }
}

export default function LabResultDetail({ labResult, auth }: Props) {
    return (
        <>
            <Head title={`Lab Result - ${labResult.test_type}`} />

            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar user={auth.user} />

                <div className="flex flex-1 flex-col">
                    <Header user={auth.user} />

                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="mb-6">
                                    <Link href={route('staff.lab-results.index')}>
                                        <Button variant="outline" size="sm">
                                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                            Back to Lab Results
                                        </Button>
                                    </Link>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">
                                            Lab Result Details
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Test Type: {labResult.test_type}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Patient Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Name:</span>{' '}
                                                {labResult.patient.name}
                                            </p>
                                            <p>
                                                <span className="font-medium">Reference Number:</span>{' '}
                                                {labResult.patient.reference_number}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Test Details</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Test Date:</span>{' '}
                                                {format(new Date(labResult.test_date), 'PPpp')}
                                            </p>
                                            <p>
                                                <span className="font-medium">Notes:</span>{' '}
                                                {labResult.notes || 'No notes provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Lab Result File</h3>
                                                                                <div className="mt-4">
                                              <a href={route('staff.lab-results.download', labResult.id)} download>
                                                 <Button>
                                                     <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                                                     Download Lab Result
                                                  </Button>
                                              </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
