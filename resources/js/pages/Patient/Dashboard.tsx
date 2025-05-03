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
  Menu,
  UserIcon
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Calendar component imports
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, isToday, isBefore, addDays } from "date-fns";

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
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    related_id?: number;
    related_type?: string;
  }>;
  doctors: Array<{
    id: number;
    name: string;
    specialty: string;
    availability: string[];
    image: string;
    schedules?: Array<{
      id: number;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_available: boolean;
      max_appointments: number;
    }>;
    services?: Array<{
      id: number;
      name: string;
      description: string;
      duration_minutes: number;
      price: number;
    }>;
  }>;
}

// Helper function to get day name
const getDayName = (dayNumber: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
};

// Helper function to format time
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function PatientDashboard({
  user,
  upcomingAppointments = [],
  labResults = [],
  medicalRecords = [],
  notifications = [
    { id: 1, title: "Appointment Confirmation", message: "Your appointment has been confirmed for tomorrow at 10:00 AM", read: false, created_at: "2023-05-01T10:00:00.000Z" },
    { id: 2, title: "Prescription Update", message: "Dr. Johnson has updated your prescription", read: false, created_at: "2023-05-01T08:30:00.000Z" },
    { id: 3, title: "Lab Results Available", message: "Your lab results are now available", read: true, created_at: "2023-04-30T15:20:00.000Z" }
  ],
  doctors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      availability: ["Monday", "Wednesday", "Friday"],
      schedules: [
        { id: 1, day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true, max_appointments: 8 },
        { id: 2, day_of_week: 3, start_time: "09:00", end_time: "17:00", is_available: true, max_appointments: 8 },
        { id: 3, day_of_week: 5, start_time: "09:00", end_time: "14:00", is_available: true, max_appointments: 5 }
      ]
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      specialty: "Neurologist",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
      availability: ["Tuesday", "Thursday", "Saturday"],
      schedules: [
        { id: 4, day_of_week: 2, start_time: "10:00", end_time: "18:00", is_available: true, max_appointments: 8 },
        { id: 5, day_of_week: 4, start_time: "10:00", end_time: "18:00", is_available: true, max_appointments: 8 },
        { id: 6, day_of_week: 6, start_time: "10:00", end_time: "14:00", is_available: true, max_appointments: 4 }
      ]
    }
  ]
}: PatientDashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bookingDoctor, setBookingDoctor] = useState<typeof doctors[0] | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingTime, setBookingTime] = useState<string>('');
  const [bookingReason, setBookingReason] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingService, setBookingService] = useState<string>('');
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

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

  // Handle doctor selection for booking
  const handleDoctorSelect = (doctor: typeof doctors[0]) => {
    setBookingDoctor(doctor);
    setBookingDate(null);
    setBookingTime('');
    setIsBookingDialogOpen(true);
  };

  // Generate available time slots based on doctor's schedule
  const generateTimeSlots = (date: Date, doctorSchedules: typeof doctors[0]['schedules']) => {
    const dayOfWeek = date.getDay();
    const schedule = doctorSchedules?.find(s => s.day_of_week === dayOfWeek && s.is_available);

    if (!schedule) {
      setAvailableTimeSlots([]);
      return [];
    }

    const { start_time, end_time } = schedule;
    const [startHour, startMinute] = start_time.split(':').map(Number);
    const [endHour, endMinute] = end_time.split(':').map(Number);

    const slots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    // Generate hourly slots
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const formattedHour = currentHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);

      // Move to next hour
      currentMinute += 60;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    setAvailableTimeSlots(slots);
    return slots;
  };

  // Handle date selection for booking
  const handleDateSelect = (date: Date) => {
    setBookingDate(date);
    if (bookingDoctor?.schedules) {
      generateTimeSlots(date, bookingDoctor.schedules);
    }
  };

  // Handle submit booking
  const handleSubmitBooking = () => {
    if (!bookingDoctor || !bookingDate || !bookingTime || !bookingReason) {
      // Display validation error
      return;
    }

    // Format the date for the API
    const formattedDate = format(bookingDate, 'yyyy-MM-dd');

    // Submit the booking
    router.post(route('patient.appointments.store'), {
      doctor_id: bookingDoctor.id,
      appointment_date: formattedDate,
      appointment_time: bookingTime,
      reason: bookingReason,
      notes: bookingNotes,
      service_id: bookingService,
    }, {
      onSuccess: () => {
        setIsBookingDialogOpen(false);
        setBookingDoctor(null);
        setBookingDate(null);
        setBookingTime('');
        setBookingReason('');
        setBookingNotes('');
        setBookingService('');
      }
    });
  };

  // Check if date is available based on doctor's schedule
  const isDateAvailable = (date: Date, doctorSchedules: typeof doctors[0]['schedules']) => {
    if (isBefore(date, new Date()) && !isToday(date)) {
      return false;
    }

    const dayOfWeek = date.getDay();
    return doctorSchedules?.some(s => s.day_of_week === dayOfWeek && s.is_available) || false;
  };

  // Generate disabled dates for the calendar
  const getDisabledDates = (doctorSchedules: typeof doctors[0]['schedules']) => {
    const disabledDates = [];
    const startDate = new Date();
    const endDate = addDays(startDate, 30); // Check next 30 days

    let currentDate = startDate;
    while (currentDate <= endDate) {
      if (!isDateAvailable(currentDate, doctorSchedules)) {
        disabledDates.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }

    return disabledDates;
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
                          className={`p-4 ${notification.read ? "" : "bg-blue-50"} cursor-pointer`}
                          onClick={() => {
                            // Mark as read when clicked
                            if (!notification.read) {
                              router.put(route('patient.notifications.mark.read', notification.id), {}, {
                                preserveScroll: true,
                                only: ['notifications']
                              });
                            }

                            // Navigate to related content if available
                            if (notification.related_id) {
                              if (notification.related_type === 'appointment') {
                                router.visit(route('patient.appointments.show', notification.related_id));
                              } else if (notification.related_type === 'record') {
                                router.visit(route('patient.records.show', notification.related_id));
                              }
                            }
                          }}
                        >
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-sm">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {notification.related_id && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs py-0 h-6 mt-1"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering parent onClick
                                  if (notification.related_type === 'appointment') {
                                    router.visit(route('patient.appointments.show', notification.related_id));
                                  } else if (notification.related_type === 'record') {
                                    router.visit(route('patient.records.show', notification.related_id));
                                  }
                                }}
                              >
                                {notification.related_type === 'appointment' ? 'View Appointment' :
                                 notification.related_type === 'record' ? 'View Record' : 'View Details'}
                              </Button>
                            </div>
                          )}
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
                    modifiers={{
                      booked: upcomingAppointments.map(apt => new Date(apt.appointment_date)),
                      confirmed: upcomingAppointments.filter(apt => apt.status.toLowerCase() === 'confirmed').map(apt => new Date(apt.appointment_date)),
                      pending: upcomingAppointments.filter(apt => apt.status.toLowerCase() === 'pending').map(apt => new Date(apt.appointment_date))
                    }}
                    modifiersStyles={{
                      booked: {
                        backgroundColor: '#e0edff',
                        color: '#1a56db',
                        fontWeight: 'bold'
                      },
                      confirmed: {
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontWeight: 'bold'
                      },
                      pending: {
                        backgroundColor: '#fef9c3',
                        color: '#854d0e',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </div>
                {selectedDate && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Appointments on {selectedDate.toLocaleDateString()}</h4>
                    {upcomingAppointments
                      .filter(apt => new Date(apt.appointment_date).toDateString() === selectedDate.toDateString())
                      .map(apt => (
                        <div key={apt.id} className="p-2 border rounded-md mb-2 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(apt.appointment_date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {apt.assignedDoctor ? `Dr. ${apt.assignedDoctor.name}` : 'Unassigned'}
                            </p>
                          </div>
                          <Badge
                            className={
                              apt.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                              apt.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                              apt.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    {!upcomingAppointments.some(apt =>
                      new Date(apt.appointment_date).toDateString() === selectedDate.toDateString()
                    ) && (
                      <p className="text-sm text-gray-500">No appointments on this date</p>
                    )}
                  </div>
                )}
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
                            appointment.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                            appointment.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
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
                    <div key={doctor.id} className="flex flex-col overflow-hidden rounded-lg border">
                      <div className="flex overflow-hidden">
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
                              {doctor.schedules?.map(schedule => (
                                <Badge key={schedule.id} variant="outline" className="text-xs">
                                  {getDayName(schedule.day_of_week)}: {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </Badge>
                            ))}
                            </div>
                          </div>
                          {doctor.services && doctor.services.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Services:</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {doctor.services.map(service => (
                                  <Badge key={service.id} className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                    {service.name}
                                  </Badge>
                                ))}
                              </div>
                              <div className="mt-1">
                                <p className="text-xs text-gray-500">
                                  {doctor.services.length} services available
                                </p>
                              </div>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => handleDoctorSelect(doctor)}
                          >
                            Book Appointment
                          </Button>
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

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b">
            <DialogTitle>Book an Appointment</DialogTitle>
            <DialogDescription>
              {bookingDoctor ? `Schedule an appointment with ${bookingDoctor.name}` : 'Select a doctor to schedule an appointment'}
            </DialogDescription>
          </DialogHeader>

          {bookingDoctor && (
            <div className="space-y-4 py-2">
              {/* Doctor Information */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={bookingDoctor.image} alt={bookingDoctor.name} />
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-sm">{bookingDoctor.name}</h3>
                  <p className="text-xs text-gray-500">{bookingDoctor.specialty}</p>
                </div>
              </div>

              {/* Service Selection */}
              {bookingDoctor.services && bookingDoctor.services.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="service" className="text-sm font-medium">Select Service</label>
                  <Select value={bookingService} onValueChange={setBookingService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingDoctor.services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} ({service.duration_minutes} min) - ${service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookingService && bookingDoctor.services.find(s => s.id.toString() === bookingService)?.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {bookingDoctor.services.find(s => s.id.toString() === bookingService)?.description}
                    </p>
                  )}
                </div>
              )}

              {/* Date Selection */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Date</label>
                <div className="border rounded-md p-2">
                  <DayPicker
                    mode="single"
                    selected={bookingDate || undefined}
                    onSelect={(date) => date && handleDateSelect(date)}
                    disabled={[
                      { before: new Date() },
                      ...getDisabledDates(bookingDoctor.schedules || [])
                    ]}
                    className="mx-auto"
                    classNames={{
                      months: "space-y-2 mx-auto",
                      caption: "flex justify-center relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm relative p-0 data-[isSelected=true]:bg-primary data-[isSelected=true]:text-primary-foreground data-[isSelected=true]:rounded-md focus-within:relative focus-within:z-20",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                      day_selected: "bg-primary text-primary-foreground rounded-md",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </div>

              {/* Time Selection */}
              {bookingDate && availableTimeSlots.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Select Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={bookingTime === time ? "default" : "outline"}
                        size="sm"
                        className="text-xs py-1"
                        onClick={() => setBookingTime(time)}
                      >
                        {formatTime(time)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason for Visit */}
              <div className="space-y-1">
                <label htmlFor="reason" className="text-sm font-medium">Reason for Visit</label>
                <Select value={bookingReason} onValueChange={setBookingReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check_up">General Check-up</SelectItem>
                    <SelectItem value="follow_up">Follow-up Appointment</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1">
                <label htmlFor="notes" className="text-sm font-medium">Additional Notes</label>
                <Textarea
                  id="notes"
                  placeholder="Any specific concerns or information for the doctor"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t mt-4">
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitBooking}
              disabled={!bookingDoctor || !bookingDate || !bookingTime || !bookingReason || (bookingDoctor?.services && bookingDoctor.services.length > 0 && !bookingService)}
            >
              Request Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
