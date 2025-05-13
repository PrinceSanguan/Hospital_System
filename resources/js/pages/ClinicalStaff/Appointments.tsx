import React, { useState, useEffect } from 'react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from 'date-fns';
import { EyeIcon, PencilIcon, DocumentTextIcon, BeakerIcon } from '@heroicons/react/24/outline';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import toast from 'react-hot-toast';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface UploadedFile {
    name: string;
    path: string;
    size?: number;
    type?: string;
    url?: string;
}

interface AppointmentDetails {
    appointment_time?: string;
    reason?: string;
    notes?: string;
    patient_info?: {
        name?: string;
        birthdate?: string;
        age?: number;
        height?: number;
        weight?: number;
        bmi?: number;
        address?: string;
    };
    vital_signs?: {
        temperature?: number;
        pulse_rate?: number;
        respiratory_rate?: number;
        blood_pressure?: string;
        oxygen_saturation?: number;
        recorded_at?: string;
    };
    service?: {
        id?: number;
        name?: string;
        price?: number;
        duration_minutes?: number;
    };
    uploaded_files?: UploadedFile[];
}

interface Appointment {
    id: number;
    patient: Patient;
    record_type: string;
    appointment_date: string;
    status: string;
    details: AppointmentDetails | string; // Can be either parsed object or string JSON
    reference_number?: string;
    assigned_doctor_id?: number;
    doctor?: {
        id: number;
        name: string;
    };
    appointment_type?: string;
    reason?: string;
    has_lab_results?: boolean;
    has_medical_record?: boolean;
}

interface AppointmentsProps {
    user: User;
    appointments?: Appointment[];
}

