import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    LogOut,
    Stethoscope
} from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface SidebarProps {
    user: User;
}

export function Sidebar({ user }: SidebarProps) {
    const { url } = usePage(); // Get the current route

    // Simple check if the current route is active
    const isActive = (path: string) => {
        return url.startsWith(path);
    };

    // Get page props to check if routes exist
    const pageData = usePage();
    const props = pageData.props as Record<string, unknown>;

    const routes = (props?.ziggy?.routes as Record<string, unknown>) || {};

    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    // Define navigation items
    const navigationItems = [
        {
            name: 'Dashboard',
            route: 'staff.dashboard',
            icon: <LayoutDashboard size={18} />
        },
        {
            name: 'Appointments',
            route: 'staff.appointments',
            icon: <Calendar size={18} />
        },
        {
            name: 'Medical Records',
            route: 'staff.clinical.info',
            icon: <FileText size={18} />
        }
    ];

    return (
        <div className="hidden w-64 flex-col border-r bg-white md:flex dark:border-gray-700 dark:bg-gray-900">
            {/* Header with logo */}
            <div className="flex h-16 items-center border-b px-4 dark:border-gray-700">
                <Link href={route('staff.dashboard')} className="flex items-center gap-2">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Famcare Staff</h2>
                </Link>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start gap-2 px-3 text-sm font-medium">
                    {/* Navigation items */}
                    {navigationItems.map(item => (
                        routeExists(item.route) ? (
                            <Link href={route(item.route)} key={item.name} className="w-full">
                                <Button
                                    variant={isActive(`/staff/${item.route.split('.').pop()}`) ? 'secondary' : 'ghost'}
                                    className="flex w-full items-center justify-start gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    {item.icon}
                                    {item.name}
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                key={item.name}
                                variant="ghost"
                                className="flex w-full items-center justify-start gap-3 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                disabled
                            >
                                {item.icon}
                                {item.name}
                            </Button>
                        )
                    ))}
                </nav>
            </div>

            {/* Logout Button */}
            <div className="border-t p-4 dark:border-gray-700">
                <Button asChild variant="outline" className="w-full">
                    <Link href={route('auth.logout')} method="post" className="flex items-center justify-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Link>
                </Button>
            </div>
        </div>
    );
}
