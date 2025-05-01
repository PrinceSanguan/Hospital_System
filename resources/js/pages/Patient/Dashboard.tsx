import { Link, router } from "@inertiajs/react";
import {
  Calendar,
  Microscope,
  Stethoscope,
  Bell,
  Home,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  LogOut,
  Search,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

// Calendar component imports
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface PatientDashboardProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  upcomingAppointments: Array<{
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
  labResults: Array<{
    id: number;
    record_type: string;
    lab_results: Record<string, string | number | boolean>;
    updated_at: string;
  }>;
  medicalRecords: Array<{
    id: number;
    assignedDoctor: {
      id: number;
      name: string;
    } | null;
    record_type: string;
    details: string | null;
    updated_at: string;
  }>;
  notifications: Array<{
    id: number;
    message: string;
    read: boolean;
    created_at: string;
  }>;
  doctors: Array<{
    id: number;
    name: string;
    specialty: string;
    availability: string[];
    image: string;
  }>;
}

export default function PatientDashboard({
  user,
  upcomingAppointments = [],
  labResults = [],
  medicalRecords = [],
  notifications = [
    { id: 1, message: "Your appointment has been confirmed for tomorrow at 10:00 AM", read: false, created_at: "2023-05-01T10:00:00.000Z" },
    { id: 2, message: "Dr. Johnson has updated your prescription", read: false, created_at: "2023-05-01T08:30:00.000Z" },
    { id: 3, message: "Your lab results are now available", read: true, created_at: "2023-04-30T15:20:00.000Z" }
  ],
  doctors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      availability: ["Monday", "Wednesday", "Friday"]
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Neurologist",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      availability: ["Tuesday", "Thursday", "Saturday"]
    }
  ]
}: PatientDashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");

  // Calculate unread notifications
  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;

  const sidebarItems = [
    {
      name: "Dashboard",
      icon: <Home size={18} />,
      path: "/patient/dashboard",
      active: activeTab === "dashboard"
    },
    {
      name: "Book Appointment",
      icon: <CalendarIcon size={18} />,
      path: "/patient/appointments/book",
      active: activeTab === "book-appointment"
    },
    {
      name: "My Appointments",
      icon: <Clock size={18} />,
      path: "/patient/appointments",
      active: activeTab === "appointments"
    },
    {
      name: "Medical Records",
      icon: <FileText size={18} />,
      path: "/patient/records",
      active: activeTab === "records"
    },
    {
      name: "Doctors",
      icon: <Stethoscope size={18} />,
      path: "/patient/doctors",
      active: activeTab === "doctors"
    }
  ];

  const appointmentsTodayCount = upcomingAppointments.filter(appointment => {
    const today = new Date();
    const apptDate = new Date(appointment.appointment_date);
    return apptDate.toDateString() === today.toDateString();
  }).length;

  // Handle logout functionality
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    router.get(route('auth.logout'));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - hidden on mobile */}
      <div className={`bg-white fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/patient/dashboard" className="flex items-center">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">FarmCare</span>
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
                onClick={() => setActiveTab(item.name.toLowerCase().replace(" ", "-"))}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="mt-auto">
            <Link
              href="/service/clinical-schedule"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Calendar size={18} />
              Clinical Schedule
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={18} />
              Logout
            </button>
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
                          className={`p-4 ${notification.read ? "" : "bg-blue-50"}`}
                        >
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
                <DropdownMenuItem asChild>
                  <Link href="/patient/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patient/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/auth/logout">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
            <p className="mt-1 text-gray-600">Here's an overview of your health information</p>
          </div>

          {/* Quick Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                    <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <CalendarIcon size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                    <p className="text-3xl font-bold text-gray-900">{appointmentsTodayCount}</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    <Clock size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lab Results</p>
                    <p className="text-3xl font-bold text-gray-900">{labResults.length}</p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                    <Microscope size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Medical Records</p>
                    <p className="text-3xl font-bold text-gray-900">{medicalRecords.length}</p>
                  </div>
                  <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                    <FileText size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Appointments Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>Book or view your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-1">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="mx-auto"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-500">
                  {appointmentsTodayCount > 0
                    ? `You have ${appointmentsTodayCount} appointment${appointmentsTodayCount > 1 ? 's' : ''} today`
                    : 'No appointments today'}
                </p>
                <Button asChild size="sm">
                  <Link href="/patient/appointments/book">Book Appointment</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center">
                        <div className="mb-2 mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:mb-0">
                          {appointment.record_type === 'medical_checkup' ? <Stethoscope size={20} /> : <Microscope size={20} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {appointment.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.assignedDoctor
                              ? `Dr. ${appointment.assignedDoctor.name}`
                              : 'Doctor not assigned yet'}
                          </p>
                        </div>
                        <div className="mt-2 text-right sm:mt-0">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <Badge className={
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                    <p>No upcoming appointments. Book one now!</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/patient/appointments">View All Appointments</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Available Doctors */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Available Doctors</CardTitle>
                <CardDescription>Our specialists ready to help you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="flex overflow-hidden rounded-lg border">
                      <div className="w-1/3">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="w-2/3 p-4">
                        <h3 className="font-medium">{doctor.name}</h3>
                        <p className="text-sm text-blue-600">{doctor.specialty}</p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Available on:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {doctor.availability.map(day => (
                              <span key={day} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/patient/doctors">View All Doctors</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Lab Results */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Lab Results</CardTitle>
                <CardDescription>Your latest laboratory test results</CardDescription>
              </CardHeader>
              <CardContent>
                {labResults.length > 0 ? (
                  <div className="divide-y">
                    {labResults.slice(0, 2).map((result) => (
                      <div key={result.id} className="py-3">
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-900">Laboratory Test</p>
                          <p className="text-xs text-gray-500">
                            {new Date(result.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 max-h-24 overflow-hidden">
                          {Object.entries(result.lab_results).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1">
                              <span className="text-xs text-gray-700">{key}:</span>
                              <span className="text-xs font-medium text-gray-900">{String(value)}</span>
                            </div>
                          ))}
                          {Object.keys(result.lab_results).length > 3 && (
                            <p className="mt-1 text-xs text-blue-600">+ more results</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                    <p>No laboratory results available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/patient/records/lab-results">View All Results</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/patient/appointments/book" className="space-y-2">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  <span>Book Medical Checkup</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/patient/appointments/book-lab" className="space-y-2">
                  <Microscope className="h-6 w-6 text-purple-600" />
                  <span>Book Laboratory Test</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/service/clinical-schedule" className="space-y-2">
                  <Clock className="h-6 w-6 text-green-600" />
                  <span>View Clinical Schedule</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/patient/doctors" className="space-y-2">
                  <Stethoscope className="h-6 w-6 text-amber-600" />
                  <span>Find a Doctor</span>
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
