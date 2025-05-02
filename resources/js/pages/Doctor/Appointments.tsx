import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Calendar,
    Search,
    Filter
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UserData } from '@/types';

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    appointment_date: string;
    record_type: string;
    status: string;
    details: string;
}

interface AppointmentsProps {
    user: UserData;
    appointments: Appointment[];
}

export default function Appointments({ user, appointments = [] }: AppointmentsProps) {
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);
    const [dateRange, setDateRange] = useState('thisWeek');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Helper function to format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter appointments based on search and filters
    useEffect(() => {
        let filtered = [...appointments];

        // Apply date range filter
        if (dateRange !== 'all') {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());

            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

            // Define variables outside of switch cases to avoid linter errors
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            filtered = filtered.filter(appointment => {
                const appointmentDate = new Date(appointment.appointment_date);

                switch (dateRange) {
                    case 'today':
                        return appointmentDate.toDateString() === today.toDateString();
                    case 'thisWeek':
                        return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
                    case 'thisMonth':
                        return appointmentDate >= startOfMonth && appointmentDate <= endOfMonth;
                    case 'lastMonth':
                        return appointmentDate >= startOfLastMonth && appointmentDate <= endOfLastMonth;
                    default:
                        return true;
                }
            });
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(appointment => appointment.status === statusFilter);
        }

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(appointment =>
                appointment.patient.name.toLowerCase().includes(search) ||
                appointment.patient.email.toLowerCase().includes(search) ||
                (appointment.details && appointment.details.toLowerCase().includes(search))
            );
        }

        setFilteredAppointments(filtered);
    }, [appointments, dateRange, statusFilter, searchTerm]);

    // Handle filter application
    const applyFilters = () => {
        // Filters are already applied through useEffect
    };

    return (
        <DoctorLayout user={user}>
            <Head title="Appointments" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                            <p className="text-gray-500">
                                Manage your upcoming and past appointments
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild>
                                <Link href={route('doctor.appointments.create')}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    New Appointment
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route('doctor.appointments.calendar')}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    View Calendar
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Filter and Search */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">Date Range</label>
                                    <Select
                                        defaultValue="thisWeek"
                                        onValueChange={(value) => setDateRange(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Dates</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="thisWeek">This Week</SelectItem>
                                            <SelectItem value="thisMonth">This Month</SelectItem>
                                            <SelectItem value="lastMonth">Last Month</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">Status</label>
                                    <Select
                                        defaultValue="all"
                                        onValueChange={(value) => setStatusFilter(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="completed">Confirmed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            type="search"
                                            placeholder="Search patients..."
                                            className="w-full pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="flex items-center gap-1"
                                    onClick={applyFilters}
                                >
                                    <Filter className="h-4 w-4" />
                                    Apply Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointments Table */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <CardDescription>
                                Showing {filteredAppointments.length} appointments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredAppointments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAppointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell>
                                                    <div className="font-medium">{appointment.patient.name}</div>
                                                    <div className="text-sm text-gray-500">{appointment.patient.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>{formatDate(appointment.appointment_date)}</div>
                                                    <div className="text-sm text-gray-500">{formatTime(appointment.appointment_date)}</div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={appointment.details}>
                                                    {appointment.details || "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            appointment.status === 'completed' ? 'default' :
                                                            appointment.status === 'pending' ? 'outline' :
                                                            'destructive'
                                                        }
                                                    >
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={route('doctor.appointments.show', appointment.id)}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-4 text-center">
                                    <p className="text-gray-500">No appointments found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DoctorLayout>
    );
}
