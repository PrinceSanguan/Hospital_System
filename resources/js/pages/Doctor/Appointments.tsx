import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Calendar,
    Clock,
    Search,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { Link, usePage } from '@inertiajs/react';
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

interface Patient {
    id: number;
    name: string;
    email: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    status: string;
}

interface User {
    name: string;
    email: string;
    role?: string;
}

interface AppointmentsProps {
    user: User;
    appointments: Appointment[];
}

export default function DoctorAppointments({ user, appointments = [] }: AppointmentsProps) {
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

    // Sample appointments data for UI demo
    const sampleAppointments: Appointment[] = [
        {
            id: 1,
            patient: {
                id: 101,
                name: "John Smith",
                email: "john.smith@example.com"
            },
            appointment_date: "2023-08-15",
            appointment_time: "09:30 AM",
            reason: "Annual physical examination",
            status: "confirmed"
        },
        {
            id: 2,
            patient: {
                id: 102,
                name: "Maria Garcia",
                email: "maria.garcia@example.com"
            },
            appointment_date: "2023-08-15",
            appointment_time: "10:45 AM",
            reason: "Follow-up consultation",
            status: "confirmed"
        },
        {
            id: 3,
            patient: {
                id: 103,
                name: "Robert Johnson",
                email: "robert.johnson@example.com"
            },
            appointment_date: "2023-08-16",
            appointment_time: "2:15 PM",
            reason: "Diabetes management",
            status: "pending"
        },
        {
            id: 4,
            patient: {
                id: 104,
                name: "Sarah Williams",
                email: "sarah.williams@example.com"
            },
            appointment_date: "2023-08-17",
            appointment_time: "11:00 AM",
            reason: "Blood pressure check",
            status: "cancelled"
        },
        {
            id: 5,
            patient: {
                id: 105,
                name: "Michael Brown",
                email: "michael.brown@example.com"
            },
            appointment_date: "2023-08-18",
            appointment_time: "3:30 PM",
            reason: "Laboratory results discussion",
            status: "confirmed"
        }
    ];

    // Use either real data or sample data
    const displayAppointments = appointments.length > 0 ? appointments : sampleAppointments;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header user={user} />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Appointments</h1>
                                <p className="text-gray-500 dark:text-gray-400">
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
                        <Card>
                            <CardContent className="p-4">
                                <div className="grid gap-4 md:grid-cols-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium leading-none">Date Range</label>
                                        <Select defaultValue="thisWeek">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="thisWeek">This Week</SelectItem>
                                                <SelectItem value="thisMonth">This Month</SelectItem>
                                                <SelectItem value="lastMonth">Last Month</SelectItem>
                                                <SelectItem value="custom">Custom Range</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium leading-none">Status</label>
                                        <Select defaultValue="all">
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
                                                className="w-full bg-white pl-8"
                                            />
                                        </div>
                                    </div>

                                    <Button variant="outline" className="flex items-center gap-1">
                                        <Filter className="h-4 w-4" />
                                        Apply Filters
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appointments Table */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Appointments List</CardTitle>
                                <CardDescription>
                                    Showing all appointments
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <div className="flex items-center gap-1">
                                                    Patient
                                                    <ArrowUpDown className="h-4 w-4" />
                                                </div>
                                            </TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-1">
                                                    Date
                                                    <ArrowUpDown className="h-4 w-4" />
                                                </div>
                                            </TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayAppointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{appointment.patient.name}</span>
                                                        <span className="text-xs text-gray-500">{appointment.patient.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                                                <TableCell>{appointment.appointment_time}</TableCell>
                                                <TableCell>{appointment.reason}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${
                                                            appointment.status === 'confirmed'
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                                : appointment.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                                : appointment.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                                                : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                                        }`}
                                                    >
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline">View</Button>
                                                        <Button size="sm" variant="outline">Edit</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
