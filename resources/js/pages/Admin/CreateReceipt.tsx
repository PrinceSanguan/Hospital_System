import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Plus, ArrowLeft, XCircle } from 'lucide-react';
import PatientSearch from '@/components/PatientSearch';
import axios from 'axios';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface CreateReceiptProps {
    user: User;
}

export default function CreateReceipt({ user }: CreateReceiptProps) {
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

    // Check for URL parameters to auto-select patient and appointment
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('patient_id');
        const appointmentId = urlParams.get('appointment_id');

        if (patientId) {
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
        post(route('admin.receipts.store'), {
            onSuccess: () => {
                router.visit(route('admin.receipts'));
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

    return (
        <AdminLayout user={user}>
            <Head title="Create Receipt" />
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild onClick={() => window.history.back()}>
                            <div>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Receipts
                            </div>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Create Receipt</h1>
                            <p className="text-muted-foreground">Create a new payment receipt for a patient</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Receipt Information</CardTitle>
                        <CardDescription>Fill in all required fields to generate a receipt</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="mb-4">
                                    <PatientSearch
                                        onSelect={handlePatientSelect}
                                        required={true}
                                        initialPatient={selectedPatient}
                                    />
                                </div>

                                {selectedPatient && (
                                    <div>
                                        <Label htmlFor="appointment_id">Appointment (Optional)</Label>
                                        {isLoadingAppointments ? (
                                            <div className="py-2">Loading appointments...</div>
                                        ) : appointments.length > 0 ? (
                                            <Select onValueChange={handleAppointmentChange} value={data.appointment_id}>
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
                                                No appointments found for this patient
                                            </div>
                                        )}
                                        {errors.appointment_id && (
                                            <p className="text-sm text-red-600">{errors.appointment_id}</p>
                                        )}
                                    </div>
                                )}

                                <div className="border rounded-md p-4">
                                    <h3 className="font-medium mb-3">Receipt Items</h3>

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
                                                    <XCircle className="h-4 w-4" />
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
                                            <Plus className="h-4 w-4 mr-1" /> Add Item
                                        </Button>
                                        <div className="flex items-center">
                                            <span className="font-medium mr-3">Total Amount:</span>
                                            <span className="text-xl font-bold">PHP {totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <Select onValueChange={value => setData('payment_method', value)} required value={data.payment_method}>
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

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing || !selectedPatient || totalAmount <= 0}>
                                        {processing ? 'Creating...' : 'Create Receipt'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
