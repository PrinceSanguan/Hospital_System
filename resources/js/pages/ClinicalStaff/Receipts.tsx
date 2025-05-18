import React, { useState, useEffect } from 'react';
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
import { PlusIcon, ArrowDownTrayIcon, EyeIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PatientSearch from '@/components/PatientSearch';
import axios from 'axios';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

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

interface ReceiptItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
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
    items?: ReceiptItem[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface ReceiptsProps {
    user: User;
    receipts: any;
    useAdminLayout?: boolean;
}

export default function Receipts({ user, receipts, useAdminLayout }: ReceiptsProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
        {
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: 0
        }
    ]);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const { data, setData, post, processing, errors, reset } = useForm({
        patient_id: '',
        appointment_id: '',
        amount: '0',
        payment_method: '',
        payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        description: '',
        items: JSON.stringify(receiptItems)
    });

    // Calculate total amount whenever receipt items change
    useEffect(() => {
        const total = receiptItems.reduce((sum, item) => sum + item.amount, 0);
        setTotalAmount(total);
        setData('amount', total.toString());
        setData('items', JSON.stringify(receiptItems));
    }, [receiptItems]);

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
                        console.log("Retrieved patient from API:", patient);
                        setSelectedPatient(patient);
                        setData('patient_id', patient.id.toString());

                        // Set appointment ID if provided
                        if (appointmentId) {
                            console.log(`Setting appointment_id to ${appointmentId}`);
                            setData('appointment_id', appointmentId);

                            // Set initial item description
                            const updatedItems = [...receiptItems];
                            updatedItems[0].description = 'Consultation Fee';
                            setReceiptItems(updatedItems);
                        }
                    } else {
                        console.error('Patient data not found in response', response.data);
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
                setReceiptItems([{
                    description: '',
                    quantity: 1,
                    unit_price: 0,
                    amount: 0
                }]);
            },
        });
    };

    const handleAddItem = () => {
        setReceiptItems([
            ...receiptItems,
            {
                description: '',
                quantity: 1,
                unit_price: 0,
                amount: 0
            }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (receiptItems.length === 1) {
            // Don't remove the last item, just clear it
            setReceiptItems([{
                description: '',
                quantity: 1,
                unit_price: 0,
                amount: 0
            }]);
        } else {
            setReceiptItems(receiptItems.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index: number, field: keyof ReceiptItem, value: string | number) => {
        const updatedItems = [...receiptItems];

        if (field === 'description') {
            updatedItems[index].description = value as string;
        } else if (field === 'quantity' || field === 'unit_price') {
            const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
            updatedItems[index][field] = numValue;

            // Recalculate amount
            updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].unit_price;
        }

        setReceiptItems(updatedItems);
    };

    // Render the content
    const content = (
        <>
            <Head title="Receipts" />
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Receipts</h1>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Receipt
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Receipts</CardTitle>
                        <CardDescription>View and manage payment receipts</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                            initialPatient={selectedPatient}
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

                        <div className="border rounded-md p-4">
                            <h3 className="font-medium mb-3">Items</h3>

                            {receiptItems.map((item, index) => (
                                <div key={index} className="space-y-3 mb-4 pb-4 border-b last:border-b-0 relative">
                                    <div className="flex">
                                        <div className="flex-grow">
                                            <Label htmlFor={`item-description-${index}`}>Description</Label>
                                            <Input
                                                id={`item-description-${index}`}
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="e.g., Consultation Fee, Lab Test, Medical Certificate"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 mt-6 ml-1"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label htmlFor={`item-quantity-${index}`}>Quantity</Label>
                                            <Input
                                                id={`item-quantity-${index}`}
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`item-price-${index}`}>Unit Price</Label>
                                            <Input
                                                id={`item-price-${index}`}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`item-amount-${index}`}>Amount</Label>
                                            <Input
                                                id={`item-amount-${index}`}
                                                type="number"
                                                value={item.amount.toFixed(2)}
                                                readOnly
                                                className="bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between mt-3">
                                <Button type="button" variant="outline" onClick={handleAddItem}>
                                    <PlusIcon className="h-4 w-4 mr-1" /> Add Item
                                </Button>
                                <div className="flex items-center">
                                    <span className="font-medium mr-3">Total Amount:</span>
                                    <span className="text-xl font-bold">PHP {totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
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

                        <Button type="submit" disabled={processing || !selectedPatient || totalAmount <= 0}>
                            Create Receipt
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );

    // Choose layout based on flag
    if (useAdminLayout) {
        return (
            <AdminLayout user={user}>
                {content}
            </AdminLayout>
        );
    }

    // Original layout - ensure user is passed properly to Header
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header user={{
                    name: user?.name || '',
                    email: user?.email || '',
                    role: user?.role || user?.user_role || 'clinical_staff' // Support both formats
                }} />
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
}
