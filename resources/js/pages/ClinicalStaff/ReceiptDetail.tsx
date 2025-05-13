import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';

interface Creator {
    id: number;
    name: string;
}

interface Patient {
    id: number;
    name: string;
    reference_number: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    status: string;
}

interface Receipt {
    id: number;
    receipt_number: string;
    patient: Patient;
    appointment: Appointment | null;
    amount: number | string;
    payment_method: string;
    payment_date: string;
    description: string;
    created_by: number;
    creator: Creator;
}

interface Props {
    receipt: Receipt;
    auth: {
        user: {
            name: string;
            email: string;
            role: string;
        }
    }
}

export default function ReceiptDetail({ receipt, auth }: Props) {
    return (
        <>
            <Head title={`Receipt - ${receipt.receipt_number}`} />

            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />

                <div className="flex flex-1 flex-col">
                    <Header user={auth.user} />

                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="mb-6">
                                    <Link href={route('staff.receipts.index')}>
                                        <Button variant="outline" size="sm">
                                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                            Back to Receipts
                                        </Button>
                                    </Link>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-900">
                                            Receipt Details
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Receipt Number: {receipt.receipt_number}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Patient Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Name:</span>{' '}
                                                {receipt.patient.name}
                                            </p>
                                            <p>
                                                <span className="font-medium">Reference Number:</span>{' '}
                                                {receipt.patient.reference_number}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Payment Details</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Amount:</span>{' '}
                                                PHP {typeof receipt.amount === 'number' ? receipt.amount.toFixed(2) : receipt.amount}
                                            </p>
                                            <p>
                                                <span className="font-medium">Payment Method:</span>{' '}
                                                {receipt.payment_method}
                                            </p>
                                            <p>
                                                <span className="font-medium">Payment Date:</span>{' '}
                                                {format(new Date(receipt.payment_date), 'PPpp')}
                                            </p>
                                            <p>
                                                <span className="font-medium">Description:</span>{' '}
                                                {receipt.description || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Related Appointment</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <span className="font-medium">Appointment ID:</span>{' '}
                                                {receipt.appointment?.id || 'N/A'}
                                            </p>
                                            <p>
                                                <span className="font-medium">Appointment Date:</span>{' '}
                                                {receipt.appointment?.appointment_date ? format(new Date(receipt.appointment.appointment_date), 'PPpp') : 'N/A'}
                                            </p>
                                            <p>
                                                <span className="font-medium">Status:</span>{' '}
                                                {receipt.appointment?.status || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium">Receipt Actions</h3>
                                        <div className="mt-4">
                                            <a href={route('staff.receipts.download', receipt.id)} target="_blank" rel="noopener noreferrer">
                                                <Button>
                                                    <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                                                    Download Receipt
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
