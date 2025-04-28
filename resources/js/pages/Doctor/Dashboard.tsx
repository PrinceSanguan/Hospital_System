import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Calendar, ClipboardCheck, Users, User, Clock, Search } from "lucide-react";
import { Link, usePage } from '@inertiajs/react';

interface Patient {
    id: number;
    name: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    appointment_date: string;
    appointment_time?: string;
    reason: string;
    status: string;
}

interface User {
    name: string;
    email: string;
    role?: string;
}

interface DashboardProps {
    user: User;
    stats: {
        patients: number;
        appointments: number;
    };
    upcomingAppointments: Appointment[];
}

interface ZiggyRoutes {
    [key: string]: unknown;
}

interface PageProps {
    ziggy: {
        routes: ZiggyRoutes;
    };
}

export default function DoctorDashboard({ user, stats, upcomingAppointments = [] }: DashboardProps) {
    // Access Ziggy routes from the page props
    const { props } = usePage();
    const routes = (props as any)?.ziggy?.routes || {};

    // Helper function to check if a route exists
    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Doctor Dashboard</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Welcome back, Dr. {user.name}! Here's your overview for today.
                            </p>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Patients</p>
                                            <p className="text-3xl font-bold">{stats.patients}</p>
                                        </div>
                                        <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                                            <Users size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                                            <p className="text-3xl font-bold">{stats.appointments}</p>
                                        </div>
                                        <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                                            <Calendar size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Today's Schedule</p>
                                            <p className="text-3xl font-bold">
                                                {upcomingAppointments.filter(app =>
                                                    new Date(app.appointment_date).toDateString() === new Date().toDateString()
                                                ).length}
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                                            <Clock size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Pending Records</p>
                                            <p className="text-3xl font-bold">7</p>
                                        </div>
                                        <div className="rounded-full bg-green-100 p-3 text-green-600">
                                            <ClipboardCheck size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Management Sections */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Patient Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Patient Management</CardTitle>
                                    <CardDescription>
                                        Access and manage your patients
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.patients.index') ? route('doctor.patients.index') : '#'} className="flex items-center">
                                                <Users className="mr-2 h-4 w-4" />
                                                View All Patients
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.patients.search') ? route('doctor.patients.search') : '#'} className="flex items-center">
                                                <Search className="mr-2 h-4 w-4" />
                                                Search Patients
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.records.create') ? route('doctor.records.create') : '#'} className="flex items-center">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Create Medical Record
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.records.index') ? route('doctor.records.index') : '#'} className="flex items-center">
                                                <FileText className="mr-2 h-4 w-4" />
                                                View Medical Records
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Appointment Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Appointment Management</CardTitle>
                                    <CardDescription>
                                        Manage your schedule and appointments
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.appointments.calendar') ? route('doctor.appointments.calendar') : '#'} className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                View Calendar
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.appointments.index') ? route('doctor.appointments.index') : '#'} className="flex items-center">
                                                <Clock className="mr-2 h-4 w-4" />
                                                View All Appointments
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.appointments.create') ? route('doctor.appointments.create') : '#'} className="flex items-center">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Schedule New Appointment
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline" className="justify-start">
                                            <Link href={routeExists('doctor.availability') ? route('doctor.availability') : '#'} className="flex items-center">
                                                <User className="mr-2 h-4 w-4" />
                                                Manage Availability
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Upcoming Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
                                <CardDescription>
                                    Your schedule for the coming days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {upcomingAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingAppointments.map((appointment) => (
                                            <div key={appointment.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="font-medium">{appointment.patient.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDate(appointment.appointment_date)}
                                                        {appointment.appointment_time && ` at ${appointment.appointment_time}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{appointment.reason}</p>
                                                </div>
                                                <div>
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        appointment.status === 'confirmed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                                        <div className="text-center">
                                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-lg font-medium">No upcoming appointments</h3>
                                            <p className="mt-1 text-sm text-gray-500">You don't have any appointments scheduled.</p>
                                            <Button asChild className="mt-6" variant="outline">
                                                <Link href={routeExists('doctor.appointments.create') ? route('doctor.appointments.create') : '#'}>
                                                    Schedule Appointment
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Quick Actions</CardTitle>
                                <CardDescription>
                                    Frequently used functions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    <Button asChild>
                                        <Link href={routeExists('doctor.records.create') ? route('doctor.records.create') : '#'}>
                                            Create Medical Record
                                        </Link>
                                    </Button>

                                    <Button asChild variant="outline">
                                        <Link href={routeExists('doctor.appointments.create') ? route('doctor.appointments.create') : '#'}>
                                            Schedule Appointment
                                        </Link>
                                    </Button>

                                    <Button asChild variant="outline">
                                        <Link href={routeExists('doctor.patients.search') ? route('doctor.patients.search') : '#'}>
                                            <Search className="mr-2 h-4 w-4" />
                                            Find Patient
                                        </Link>
                                    </Button>

                                    <Button asChild variant="secondary">
                                        <Link href={routeExists('doctor.appointments.calendar') ? route('doctor.appointments.calendar') : '#'}>
                                            <Calendar className="mr-2 h-4 w-4" />
                                            View Calendar
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
