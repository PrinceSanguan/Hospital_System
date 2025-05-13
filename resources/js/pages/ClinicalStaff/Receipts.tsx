import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { PlusIcon, ArrowDownTrayIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import PatientSearch from '@/components/PatientSearch';
import axios from 'axios';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';

interface Appointment {
    id: number;
    appointment_date: string;
    status: string;
    reason: string;
}

interface Patient {
    id: number;
    name: string;
    reference_number: string;
}

interface Receipt {
    id: number;
    patient: {
        id: number;
        name: string;
    };
    appointment: {
        id: number;
    } | null;
    amount: number | string;
    payment_method: string;
    payment_date: string;
    receipt_number: string;
    description: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function Receipts({ receipts, auth }: { receipts: { data: Receipt[] }, auth: { user: User } }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        patient_id: '',
        appointment_id: '',
        amount: '',
        payment_method: '',
        payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        description: ''
    });

    // Check for URL parameters to auto-open receipt creation
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const openCreate = urlParams.get('open_create');
        const patientId = urlParams.get('patient_id');
        const appointmentId = urlParams.get('appointment_id');

        if (openCreate === 'true' && patientId) {
            setIsCreateOpen(true);

            // Fetch the patient data
            axios.get(`/api/v1/patients/${patientId}`)
                .then(response => {
                    if (response.data.success && response.data.patient) {
                        const patient = response.data.patient;
                        setSelectedPatient(patient);
                        setData('patient_id', patient.id.toString());

                        // Set appointment ID if provided
                        if (appointmentId) {
                            setData('appointment_id', appointmentId);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching patient:', error);
                });
        }
    }, []);

    // Load appointments when a patient is selected
    useEffect(() => {
        if (selectedPatient?.id) {
            setIsLoadingAppointments(true);
            setData('patient_id', selectedPatient.id.toString());

            axios.get(`/api/v1/patients/${selectedPatient.id}/appointments`)
                .then(response => {
                    if (response.data.success && response.data.appointments) {
                        setAppointments(response.data.appointments);

                        // Check if we should preselect an appointment (from URL parameter)
                        const urlParams = new URLSearchParams(window.location.search);
                        const appointmentId = urlParams.get('appointment_id');
                        if (appointmentId && !data.appointment_id) {
                            setData('appointment_id', appointmentId);
                        }
                    } else {
                        setAppointments([]);
                    }
                })
                .catch(error => {
                    console.error('Error fetching appointments:', error);
                    setAppointments([]);
                })
                .finally(() => {
                    setIsLoadingAppointments(false);
                });
        } else {
            setAppointments([]);
            setData('appointment_id', '');
        }
    }, [selectedPatient]);

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient);
    };

    const handleAppointmentChange = (appointmentId: string) => {
        setData('appointment_id', appointmentId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('staff.receipts.store'), {
            onSuccess: () => {
                reset();
                setIsCreateOpen(false);
                setSelectedPatient(null);
                setAppointments([]);
            },
        });
    };

    return (
        <>
            <Head title="Receipts" />

            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar user={auth.user} />

                <div className="flex flex-1 flex-col">
                    <Header user={auth.user} />

                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold text-gray-900">Receipts</h2>
                                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <PlusIcon className="mr-2 h-4 w-4" />
                                                Create Receipt
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Create Receipt</DialogTitle>
                                                <DialogDescription>
                                                    Create a new payment receipt for a patient. Fill in all the required fields.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <PatientSearch
                                                    onSelect={handlePatientSelect}
                                                    required={true}
                                                />

                                                {selectedPatient && (
                                                    <div>
                                                        <Label htmlFor="appointment_id">Appointment (Optional)</Label>
                                                        {isLoadingAppointments ? (
                                                            <div className="py-2">Loading appointments...</div>
                                                        ) : appointments.length > 0 ? (
                                                            <Select onValueChange={handleAppointmentChange}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select an appointment" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {appointments.map(appointment => (
                                                                        <SelectItem key={appointment.id} value={appointment.id.toString()}>
                                                                            {format(new Date(appointment.appointment_date), 'PPP')} - {appointment.reason}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="text-sm text-gray-500 py-2">
                                                                No completed appointments found for this patient
                                                            </div>
                                                        )}
                                                        {errors.appointment_id && (
                                                            <p className="text-sm text-red-600">{errors.appointment_id}</p>
                                                        )}
                                                    </div>
                                                )}

                                                <div>
                                                    <Label htmlFor="description">Item Description</Label>
                                                    <Input
                                                        id="description"
                                                        type="text"
                                                        value={data.description}
                                                        onChange={e => setData('description', e.target.value)}
                                                        placeholder="e.g., Consultation Fee, Lab Test, Medical Certificate"
                                                        required
                                                    />
                                                    {errors.description && (
                                                        <p className="text-sm text-red-600">{errors.description}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor="amount">Amount</Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        step="0.01"
                                                        value={data.amount}
                                                        onChange={e => setData('amount', e.target.value)}
                                                        required
                                                    />
                                                    {errors.amount && (
                                                        <p className="text-sm text-red-600">{errors.amount}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor="payment_method">Payment Method</Label>
                                                    <Select onValueChange={value => setData('payment_method', value)} required>
                                                        <SelectTrigger id="payment_method">
                                                            <SelectValue placeholder="Select a payment method" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Cash">Cash</SelectItem>
                                                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                                                            <SelectItem value="Debit Card">Debit Card</SelectItem>
                                                            <SelectItem value="Insurance">Insurance</SelectItem>
                                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                            <SelectItem value="Check">Check</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.payment_method && (
                                                        <p className="text-sm text-red-600">{errors.payment_method}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor="payment_date">Payment Date</Label>
                                                    <Input
                                                        id="payment_date"
                                                        type="datetime-local"
                                                        value={data.payment_date}
                                                        onChange={e => setData('payment_date', e.target.value)}
                                                        required
                                                    />
                                                    {errors.payment_date && (
                                                        <p className="text-sm text-red-600">{errors.payment_date}</p>
                                                    )}
                                                </div>

                                                <Button type="submit" disabled={processing || !selectedPatient}>
                                                    Create
                                                </Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Receipt #</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Payment Method</TableHead>
                                            <TableHead>Payment Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receipts.data.length > 0 ? (
                                            receipts.data.map((receipt) => (
                                                <TableRow key={receipt.id}>
                                                    <TableCell>{receipt.receipt_number}</TableCell>
                                                    <TableCell>{receipt.patient.name}</TableCell>
                                                    <TableCell>PHP {parseFloat(receipt.amount as string).toFixed(2)}</TableCell>
                                                    <TableCell>{receipt.payment_method}</TableCell>
                                                    <TableCell>
                                                        {format(new Date(receipt.payment_date), 'PPpp')}
                                                    </TableCell>
                                                    <TableCell className="space-x-2">
                                                        <Link href={route('staff.receipts.show', receipt.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <a href={route('staff.receipts.download', receipt.id)} target="_blank" rel="noopener noreferrer" className="inline-block">
                                                            <Button variant="outline" size="sm">
                                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                const url = route('staff.receipts.destroy', receipt.id);
                                                                router.delete(url);
                                                            }}
                                                            className="inline-block"
                                                        >
                                                            <Button variant="outline" size="sm" type="submit">
                                                                <TrashIcon className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                                    No receipts found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
