import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePage } from '@inertiajs/react';
import { Bell, Calendar, ChevronDown, FileText, Home, LayoutDashboard, LogOut, Microscope, Stethoscope, X } from 'lucide-react';
import { ReactNode, useState } from 'react';

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
        { name: 'Dashboard', href: route('patient.dashboard'), icon: <Home className="h-5 w-5" />, path: '/patient/dashboard' },
        {
            name: 'Book Appointment',
            href: route('patient.appointments.book'),
            icon: <Calendar className="h-5 w-5" />,
            path: '/patient/appointments/book',
        },
        { name: 'My Appointments', href: route('patient.appointments.index'), icon: <Calendar className="h-5 w-5" />, path: '/patient/appointments' },
        { name: 'Medical Records', href: route('patient.records.index'), icon: <FileText className="h-5 w-5" />, path: '/patient/records' },
        {
            name: 'Lab Results',
            href: route('patient.records.lab-results'),
            icon: <Microscope className="h-5 w-5" />,
            path: '/patient/records/lab-results',
        },
        { name: 'Doctors', href: route('patient.doctors.index'), icon: <Stethoscope className="h-5 w-5" />, path: '/patient/doctors' },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:min-h-0 print:bg-white">
            {/* Top Header */}
            <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 md:px-6 dark:border-gray-700 dark:bg-gray-800 print:hidden">
                <Button variant="outline" size="icon" className="mr-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
                </Button>
                <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center">
                        <Link href={route('patient.dashboard')} className="flex items-center text-lg font-semibold md:text-xl">
                            <img src="/images/logo_famcare.jpg" alt="Famcare Logo" className="mr-2 h-6 w-auto" />
                            Famcare
                        </Link>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {/* Notifications Bell */}
                        <div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell size={20} />
                                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                            0
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-80 p-0" align="end">
                                    <div className="border-b p-4">
                                        <h4 className="text-sm font-semibold">Notifications</h4>
                                    </div>
                                    <div className="max-h-80 overflow-auto">
                                        <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

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
                                        <span className="mt-1 text-xs font-normal text-blue-600">Patient</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={route('auth.logout')}
                                        method="post"
                                        as="button"
                                        className="flex w-full cursor-pointer items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            <div
                className={`bg-opacity-75 fixed inset-0 z-40 bg-gray-800 transition-opacity md:hidden print:hidden ${mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl dark:bg-gray-800">
                    <div className="flex h-16 items-center justify-between border-b px-4">
                        <Link href={route('patient.dashboard')}>
                            <span className="text-xl font-bold text-blue-600">Famcare</span>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto pt-2">
                        <nav className="space-y-1 px-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium ${
                                        isActive(item.path) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-4 border-t border-gray-200 pt-4 pb-3">
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
                                    className="flex w-full items-center rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="mr-2 h-5 w-5" />
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex print:block">
                {/* Sidebar */}
                <aside className="sticky top-16 hidden h-screen w-64 flex-shrink-0 flex-col bg-white shadow md:flex print:hidden">
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <nav className="flex-1 space-y-1 p-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                                        isActive(item.path) ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
                <main className="flex-1 overflow-auto print:w-full print:overflow-visible">
                    {/* Welcome header - shown on all patient pages */}

                    <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8 print:m-0 print:max-w-none print:p-0">{children}</div>
                </main>
            </div>
        </div>
    );
}
