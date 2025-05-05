import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Microscope,
  Clock,
  Calendar,
  Bell,
  Home,
  FileText,
  Calendar as CalendarIcon,
  LogOut,
  Search,
  Menu,
} from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  appointments: Array<{
    id: number;
    assignedDoctor: {
      id: number;
      name: string;
    } | null;
    appointment_date: string;
    record_type: string;
    details: string | null;
    status: string;
  }>;
  notifications?: Array<{
    id: number;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    related_id?: number;
    related_type?: string;
  }>;
}

export default function Appointments({
  user,
  appointments = [],
  notifications = []
}: AppointmentProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Calculate unread notifications
  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(appointment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(appointment.status.toLowerCase()) &&
      new Date(appointment.appointment_date) >= new Date();
    if (activeTab === 'completed') return appointment.status.toLowerCase() === 'completed';
    if (activeTab === 'cancelled') return appointment.status.toLowerCase() === 'cancelled';
    if (activeTab === 'pending') return appointment.status.toLowerCase() === 'pending';
    return true;
  });

  // Parse appointment details from JSON string
  const getAppointmentDetails = (details: string | null) => {
    if (!details) return {};

    // If already an object, return as is
    if (typeof details === 'object') return details;

    try {
      // Try to parse as JSON
      return JSON.parse(details);
    } catch {
      // If not valid JSON, return an object with the string as reason
      console.log('Details not in JSON format, using as plain text:', details);
      return { reason: details };
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      name: "Dashboard",
      icon: <Home size={18} />,
      path: "/patient/dashboard",
      active: false
    },
    {
      name: "Book Appointment",
      icon: <CalendarIcon size={18} />,
      path: "/patient/appointments/book",
      active: false
    },
    {
      name: "My Appointments",
      icon: <Clock size={18} />,
      path: "/patient/appointments",
      active: true
    },
    {
      name: "Medical Records",
      icon: <FileText size={18} />,
      path: "/patient/records",
      active: false
    },
    {
      name: "Doctors",
      icon: <Stethoscope size={18} />,
      path: "/patient/doctors",
      active: false
    }
  ];

  // Handle logout functionality
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    router.get('/logout');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Head title="My Appointments" />

      {/* Sidebar - hidden on mobile */}
      <div className={`bg-white fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/patient/dashboard" className="flex items-center">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Famcare Health</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2 p-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>

          <div className="flex items-center gap-4 md:ml-auto">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full md:w-[200px] lg:w-[300px] pl-8"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <Badge
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b p-4">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                </div>
                <div className="max-h-80 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 ${notification.read ? "" : "bg-blue-50"} cursor-pointer`}
                        >
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-sm">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t p-2">
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/patient/notifications">View all notifications</Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.get('/logout');
                    }}
                    className="w-full text-left"
                  >
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-1 text-gray-600">View and manage your scheduled appointments</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>View and manage your appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appointment) => {
                      const details = getAppointmentDetails(appointment.details);
                      const appointmentDate = new Date(appointment.appointment_date);

                      return (
                        <div key={appointment.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center mb-2 md:mb-0">
                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              {appointment.record_type === 'medical_checkup' ? <Stethoscope size={20} /> : <Microscope size={20} />}
                            </div>
                            <div>
                              <h3 className="font-medium">{appointment.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}</h3>
                              <p className="text-sm text-gray-500">
                                {appointment.assignedDoctor
                                  ? `Dr. ${appointment.assignedDoctor.name}`
                                  : 'Doctor not assigned yet'}
                              </p>
                              {details.reason && (
                                <p className="text-xs text-gray-500 mt-1">Reason: {details.reason}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center mt-2 md:mt-0">
                            <div className="text-sm text-gray-700 flex items-center mr-4">
                              <Clock size={16} className="mr-1" />
                              <span>{format(appointmentDate, 'MMM d, yyyy')}</span>
                              <span className="mx-1">•</span>
                              <span>{format(appointmentDate, 'h:mm a')}</span>
                            </div>

                            <Badge className={
                              appointment.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                              appointment.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                              appointment.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No appointments found.</p>
                      {activeTab === 'all' && (
                        <p className="text-sm text-gray-400 mt-2">Book an appointment to get started!</p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
