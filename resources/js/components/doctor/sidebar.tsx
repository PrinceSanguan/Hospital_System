import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    Grid,
    User,
    File,
    CalendarDays,
    History
} from 'lucide-react';

interface DoctorUser {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface SidebarProps {
    user: DoctorUser;
    unreadNotifications?: number;
}

export function Sidebar({ user, unreadNotifications = 0 }: SidebarProps) {
    const { url } = usePage(); // Get the current route

    // Simple check if the current route is active
    const isActive = (path: string) => {
        return url.startsWith(path);
    };

    // Get page props to check if routes exist
    const pageData = usePage();
    const props = pageData.props as Record<string, unknown>;

    // Safe access to routes with proper type checking
    const ziggy = props?.ziggy as { routes?: Record<string, unknown> } | undefined;
    const routes = ziggy?.routes || {};

    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    // Define navigation items
    const navigationItems = [
        {
            name: 'Dashboard',
            route: 'doctor.dashboard',
            path: '/doctor/dashboard',
            icon: <Grid size={18} />
        },
        {
            name: 'Patients',
            route: 'doctor.patients.index',
            path: '/doctor/patients',
            icon: <User size={18} />
        },
        {
            name: 'Appointments',
            route: 'doctor.appointments.index',
            path: '/doctor/appointments',
            icon: <CalendarDays size={18} />
        },
        {
            name: 'Consultation History',
            route: 'doctor.consultation.history',
            path: '/doctor/consultation-history',
            icon: <History size={18} />
        },
        {
            name: 'Medical Records',
            route: 'doctor.clinical.info',
            path: '/doctor/clinical-info',
            icon: <File size={18} />
        },
    ];

    return (
        <div className="hidden w-64 flex-col border-r bg-white md:flex dark:border-gray-700 dark:bg-gray-900">
            {/* Header with logo */}
            <div className="flex h-16 items-center border-b px-4 dark:border-gray-700">
                <Link href={route('doctor.dashboard')} className="flex items-center gap-2">
                    <img
                      src="/images/logo_famcare.jpg"
                      alt="Famcare Logo"
                      className="h-6 w-auto"
                    />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Doctor Portal</h2>
                </Link>
            </div>

            {/* User Info */}
            <div className="px-4 py-3 border-b dark:border-gray-700">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Dr. {user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start gap-2 px-3 text-sm font-medium">
                    {navigationItems.map((item) => (
                        <Button
                            key={item.name}
                            asChild
                            variant={isActive(item.path) ? 'secondary' : 'ghost'}
                            className="flex w-full items-center justify-start gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            disabled={!routeExists(item.route)}
                        >
                            <Link
                                href={routeExists(item.route) ? route(item.route) : '#'}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                                {item.name === 'Appointments' && unreadNotifications > 0 && (
                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                    </span>
                                )}
                            </Link>
                        </Button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
