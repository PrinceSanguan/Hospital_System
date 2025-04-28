import { Header } from '@/components/clinicalstaff/header';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, FileText } from "lucide-react";

interface User {
    name: string;
    email: string;
    role?: string;
}

interface DashboardProps {
    user: User;
    stats?: {
        totalPatients: number;
        todayAppointments: number;
        pendingLabResults: number;
    };
}

export default function StaffDashboard({ user, stats = {
    totalPatients: 8,
    todayAppointments: 0,
    pendingLabResults: 0
} }: DashboardProps) {
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
                                            <Users size={20} />
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
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Today's Appointments Section */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="mb-4 text-xl font-semibold">Today's Appointments</h2>
                                {stats.todayAppointments > 0 ? (
                                    <div className="divide-y">
                                        {/* Appointments would be listed here */}
                                        <p>Appointment list would appear here</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center p-6 text-gray-500">
                                        <Calendar className="mr-2 h-5 w-5" />
                                        <span>No appointments scheduled for today</span>
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
