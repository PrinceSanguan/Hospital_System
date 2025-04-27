import { Header } from '@/components/admin/header'; // Import the Header component
import { Sidebar } from '@/components/admin/sidebar'; // Import the Sidebar component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, FileText, Edit, Users, UserPlus, UserX, User, Settings, BarChart } from "lucide-react";
import { Link } from "@inertiajs/react";
import { usePage } from '@inertiajs/react';

interface User {
    name: string;
    email: string;
    role?: string;
}

interface DashboardProps {
    user: User;
    stats?: {
        totalRecords: number;
        totalUsers: number;
        pendingAppointments: number;
        todayAppointments: number;
    };
}

export default function AdminDashboard({ user, stats = {
    totalRecords: 245,
    totalUsers: 120,
    pendingAppointments: 18,
    todayAppointments: 8
} }: DashboardProps) {
    // Access Ziggy routes from the page props
    const { props } = usePage();
    const routes = (props as any).ziggy?.routes || {};

    // Helper function to check if a route exists
    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Pass user data to the Sidebar component */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Pass user data to the Header component */}
                <Header user={user} />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Welcome back, {user.name}! Here's what's happening with your clinic today.
                            </p>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Records</p>
                                            <p className="text-3xl font-bold">{stats.totalRecords}</p>
                                        </div>
                                        <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                                            <p className="text-3xl font-bold">{stats.totalUsers}</p>
                                        </div>
                                        <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                                            <Users size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Pending Appointments</p>
                                            <p className="text-3xl font-bold">{stats.pendingAppointments}</p>
                                        </div>
                                        <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                                            <FileText size={20} />
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
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Management Sections */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Record Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Record Management</CardTitle>
                                    <CardDescription>
                                        Manage patient records and medical information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        {routeExists('admin.records.create') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.records.create')} className="flex items-center">
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    Add New Record
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start" disabled>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add New Record
                                            </Button>
                                        )}

                                        {routeExists('admin.records.index') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.records.index')} className="flex items-center">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View All Records
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start" disabled>
                                                <FileText className="mr-2 h-4 w-4" />
                                                View All Records
                                            </Button>
                                        )}

                                        {routeExists('admin.records.index') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.records.index')} className="flex items-center">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Records
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start" disabled>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Records
                                            </Button>
                                        )}

                                        {routeExists('admin.records.index') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.records.index')} className="flex items-center text-red-500 hover:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Records
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start text-red-500" disabled>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Records
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Account Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">User's Account Management</CardTitle>
                                    <CardDescription>
                                        Manage user accounts, roles and permissions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3">
                                        {routeExists('admin.users.create') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.users.create')} className="flex items-center">
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add New User
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start" disabled>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Add New User
                                            </Button>
                                        )}

                                        {routeExists('admin.users.index') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.users.index')} className="flex items-center">
                                                    <User className="mr-2 h-4 w-4" />
                                                    View All Users
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start" disabled>
                                                <User className="mr-2 h-4 w-4" />
                                                View All Users
                                            </Button>
                                        )}

                                        {routeExists('admin.users.index') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.users.index')} className="flex items-center">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    Manage Users
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start" disabled>
                                                <Users className="mr-2 h-4 w-4" />
                                                Manage Users
                                            </Button>
                                        )}

                                        {routeExists('admin.users.index') ? (
                                            <Button asChild variant="outline" className="justify-start">
                                                <Link href={route('admin.users.index')} className="flex items-center text-red-500 hover:text-red-600">
                                                    <UserX className="mr-2 h-4 w-4" />
                                                    Delete Users
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="justify-start text-red-500" disabled>
                                                <UserX className="mr-2 h-4 w-4" />
                                                Delete Users
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Quick Actions</CardTitle>
                                <CardDescription>
                                    Frequently used admin functions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {routeExists('admin.records.create') ? (
                                        <Button asChild>
                                            <Link href={route('admin.records.create')}>
                                                Create New Record
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button disabled>
                                            Create New Record
                                        </Button>
                                    )}

                                    {routeExists('admin.users.create') ? (
                                        <Button asChild variant="outline">
                                            <Link href={route('admin.users.create')}>
                                                Add New User
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" disabled>
                                            Add New User
                                        </Button>
                                    )}

                                    {routeExists('admin.settings') ? (
                                        <Button asChild variant="outline">
                                            <Link href={route('admin.settings')}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                System Settings
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button variant="outline" disabled>
                                            <Settings className="mr-2 h-4 w-4" />
                                            System Settings
                                        </Button>
                                    )}

                                    <Button variant="secondary" disabled>
                                        <BarChart className="mr-2 h-4 w-4" />
                                        Generate Reports
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
