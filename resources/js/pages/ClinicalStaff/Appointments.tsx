import React, { useState, useEffect } from 'react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from 'date-fns';
import { Eye, FileText } from 'lucide-react';

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

interface Appointment {
    id: number;
    patient: Patient;
    record_type: string;
    appointment_date: string;
    status: string;
    details: string;
    reference_number?: string;
    assigned_doctor_id?: number;
    doctor?: {
        id: number;
        name: string;
        email: string;
    };
    appointment_type?: string; // For additional appointment type info
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
    const getAppointmentTime = (details: string) => {
        try {
            const detailsObj = JSON.parse(details);
            return detailsObj.appointment_time || 'N/A';
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
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
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
                                                <TableHead>Reference #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAppointments.map((appointment) => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>
                                                        {appointment.reference_number || `REF-${appointment.id}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{appointment.patient.name}</div>
                                                        <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {appointment.doctor ? (
                                                            <>
                                                                <div className="font-medium">Dr. {appointment.doctor.name}</div>
                                                                <div className="text-sm text-gray-500">{appointment.doctor.email}</div>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-500">Unassigned</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-gray-100 text-gray-800">
                                                            {appointment.record_type.replace('_', ' ').charAt(0).toUpperCase() +
                                                            appointment.record_type.replace('_', ' ').slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{formatDate(appointment.appointment_date)}</div>
                                                        <div className="text-sm text-gray-500">{getAppointmentTime(appointment.details)}</div>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button asChild variant="ghost" size="icon">
                                                                <Link href={route('staff.appointments.show', appointment.id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>

                                                            <Button asChild variant="ghost" size="icon">
                                                                <Link href={route('staff.clinical.info.show', appointment.id)}>
                                                                    <FileText className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <p className="text-gray-500 mb-2">No appointments found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
