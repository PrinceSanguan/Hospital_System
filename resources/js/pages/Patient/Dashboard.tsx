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
  Menu,
  UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    profile_image?: string;
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

// Helper function to format day of week number to name
const formatDayOfWeek = (dayNumber: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
};

export default function PatientDashboard({
  user,
  upcomingAppointments = [],
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
  const [notificationsState, setNotificationsState] = useState(notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotificationsCount = notificationsState.filter(notification => !notification.read).length;

  // Calculate appointments for today
  const appointmentsTodayCount = upcomingAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointment_date);
    const today = new Date();
    return appointmentDate.getDate() === today.getDate() &&
           appointmentDate.getMonth() === today.getMonth() &&
           appointmentDate.getFullYear() === today.getFullYear();
  }).length;

  const sidebarItems = [
    {
      name: "Dashboard",
      icon: <Home size={18} />,
      path: "/patient/dashboard",
      active: activeTab === "dashboard"
    },
    {
      name: "Book Appointment",
      icon: <Calendar size={18} />,
      path: "/patient/appointments/book",
      active: activeTab === "book-appointment"
    },
    {
      name: "My Appointments",
      icon: <Calendar size={18} />,
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
      name: "Lab Results",
      icon: <Microscope size={18} />,
      path: "/patient/records/lab-results",
      active: activeTab === "lab-results"
    },
    {
      name: "Doctors",
      icon: <Stethoscope size={18} />,
      path: "/patient/doctors",
      active: activeTab === "doctors"
    }
  ];

  // Handle logout functionality
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    router.post(route('auth.logout'));
  };

  // Handle doctor selection for booking
  const handleDoctorSelect = (doctor: typeof doctors[0]) => {
    // Instead of opening a dialog, navigate directly to the appointment booking page
    router.visit(`/patient/appointments/book?doctor_id=${doctor.id}`);
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
            <img
              src="/images/logo_famcare.jpg"
              alt="Famcare Logo"
              className="h-8 w-auto mr-2"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">Famcare</span>
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
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                // Mark notifications as read in local state only
                setNotificationsState(prev => prev.map(n => ({ ...n, read: true })));
                // Toggle visibility of notifications panel
                setShowNotifications(!showNotifications);
              }}
            >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <Badge
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-12 top-16 w-80 bg-white rounded-md shadow-lg z-50 border">
                <div className="border-b p-4 flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                  {notificationsState.filter(n => !n.read).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        setNotificationsState(prev => prev.map(n => ({ ...n, read: true })));
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-auto">
                  {notificationsState.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notificationsState.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 ${notification.read ? "" : "bg-blue-50"} cursor-pointer`}
                          onClick={() => {
                            // Mark as read in local state
                            setNotificationsState(prev =>
                              prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                            );

                            // Use direct navigation to avoid framework errors
                            try {
                            if (notification.related_id) {
                              if (notification.related_type === 'appointment') {
                                  window.location.href = `/patient/appointments/${notification.related_id}`;
                              } else if (notification.related_type === 'record') {
                                  window.location.href = `/patient/records/${notification.related_id}`;
                              }
                              }
                            } catch (e) {
                              console.error('Navigation error:', e);
                            }
                          }}
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
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowNotifications(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}

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

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="#" onClick={handleLogout}>Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
              <p className="mt-1 text-gray-600">Here's an overview of your health</p>
            </div>
          </div>

          {/* Today's Overview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                    <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {upcomingAppointments.length > 0 ? "View schedule" : "No appointments"}
                      </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <CalendarIcon size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

              <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                    <p className="text-3xl font-bold text-gray-900">{appointmentsTodayCount}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {appointmentsTodayCount > 0
                          ? `${appointmentsTodayCount} appointment${appointmentsTodayCount > 1 ? 's' : ''} today`
                          : 'Your schedule is clear'}
                      </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    <Clock size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

              <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Medical Records</p>
                    <p className="text-3xl font-bold text-gray-900">{medicalRecords.length}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {medicalRecords.length > 0 ? "View your history" : "No records yet"}
                      </p>
                  </div>
                  <div className="rounded-full bg-amber-100 p-3 text-amber-600">
                    <FileText size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
                </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Upcoming Appointments */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-blue-600">
                  <Link href={route('patient.appointments.index')}>View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="flex flex-col rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow sm:flex-row sm:items-center">
                        <div className="mb-2 mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:mb-0">
                          {appointment.record_type === 'medical_checkup' ? <Stethoscope size={20} /> : <Microscope size={20} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {appointment.record_type === 'medical_checkup' ? 'Medical Checkup' : 'Laboratory Test'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.assignedDoctor && appointment.assignedDoctor.name
                              ? `Dr. ${appointment.assignedDoctor.name}`
                              : 'Pending doctor assignment'}
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
                  <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-gray-500">
                    <p className="mb-4">No upcoming appointments.</p>
                    <Button asChild size="sm">
                      <Link href="/patient/appointments/book">Book Now</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointments Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>Your schedule</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <Calendar size={16} />
                </Button>
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
                {selectedDate && appointmentsTodayCount > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm font-medium text-blue-600">
                      {appointmentsTodayCount} appointment{appointmentsTodayCount > 1 ? 's' : ''} today
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Doctors */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                <CardTitle>Available Doctors</CardTitle>
                <CardDescription>Our specialists ready to help you</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-blue-600">
                  <Link href="/patient/doctors">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {doctors.slice(0, 3).map((doctor) => (
                    <div key={doctor.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="p-4 bg-blue-50 flex items-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-blue-100 mr-3">
                          <img
                            src={doctor.profile_image || `/images/doctor/${doctor.name.split(' ')[0]}.png` || doctor.image || "https://ui.shadcn.com/avatars/01.png"}
                            alt={doctor.name}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://ui.shadcn.com/avatars/01.png";
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm font-medium text-blue-600">{doctor.specialty || "General Practitioner"}</p>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-3">
                          <div className="flex items-center mb-1">
                            <img
                              src="/images/logo_famcare.jpg"
                              alt="Famcare Logo"
                              className="h-5 w-auto mr-2"
                            />
                            <span className="text-sm font-medium">Available:</span>
                          </div>
                          {doctor.availability && doctor.availability.length > 0 ? (
                            <div className="ml-6 text-sm text-gray-600">
                              {doctor.availability.map((day, idx) => (
                                <span key={`${doctor.id}-${idx}`} className="mr-2">
                                  {day}{idx < doctor.availability.length - 1 ? ',' : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="ml-6 text-sm text-gray-600"></div>
                          )}
                        </div>

                        <details className="mb-3 border-t pt-2">
                          <summary className="font-medium text-sm cursor-pointer">Hours</summary>
                          <div className="mt-2 pl-2 text-xs space-y-1">
                            {doctor.schedules && doctor.schedules.length > 0 ? (
                              doctor.schedules.map(schedule => (
                                <div key={schedule.id} className="flex justify-between">
                                  <span>{formatDayOfWeek(schedule.day_of_week)}:</span>
                                  <span>{schedule.is_available ?
                                    `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}` :
                                    'Not available'}</span>
                                </div>
                              ))
                            ) : (
                              <div>No schedule information available</div>
                            )}
                          </div>
                        </details>

                        <Button
                          variant="default"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleDoctorSelect(doctor)}
                        >
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
