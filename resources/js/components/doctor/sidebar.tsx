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
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    Settings,
    ChevronDown,
    LogOut,
    Stethoscope,
    Clock,
    ClipboardCheck,
    Search
} from 'lucide-react';

interface User {
    name: string;
    email: string;
    role?: string;
}

interface SidebarProps {
    user: User;
}

interface ZiggyRoutes {
    [key: string]: unknown;
}

interface PageProps {
    ziggy: {
        routes: ZiggyRoutes;
    };
}

export function Sidebar({ user }: SidebarProps) {
    const { url } = usePage(); // Get the current route

    // Function to check if the route matches
    const isActive = (path: string) => url.startsWith(path);

    // Helper function to check if routes exist
    const { props } = usePage();
    const routes = (props as any)?.ziggy?.routes || {};

    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    // Define navigation items
    const navigationItems = [
        {
            name: 'Dashboard',
            route: 'doctor.dashboard',
            icon: <LayoutDashboard size={18} />,
            path: '/doctor/dashboard'
        },
        {
            name: 'My Patients',
            route: 'doctor.patients.index',
            icon: <Users size={18} />,
            path: '/doctor/patients'
        },
        {
            name: 'Appointments',
            route: 'doctor.appointments.index',
            icon: <Calendar size={18} />,
            path: '/doctor/appointments'
        },
        {
            name: 'Calendar',
            route: 'doctor.appointments.calendar',
            icon: <Clock size={18} />,
            path: '/doctor/appointments/calendar'
        },
        {
            name: 'Medical Records',
            route: 'doctor.records.index',
            icon: <FileText size={18} />,
            path: '/doctor/records'
        },
        {
            name: 'Create Record',
            route: 'doctor.records.create',
            icon: <ClipboardCheck size={18} />,
            path: '/doctor/records/create'
        },
        {
            name: 'Patient Search',
            route: 'doctor.patients.search',
            icon: <Search size={18} />,
            path: '/doctor/patients/search'
        },
        {
            name: 'My Profile',
            route: 'doctor.profile',
            icon: <Settings size={18} />,
            path: '/doctor/profile'
        }
    ];

    return (
        <div className="hidden w-64 flex-col border-r bg-white md:flex dark:border-gray-700 dark:bg-gray-900">
            {/* Header with logo */}
            <div className="flex h-16 items-center border-b px-4 dark:border-gray-700">
                <Link href={route('doctor.dashboard')} className="flex items-center gap-2">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Doctor Portal</h2>
                </Link>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start gap-2 px-3 text-sm font-medium">
                    {navigationItems.map((item) => (
                        <Link
                            href={routeExists(item.route) ? route(item.route) : '#'}
                            key={item.name}
                            className="w-full"
                        >
                            <Button
                                variant={isActive(item.path) ? 'secondary' : 'ghost'}
                                className="flex w-full items-center justify-start gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                disabled={!routeExists(item.route)}
                            >
                                {item.icon}
                                {item.name}
                            </Button>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Profile Section */}
            <div className="border-t p-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src="/api/placeholder/32/32" alt={user.name} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dr. {user.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Physician</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                                <ChevronDown size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={routeExists('doctor.profile') ? route('doctor.profile') : '#'} className="w-full">
                                <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                                    <Settings size={16} />
                                    Profile Settings
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('auth.logout')} className="flex w-full cursor-pointer items-center gap-2">
                                    <LogOut size={16} />
                                    Logout
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
