import AdminLayout from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, User, Stethoscope, UserCog } from "lucide-react";
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart as ReBarChart, Bar, PieChart as RePieChart, Pie, Cell, AreaChart as ReAreaChart, Area } from 'recharts';

interface User {
    name: string;
    email: string;
    role?: string;
}

interface Stats {
    users: {
        total: number;
        patients: number;
        doctors: number;
        staff: number;
        admins: number;
    };
    appointments: {
        total: number;
        pending: number;
        completed: number;
        cancelled: number;
        todayTotal: number;
    };
}

interface ChartData {
    appointmentTrends: Array<{
        name: string;
        pending: number;
        completed: number;
        cancelled: number;
    }>;
    appointmentTypes: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    patientGrowth: Array<{
        name: string;
        new: number;
        returning: number;
    }>;
    userDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
}

interface Appointment {
    id: number;
    patient: {
        name: string;
    };
    assignedDoctor: {
        name: string;
    } | null;
    appointment_date: string;
    record_type: string;
    status: string;
}

interface DashboardProps {
    user: User;
    stats: Stats;
    chartData: ChartData;
    upcomingAppointments: Appointment[];
}

export default function AdminDashboard({ user, stats, chartData, upcomingAppointments = [] }: DashboardProps) {
    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout user={user}>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Welcome back, {user.name}! Here's what's happening with your clinic today.
                            </p>
                        </div>

                {/* Users Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                                    <p className="text-3xl font-bold">{stats.users.patients}</p>
                                </div>
                                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                                    <User size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Doctors</p>
                                    <p className="text-3xl font-bold">{stats.users.doctors}</p>
                                </div>
                                <div className="rounded-full bg-green-100 p-3 text-green-600">
                                    <Stethoscope size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Staff</p>
                                    <p className="text-3xl font-bold">{stats.users.staff}</p>
                                </div>
                                <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                                    <UserCog size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                                    <p className="text-3xl font-bold">{stats.users.total}</p>
                                </div>
                                <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                                    <Users size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Appointment Statistics */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                    <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                                    <p className="text-3xl font-bold">{stats.appointments.total}</p>
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
                                    <p className="text-sm font-medium text-gray-500">Pending Appointments</p>
                                    <p className="text-3xl font-bold">{stats.appointments.pending}</p>
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
                                    <p className="text-sm font-medium text-gray-500">Completed Appointments</p>
                                    <p className="text-3xl font-bold">{stats.appointments.completed}</p>
                                        </div>
                                <div className="rounded-full bg-green-100 p-3 text-green-600">
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
                                    <p className="text-3xl font-bold">{stats.appointments.todayTotal}</p>
                                        </div>
                                <div className="rounded-full bg-red-100 p-3 text-red-600">
                                            <FileText size={20} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                {/* Real-time Analytics Graphs */}
                        <div className="grid gap-6 md:grid-cols-2">
                    {/* Appointment Trends Chart */}
                    <Card className="col-span-2 md:col-span-1">
                                <CardHeader>
                            <CardTitle className="text-xl">Appointment Trends</CardTitle>
                                    <CardDescription>
                                Monthly appointment statistics
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReLineChart
                                        data={chartData.appointmentTrends}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="pending"
                                            stroke="#facc15"
                                            activeDot={{ r: 8 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="completed"
                                            stroke="#10b981"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cancelled"
                                            stroke="#ef4444"
                                        />
                                    </ReLineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Distribution Chart */}
                    <Card className="col-span-2 md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-xl">User Distribution</CardTitle>
                            <CardDescription>
                                Breakdown of user types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={chartData.userDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.userDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient Growth */}
                    <Card className="col-span-2 md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-xl">Patient Growth</CardTitle>
                            <CardDescription>
                                Monthly patient registration trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReAreaChart
                                        data={chartData.patientGrowth}
                                        margin={{
                                            top: 10,
                                            right: 30,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="new" stackId="1" stroke="#8884d8" fill="#8884d8" name="New Patients" />
                                        <Area type="monotone" dataKey="returning" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Returning Patients" />
                                    </ReAreaChart>
                                </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                    {/* Appointment Types Chart */}
                    <Card className="col-span-2 md:col-span-1">
                                <CardHeader>
                            <CardTitle className="text-xl">Appointment Types</CardTitle>
                                    <CardDescription>
                                Distribution of appointment categories
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart
                                        data={chartData.appointmentTypes}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Appointments">
                                            {chartData.appointmentTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </ReBarChart>
                                </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                {/* Upcoming Appointments */}
                        <Card>
                            <CardHeader>
                        <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
                                <CardDescription>
                            Next scheduled appointments
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Patient</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Doctor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {upcomingAppointments.map((appointment) => (
                                        <tr key={appointment.id}>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{appointment.patient.name}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm text-gray-500">
                                                    {appointment.assignedDoctor ? appointment.assignedDoctor.name : 'Not assigned'}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm text-gray-500">{formatDate(appointment.appointment_date)}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm text-gray-500">{appointment.record_type}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5
                                                    ${appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                                    {appointment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {upcomingAppointments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No upcoming appointments
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
        </AdminLayout>
    );
}
