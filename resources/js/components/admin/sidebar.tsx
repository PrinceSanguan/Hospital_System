import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    FileText,
    BarChart3,
    LogOut,
    Stethoscope,
    UserCog,
    Settings
} from 'lucide-react';

// Types for usePage props
interface PageProps {
    admin?: {
        navigation?: {
            current: string;
            items: Array<{
                name: string;
                route: string;
                icon: string;
            }>;
        };
    };
    ziggy?: {
        routes: Record<string, unknown>;
    };
}

export function Sidebar() {
    const page = usePage();
    const pageData = page.props as unknown as PageProps;
    const navItems = pageData.admin?.navigation?.items || [];
    const currentRoute = pageData.admin?.navigation?.current || '';

    // Function to check if the route matches
    const isActive = (routeName: string) => currentRoute === routeName;

    // Helper function to check if routes exist
    const routes = pageData.ziggy?.routes || {};
    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    // Function to get the appropriate icon component
    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'dashboard':
                return <LayoutDashboard size={18} />;
            case 'records':
                return <FileText size={18} />;
            case 'users':
                return <Users size={18} />;
            case 'doctors':
                return <Stethoscope size={18} />;
            case 'staff':
                return <UserCog size={18} />;
            case 'reports':
                return <BarChart3 size={18} />;
            case 'settings':
                return <Settings size={18} />;
            default:
                return <FileText size={18} />;
        }
    };

    return (
        <div className="hidden w-64 flex-col border-r bg-white md:flex dark:border-gray-700 dark:bg-gray-900">
            {/* Header with logo */}
            <div className="flex h-16 items-center border-b px-4 dark:border-gray-700">
                <Link href={route('admin.dashboard')} className="flex items-center gap-2">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Famcare Admin</h2>
                </Link>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start gap-2 px-3 text-sm font-medium">
                    {navItems.map((item) => (
                        routeExists(item.route) ? (
                            <Link href={route(item.route)} key={item.name} className="w-full">
                                <Button
                                    variant={isActive(item.route) ? 'secondary' : 'ghost'}
                                    className="flex w-full items-center justify-start gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    {getIconComponent(item.icon)}
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
                                {getIconComponent(item.icon)}
                                {item.name}
                            </Button>
                        )
                    ))}
                </nav>
            </div>

        </div>
    );
}
