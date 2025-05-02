import React, { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { User, Calendar, ClipboardList, Settings, LogOut } from 'lucide-react';

type PatientLayoutProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function PatientLayout({ children, user }: PatientLayoutProps) {
  const navItems = [
    { name: 'Dashboard', href: route('patient.dashboard'), icon: <User className="w-5 h-5" /> },
    { name: 'Book Appointment', href: route('patient.appointments.create'), icon: <Calendar className="w-5 h-5" /> },
    { name: 'My Appointments', href: route('patient.appointments.index'), icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Profile Settings', href: route('patient.profile.edit'), icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href={route('patient.dashboard')}>
                  <span className="text-xl font-bold text-blue-600">Choros Health</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-700">Welcome, {user.name}</span>
                  <Link href={route('logout')} method="post" as="button" className="text-red-500 hover:text-red-700">
                    <LogOut className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow h-screen sticky top-0 pt-4">
          <div className="px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  route().current(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
