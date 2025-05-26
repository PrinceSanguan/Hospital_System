import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search,
    Filter,
    CheckCircle,
    Eye
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
import axios from 'axios';

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
    approved_by?: number;
    approved_by_name?: string;
}

interface AppointmentsProps {
    user: UserData;
    appointments: Appointment[];
}

export default function Appointments({ user, appointments = [] }: AppointmentsProps) {
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);
    const [dateRange, setDateRange] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Mark all appointment notifications as read when the page loads
    useEffect(() => {
        // Call the API endpoint to mark all appointment notifications as read
        axios.post(route('doctor.notifications.mark.appointment.read'))
            .then(() => {
                // Force refresh of notification badge in the layout
                const event = new CustomEvent('notifications-updated');
                window.dispatchEvent(event);
            })
            .catch(error => {
                console.error('Failed to mark notifications as read:', error);
            });
    }, []);

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

    // Parse details to extract appointment reason
    const parseAppointmentReason = (details: string) => {
        if (!details) return "N/A";

        try {
            // Check if it looks like JSON
            if (details.trim().startsWith('{') && details.trim().endsWith('}')) {
                const detailsObj = JSON.parse(details);
                if (detailsObj.reason) {
                    return detailsObj.reason;
                }
            }
            return details;
        } catch (_) {
            // Return original string if JSON parsing fails
            return details;
        }
    };

    // Handle marking appointment as done/completed
    const markAppointmentAsDone = (appointmentId: number) => {
        if (confirm('Mark this appointment as completed?')) {
            router.post(route('doctor.appointments.updateStatus', {
                appointment_id: appointmentId,
                status: 'completed',
                notes: 'Appointment completed successfully'
            }), {}, {
                onSuccess: () => {
                    // Update the local state to reflect the change immediately
                    setFilteredAppointments(prevAppointments =>
                        prevAppointments.map(appointment => {
                            if (appointment.id === appointmentId) {
                                return { ...appointment, status: 'completed' };
                            }
                            return appointment;
                        })
                    );

                    // Show success notification
                    alert("Appointment has been marked as completed");
                }
            });
        }
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

        // Sort by status (pending first) and then by date in ascending order
        filtered.sort((a, b) => {
            // First sort by status (pending first, then others)
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;

            // For the same status, sort by date (ascending)
            return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
        });

        setFilteredAppointments(filtered);
    }, [appointments, dateRange, statusFilter, searchTerm]);

    // Handle filter application
    const applyFilters = () => {
        // Filters are already applied through useEffect
    };

    return (
        <DoctorLayout user={user}>
            <Head title="Appointment History" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Appointment History</h1>
                            <p className="text-gray-500">
                                View your past and upcoming appointments
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {/* View Calendar button removed */}
                        </div>
                    </div>

                    {/* Filter and Search */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">Date Range</label>
                                    <Select
                                        defaultValue="all"
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
                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
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
                            <CardTitle>Appointment History</CardTitle>
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
                                            <TableHead>Approved By</TableHead>
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
                                                <TableCell className="max-w-[200px] truncate" title={parseAppointmentReason(appointment.details)}>
                                                    {parseAppointmentReason(appointment.details)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            appointment.status === 'completed' ? "bg-green-100 text-green-800" :
                                                            appointment.status === 'confirmed' ? "bg-blue-100 text-blue-800" :
                                                            appointment.status === 'pending' ? "bg-gray-100 text-gray-800" :
                                                            "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {(appointment.status === 'confirmed' || appointment.status === 'cancelled') && appointment.approved_by_name ? (
                                                        <span className={appointment.status === 'confirmed' ? 'text-green-600' : 'text-red-600'}>
                                                            {appointment.approved_by_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={route('doctor.appointments.show', appointment.id)}>
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>

                                                        {appointment.status === 'confirmed' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                                                onClick={() => markAppointmentAsDone(appointment.id)}
                                                            >
                                                                <CheckCircle className="mr-1 h-4 w-4" />
                                                                Done
                                                            </Button>
                                                        )}
                                                    </div>
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
