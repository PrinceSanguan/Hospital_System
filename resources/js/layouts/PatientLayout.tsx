import React, { ReactNode, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  Calendar,
  FileText,
  Settings,
  LogOut,
  X,
  Microscope,
  Stethoscope,
  ChevronDown,
  User,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PatientLayoutProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function PatientLayout({ children, user }: PatientLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url } = usePage(); // Get the current route

  // Function to check if the route matches
  const isActive = (path: string) => {
    if (typeof url === 'string') {
      return url.startsWith(path);
    }
    return false;
  };

  const navItems = [
    { name: 'Dashboard', href: route('patient.dashboard'), icon: <Home className="w-5 h-5" />, path: '/patient/dashboard' },
    { name: 'Book Appointment', href: route('patient.appointments.book'), icon: <Calendar className="w-5 h-5" />, path: '/patient/appointments/book' },
    { name: 'My Appointments', href: route('patient.appointments.index'), icon: <Calendar className="w-5 h-5" />, path: '/patient/appointments' },
    { name: 'Medical Records', href: route('patient.records.index'), icon: <FileText className="w-5 h-5" />, path: '/patient/records' },
    { name: 'Lab Results', href: route('patient.records.lab-results'), icon: <Microscope className="w-5 h-5" />, path: '/patient/records/lab-results' },
    { name: 'Doctors', href: route('patient.doctors.index'), icon: <Stethoscope className="w-5 h-5" />, path: '/patient/doctors' },
    { name: 'Profile Settings', href: route('patient.profile.edit'), icon: <Settings className="w-5 h-5" />, path: '/patient/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white print:min-h-0">
      {/* Top Header */}
      <header className="flex h-16 items-center border-b bg-white px-4 md:px-6 dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-10 print:hidden">
        <Button variant="outline" size="icon" className="mr-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center">
            <Link href={route('patient.dashboard')} className="font-semibold text-lg md:text-xl flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600 mr-2">
                <path d="M11 2v2"></path>
                <path d="M5 2v2"></path>
                <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"></path>
                <path d="M8 15a6 6 0 0 0 12 0v-3"></path>
                <circle cx="20" cy="10" r="2"></circle>
              </svg>
              Famcare
            </Link>
          </div>
          <div className="ml-auto flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline-flex">{user.name}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                    <span className="mt-1 text-xs font-normal text-blue-600">
                      Patient
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={route('patient.profile.edit')} className="w-full">
                  <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                    <User size={16} />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link href={route('patient.profile.edit')} className="w-full">
                  <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                    <Settings size={16} />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={route('auth.logout')} method="post" className="flex w-full cursor-pointer">
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div className={`fixed inset-0 z-40 bg-gray-800 bg-opacity-75 transition-opacity md:hidden print:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-y-0 left-0 flex flex-col w-full max-w-xs bg-white dark:bg-gray-800 shadow-xl">
          <div className="flex items-center justify-between px-4 h-16 border-b">
            <Link href={route('patient.dashboard')}>
              <span className="text-xl font-bold text-blue-600">Famcare</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1 pt-2">
            <nav className="px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 text-base font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="pt-4 pb-3 border-t border-gray-200 mt-4">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <Link
                  href={route('auth.logout')}
                  method="post"
                  as="button"
                  className="flex items-center w-full px-3 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex print:block">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white shadow print:hidden h-screen sticky top-16">
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto print:overflow-visible print:w-full">
          {/* Welcome header - shown on all patient pages */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
              <p className="text-sm text-gray-600">Here's an overview of your health information</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 print:p-0 print:m-0 print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