export default function Appointments({ user, appointments = [] }: AppointmentsProps) {
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printType, setPrintType] = useState<'record' | 'prescription' | null>(null);

    // Sort appointments: Pending first, then Completed/Done
    useEffect(() => {
        let sorted = [...appointments].sort((a, b) => {
            // First sort by status (Pending first, then others)
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;

            // Then sort by date (ascending)
            return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
        });

        // Apply filters
        if (searchTerm || statusFilter !== 'all' || typeFilter !== 'all') {
            sorted = sorted.filter(appointment => {
                const matchesSearch = searchTerm === '' ||
                    appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (appointment.reference_number && appointment.reference_number.toLowerCase().includes(searchTerm.toLowerCase()));

                const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

                // Filter by appointment type (doctor/patient)
                const matchesType = typeFilter === 'all' ||
                    (typeFilter === 'doctor' && appointment.record_type.includes('doctor')) ||
                    (typeFilter === 'patient' && appointment.record_type.includes('patient'));

                return matchesSearch && matchesStatus && matchesType;
            });
        }

        // Only update state if the filtered results have actually changed
        setFilteredAppointments(prevAppointments => {
            if (JSON.stringify(prevAppointments) !== JSON.stringify(sorted)) {
                return sorted;
            }
            return prevAppointments;
        });
    }, [appointments, searchTerm, statusFilter, typeFilter]);

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    // Extract appointment time from details
    const getAppointmentTime = (details: AppointmentDetails | string): string => {
        try {
            // If details is already an object
            if (typeof details === 'object' && details !== null) {
                return details.appointment_time || 'N/A';
            }

            // If details is a string, try to parse it
            if (typeof details === 'string') {
                const detailsObj = JSON.parse(details) as AppointmentDetails;
                return detailsObj.appointment_time || 'N/A';
            }

            return 'N/A';
        } catch {
            return 'N/A';
        }
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Badge variant="outline">Pending</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-600 text-white">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    // Handle print document
    const handlePrintDocument = () => {
        if (!selectedAppointment || !printType) return;

        let url = '';
        switch(printType) {
            case 'record':
                url = route('staff.appointments.pdf', selectedAppointment.id);
                break;
            case 'prescription':
                url = route('staff.receipts.download', selectedAppointment.id);
                break;
        }

        window.open(url, '_blank');
        setShowPrintDialog(false);
        setSelectedAppointment(null);
        setPrintType(null);
    };

    // Create receipt for appointment
    const createReceipt = (id: number) => {
        router.visit(route('staff.appointments.receipt', id));
    };

    // Define a new function to handle status updates
    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            const response = await axios.post(route('staff.appointments.status', id), {
                status: newStatus,
                notes: 'Status updated by clinical staff'
            });

            if (response.data.success) {
                // Update the state with the new array
                setFilteredAppointments(
                    filteredAppointments.map(appointment => {
                        if (appointment.id === id) {
                            return {
                                ...appointment,
                                status: newStatus
                            };
                        }
                        return appointment;
                    })
                );
                
                toast.success(`Appointment ${newStatus} successfully`);
            } else {
                toast.error('Failed to update appointment status');
            }
        } catch (error) {
            console.error('Error updating appointment status:', error);
            toast.error('An error occurred while updating the appointment status');
        }
    };

    // Update the openDenyDialog function to directly handle the appointment cancellation
    const openDenyDialog = (id: number) => {
        handleStatusUpdate(id, 'cancelled');
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Head title="Appointments" />

            {/* Sidebar Component */}
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header Component */}
                <Header user={user} />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Appointments</h1>
                        </div>

                        {/* Filters */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search by patient name or reference #"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    defaultValue={statusFilter}
                                    onValueChange={(value) => {
                                        if (value !== statusFilter) {
                                            setStatusFilter(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="type">Appointment Type</Label>
                                <Select
                                    defaultValue={typeFilter}
                                    onValueChange={(value) => {
                                        if (value !== typeFilter) {
                                            setTypeFilter(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="doctor">Doctor Appointments</SelectItem>
                                        <SelectItem value="patient">Patient Appointments</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Appointments Table */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Appointment List</CardTitle>
                                <CardDescription>
                                    Showing {filteredAppointments.length} appointments
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredAppointments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Appointment Ref #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Reasons</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAppointments.map((appointment) => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>
                                                        {appointment.reference_number || `APP-${appointment.id}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{appointment.patient.name}</div>
                                                        {appointment.doctor && (
                                                            <div className="text-xs text-gray-500">Dr. {appointment.doctor.name}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{formatDate(appointment.appointment_date)}</div>
                                                        <div className="text-sm text-gray-500">{getAppointmentTime(appointment.details)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {appointment.reason || 'Not specified'}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center space-x-2">
                                                            {/* Status actions for pending appointments */}
                                                            {appointment.status === 'pending' && (
                                                                <>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button 
                                                                                    variant="outline" 
                                                                                    size="sm"
                                                                                    className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                                                    onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                                                                                >
                                                                                    Accept
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Accept on behalf of doctor</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button 
                                                                                    variant="outline" 
                                                                                    size="sm"
                                                                                    className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                                                                    onClick={() => openDenyDialog(appointment.id)}
                                                                                >
                                                                                    Deny
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Deny appointment</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </>
                                                            )}
                                                            
                                                            {/* Simple Action Buttons - Only 4 as requested */}
                                                            <TooltipProvider>
                                                                {/* View Button */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button asChild variant="ghost" size="icon">
                                                                            <Link href={route('staff.appointments.show', appointment.id)}>
                                                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                                            </Link>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>View Record</p>
                                                                    </TooltipContent>
                                                                </Tooltip>

                                                                {/* Edit Button */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button asChild variant="ghost" size="icon">
                                                                            <Link href={route('staff.clinical.info.edit', appointment.id)}>
                                                                                <PencilIcon className="h-4 w-4" />
                                                                            </Link>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Edit Medical Record</p>
                                                                    </TooltipContent>
                                                                </Tooltip>


                                                                {/* Lab Results Button */}
                                                                {appointment.has_lab_results && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button asChild variant="ghost" size="icon">
                                                                                <Link href={route('staff.appointments.lab-results', appointment.id)}>
                                                                                    <BeakerIcon className="h-4 w-4" />
                                                                                </Link>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>View Lab Results</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}

                                                                {/* Receipt Button */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => createReceipt(appointment.id)}
                                                                        >
                                                                            <DocumentTextIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Create Receipt</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <p className="text-gray-500 mb-4">No appointments found</p>
                                        <div className="max-w-md text-sm text-gray-500 mb-4">
                                            There are no appointments in the system yet. You may need to:
                                            <ul className="list-disc list-inside mt-2 text-left">
                                                <li>Create patients first</li>
                                                <li>Ensure doctors are registered in the system</li>
                                                <li>Check that database connections are working correctly</li>
                                            </ul>
                                        </div>
                                        <Button asChild variant="outline">
                                            <Link href={route('staff.dashboard')}>
                                                Return to Dashboard
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Print Dialog */}
            <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {printType === 'record' ? 'Print Medical Record' : 'Print Receipt'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-gray-500 mb-4">
                            You are about to print the
                            {printType === 'record' ? ' medical record' : ' receipt'}
                            for {selectedAppointment?.patient.name}.
                        </p>

                        <p className="text-sm font-medium">
                            This will open a new tab with the document ready for printing.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePrintDocument}>
                            Print Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
