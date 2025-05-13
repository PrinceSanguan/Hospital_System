import React, { useState } from 'react';
import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Head, Link } from '@inertiajs/react';
import { EyeIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from 'react-hot-toast';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface AppointmentDetails {
    appointment_time?: string;
    reason?: string;
    notes?: string;
}

interface Appointment {
    id: number;
    patient: {
        id: number;
        name: string;
    };
    appointment_date: string;
    status: string;
    doctor?: {
        id: number;
        name: string;
    };
    reason?: string;
    reference_number?: string;
    details?: AppointmentDetails;
    has_lab_results?: boolean;
}

interface DashboardProps {
    user: User;
    stats?: {
        totalPatients: number;
        todayAppointments: number;
        pendingLabResults: number;
    };
    appointments?: Appointment[];
}

export default function StaffDashboard({
    user,
    stats = {
        totalPatients: 8,
        todayAppointments: 0,
        pendingLabResults: 0
    },
    appointments = []
}: DashboardProps) {
    const [showDenyDialog, setShowDenyDialog] = useState(false);
    const [denyAppointmentId, setDenyAppointmentId] = useState<number | null>(null);
    const [denyNote, setDenyNote] = useState('');
    const [isDenySubmitting, setIsDenySubmitting] = useState(false);
    const [dashboardAppointments, setDashboardAppointments] = useState<Appointment[]>(appointments);

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'MMM dd, yyyy');
        } catch {
            return dateString;
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

    // Handle appointment status update
    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            const response = await axios.post(route('staff.appointments.status', id), {
                status: newStatus,
                notes: 'Status updated by clinical staff from dashboard'
            });

            if (response.data.success) {
                // Update the state with the new array
                setDashboardAppointments(
                    dashboardAppointments.map(appointment => {
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

    // Handle opening the deny dialog
    const openDenyDialog = (id: number) => {
        setDenyAppointmentId(id);
        setDenyNote('');
        setShowDenyDialog(true);
    };

    // Handle the appointment denial with notes
    const handleDenyAppointment = async () => {
        if (!denyAppointmentId || !denyNote.trim()) return;
        
        setIsDenySubmitting(true);
        try {
            const response = await axios.post(route('staff.appointments.status', denyAppointmentId), {
                status: 'cancelled',
                notes: denyNote
            });

            if (response.data.success) {
                // Update the state with the new array
                setDashboardAppointments(
                    dashboardAppointments.map(appointment => {
                        if (appointment.id === denyAppointmentId) {
                            return {
                                ...appointment,
                                status: 'cancelled'
                            };
                        }
                        return appointment;
                    })
                );
                
                toast.success('Appointment cancelled successfully');
                setShowDenyDialog(false);
            } else {
                toast.error('Failed to cancel appointment');
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            toast.error('An error occurred while cancelling the appointment');
        } finally {
            setIsDenySubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Head title="Dashboard" />
            
            {/* Sidebar Component */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header Component */}
                <Header user={user} />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome, {user.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Here's an overview of your clinical activities
                            </p>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Patients</p>
                                            <p className="text-3xl font-bold">{stats.totalPatients}</p>
                                        </div>
                                        <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                                            <UserGroupIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                                            <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                                        </div>
                                        <div className="rounded-full bg-green-100 p-3 text-green-600">
                                            <Calendar size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Pending Lab Results</p>
                                            <p className="text-3xl font-bold">{stats.pendingLabResults}</p>
                                        </div>
                                        <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                                            <DocumentTextIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* All Appointments Section */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Appointment List</CardTitle>
                                <CardDescription>
                                    Showing {dashboardAppointments.length} appointments
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboardAppointments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Appointment Ref #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dashboardAppointments.map((appointment) => (
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
                                                    <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                                                    <TableCell>{appointment.reason || 'Not specified'}</TableCell>
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
                                                                                <p>Deny with note</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </>
                                                            )}
                                                            
                                                            {/* View Button */}
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button asChild variant="ghost" size="icon">
                                                                            <Link href={route('staff.appointments.show', appointment.id)}>
                                                                                <EyeIcon className="h-4 w-4" />
                                                                            </Link>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>View Details</p>
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
                                    <div className="flex items-center justify-center p-6 text-gray-500">
                                        <Calendar className="mr-2 h-5 w-5" />
                                        <span>No appointments found in the system</span>
                                    </div>
                                )}
                                <div className="mt-4 text-right">
                                    <Button asChild variant="outline">
                                        <Link href={route('staff.appointments.index')}>
                                            View All Appointments
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Deny Appointment Dialog */}
            <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deny Appointment</DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a reason for denying this appointment. This note will be visible to the patient.
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="denyNote">Denial Reason</Label>
                            <Textarea
                                id="denyNote"
                                placeholder="Enter reason for denial..."
                                value={denyNote}
                                onChange={(e) => setDenyNote(e.target.value)}
                                rows={4}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDenyDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDenyAppointment}
                            disabled={!denyNote.trim() || isDenySubmitting}
                        >
                            {isDenySubmitting ? 'Processing...' : 'Deny Appointment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
