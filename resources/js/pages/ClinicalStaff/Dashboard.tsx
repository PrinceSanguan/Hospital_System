import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Link } from '@inertiajs/react';
import { EyeIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
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

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
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
                            <CardContent className="p-6">
                                <h2 className="mb-4 text-xl font-semibold">All Appointments</h2>
                                {appointments.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appointments.map((appointment) => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>{appointment.patient.name}</TableCell>
                                                    <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                                                    <TableCell>{appointment.doctor ? `Dr. ${appointment.doctor.name}` : 'Unassigned'}</TableCell>
                                                    <TableCell>{appointment.reason || 'Not specified'}</TableCell>
                                                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={route('staff.appointments.show', appointment.id)}>
                                                                <EyeIcon className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
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
        </div>
    );
}
