import React, { useState } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  Bell,
  Home,
  FileText,
  Menu,
  LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  availability: string[];
  image?: string;
}

interface BookAppointmentProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  doctors: Doctor[];
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

export default function BookAppointment({ user, doctors, notifications = [] }: BookAppointmentProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([
    '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
  });

  // Calculate unread notifications
  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;

  // Handle date change
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setData('appointment_date', format(newDate, 'yyyy-MM-dd'));

      // Reset time slot when date changes
      setSelectedTimeSlot(null);
      setData('appointment_time', '');

      // In a real app, you would fetch available time slots for this doctor and date
      // For now, we'll use dummy data
      setAvailableTimeSlots([
        '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
      ]);
    }
  };

  // Handle doctor selection
  const handleDoctorSelect = (doctorId: string) => {
    setData('doctor_id', doctorId);
    const doctor = doctors.find(d => d.id.toString() === doctorId) || null;
    setSelectedDoctor(doctor);

    // Reset date and time when doctor changes
    setDate(undefined);
    setSelectedTimeSlot(null);
    setData('appointment_date', '');
    setData('appointment_time', '');
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setData('appointment_time', timeSlot);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('patient.appointments.store'), {
      onSuccess: () => {
        reset();
        setDate(undefined);
        setSelectedTimeSlot(null);
        setSelectedDoctor(null);
      },
    });
  };

  // Sidebar items
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
      active: true
    },
    {
      name: "My Appointments",
      icon: <Clock size={18} />,
      path: "/patient/appointments",
      active: false
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
    router.post('/logout');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Head title="Book Appointment" />

      {/* Sidebar - hidden on mobile */}
      <div className={`bg-white fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/patient/dashboard" className="flex items-center">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Choros Health</span>
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

          <Separator className="my-4" />

          <div className="mt-auto">
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
                <DropdownMenuItem asChild>
                  <Link href="/patient/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patient/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.post('/logout');
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
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="mt-1 text-gray-600">Schedule a visit with one of our specialists</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Doctor Selection */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Select Doctor</CardTitle>
                  <CardDescription>Choose a specialist for your appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDoctor?.id === doctor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleDoctorSelect(doctor.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {doctor.image ? (
                            <img
                              src={doctor.image}
                              alt={doctor.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <Stethoscope className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-500">{doctor.specialty}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.doctor_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.doctor_id}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Appointment Details */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                  <CardDescription>Select a date and time for your appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !date && 'text-gray-400'
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP') : 'Select a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            initialFocus
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                              date.getDay() === 0 || // Disable Sundays
                              date.getDay() === 6    // Disable Saturdays
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.appointment_date && (
                        <p className="text-sm text-red-500">{errors.appointment_date}</p>
                      )}
                    </div>

                    {/* Time Slots */}
                    {date && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Time Slot
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {availableTimeSlots.map((timeSlot) => (
                            <Button
                              key={timeSlot}
                              type="button"
                              variant={selectedTimeSlot === timeSlot ? 'default' : 'outline'}
                              className="flex items-center justify-center"
                              onClick={() => handleTimeSlotSelect(timeSlot)}
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              {timeSlot}
                            </Button>
                          ))}
                        </div>
                        {errors.appointment_time && (
                          <p className="text-sm text-red-500">{errors.appointment_time}</p>
                        )}
                      </div>
                    )}

                    {/* Reason for Visit */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Reason for Visit
                      </label>
                      <Select
                        value={data.reason}
                        onValueChange={(value) => setData('reason', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">General Consultation</SelectItem>
                          <SelectItem value="checkup">Regular Checkup</SelectItem>
                          <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                          <SelectItem value="specialist">Specialist Consultation</SelectItem>
                          <SelectItem value="emergency">Urgent Care</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.reason && (
                        <p className="text-sm text-red-500">{errors.reason}</p>
                      )}
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Additional Notes
                      </label>
                      <Textarea
                        placeholder="Please share any symptoms or concerns"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={processing || !date || !selectedTimeSlot || !data.doctor_id || !data.reason}
                    >
                      Book Appointment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
