import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';
import {
    HomeIcon,
    DocumentIcon,
    UserIcon,
    UsersIcon,
    HeartIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ClipboardDocumentIcon,
    BeakerIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    ReceiptRefundIcon
} from '@heroicons/react/24/outline';

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
                return <HomeIcon className="w-5 h-5" />;
            case 'records':
                return <DocumentIcon className="w-5 h-5" />;
            case 'users':
                return <UsersIcon className="w-5 h-5" />;
            case 'doctors':
                return <HeartIcon className="w-5 h-5" />;
            case 'staff':
                return <UserIcon className="w-5 h-5" />;
            case 'reports':
                return <ChartBarIcon className="w-5 h-5" />;
            case 'settings':
                return <Cog6ToothIcon className="w-5 h-5" />;
            case 'medical':
                return <ClipboardDocumentIcon className="w-5 h-5" />;
            case 'lab':
                return <BeakerIcon className="w-5 h-5" />;
            case 'appointments':
                return <CalendarIcon className="w-5 h-5" />;
            case 'prescriptions':
                return <ClipboardDocumentListIcon className="w-5 h-5" />;
            case 'receipts':
                return <ReceiptRefundIcon className="w-5 h-5" />;
            case 'logs':
                return <DocumentIcon className="w-5 h-5" />;
            default:
                return <DocumentIcon className="w-5 h-5" />;
        }
    };

    // Clinical staff links have been removed

    return (
        <div className="hidden w-64 flex-col border-r bg-white md:flex dark:border-gray-700 dark:bg-gray-900">
            {/* Header with logo */}
            <div className="flex h-16 items-center border-b px-4 dark:border-gray-700">
                <Link href={route('admin.dashboard')} className="flex items-center gap-2">
                    <img
                      src="/images/logo_famcare.jpg"
                      alt="Famcare Logo"
                      className="h-6 w-auto"
                    />
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

                    {/* Separator */}
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                    
                    {/* Clinical Staff Functions Section - Removed */}
                </nav>
            </div>

        </div>
    );
}
