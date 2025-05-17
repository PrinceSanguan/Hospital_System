import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Calendar,
  Bell,
  Home,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  LogOut,
  Search,
  Menu,
  ChevronDown
} from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface DoctorsProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  doctors: Array<{
    id: number;
    name: string;
    specialty: string;
    availability: string[];
    profile_image: string | null;
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
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    related_id?: number;
    related_type?: string;
  }>;
}

export default function Doctors({
  user,
  doctors = [],
  notifications = []
}: DoctorsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate unread notifications
  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      doctor.name.toLowerCase().includes(searchTermLower) ||
      doctor.specialty.toLowerCase().includes(searchTermLower)
    );
  });

  // Sort doctors by specialty if activeTab is a specialty
  const displayedDoctors = activeTab === 'all'
    ? filteredDoctors
    : filteredDoctors.filter(doctor =>
        doctor.specialty.toLowerCase() === activeTab.toLowerCase()
      );

  // Get unique specialties for tabs
  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))];

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
      active: false
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
      active: true
    }
  ];

  // Handle logout functionality
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    router.post('/logout');
  };

  // Navigate to book appointment with selected doctor
  const handleBookAppointment = (doctor_id: number) => {
    router.visit(`/patient/appointments/book?doctor_id=${doctor_id}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Head title="Available Doctors" />

      {/* Sidebar - hidden on mobile */}
      <div className={`bg-white fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/patient/dashboard" className="flex items-center">
            <img
              src="/images/logo_famcare.jpg"
              alt="Famcare Logo"
              className="h-6 w-auto mr-2"
            />
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
                placeholder="Search doctors by name or specialty..."
                className="w-full md:w-[280px] lg:w-[380px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            <h1 className="text-3xl font-bold text-gray-900">Available Doctors</h1>
            <p className="mt-1 text-gray-600">Browse our specialists and their availability</p>
          </div>

          {/* Specialty Tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="mb-4 flex flex-nowrap overflow-auto">
              <TabsTrigger value="all">All Specialties</TabsTrigger>
              {specialties.map(specialty => (
                <TabsTrigger key={specialty} value={specialty.toLowerCase()}>
                  {specialty}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Doctors Grid */}
          {displayedDoctors.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedDoctors.map((doctor) => (
                <Card key={doctor.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-r from-blue-100 to-blue-50">
                    <div className="absolute bottom-0 left-0 right-0 flex items-end p-4">
                      <Avatar className="h-20 w-20 border-4 border-white">
                        <AvatarImage src={doctor.profile_image || ""} alt={doctor.name} />
                        <AvatarFallback className="text-lg">{doctor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 pb-1">
                        <h3 className="font-bold text-lg">{doctor.name}</h3>
                        <p className="text-sm font-medium text-blue-600">{doctor.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Simplified Available Days */}
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Available:</span>
                      <div className="flex flex-wrap gap-1 ml-2">
                        {doctor.schedules?.map(schedule =>
                          schedule.is_available && (
                            <Badge key={schedule.id} variant="outline" className="text-xs py-0 px-1 bg-blue-50">
                              {getDayName(schedule.day_of_week).substring(0, 3)}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    {/* Condensed Schedule Section */}
                    <details className="text-xs">
                      <summary className="flex items-center justify-between text-sm py-1 cursor-pointer border-t border-gray-100 pt-2">
                        <span className="font-medium">Hours</span>
                        <ChevronDown className="h-3 w-3" />
                      </summary>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                        {doctor.schedules?.map(schedule => schedule.is_available && (
                          <div key={schedule.id} className="flex justify-between text-xs py-0">
                            <span>{getDayName(schedule.day_of_week).substring(0, 3)}:</span>
                            <span className="text-gray-600">
                              {formatTime(schedule.start_time)}-{formatTime(schedule.end_time)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Services Section */}
                    {doctor.services && doctor.services.length > 0 && (
                      <details className="mt-2">
                        <summary className="flex items-center justify-between text-sm py-1 cursor-pointer border-t border-gray-100 pt-2">
                          <span className="font-medium">Services</span>
                          <ChevronDown className="h-3 w-3" />
                        </summary>
                        <div className="grid gap-2 mt-1">
                          {doctor.services.map(service => (
                            <div key={service.id} className="text-xs py-1 border-b border-gray-100">
                              <div className="font-medium">{service.name}</div>
                              <div className="text-xs text-gray-600">{service.description}</div>
                              <div className="mt-1 flex justify-between">
                                <span>{service.duration_minutes} mins</span>
                                <span className="font-medium">${service.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleBookAppointment(doctor.id)}
                    >
                      Book Appointment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Stethoscope className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search or filters' : 'No doctors are available at the moment'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
