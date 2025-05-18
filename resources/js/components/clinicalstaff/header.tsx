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
import { Separator } from '@/components/ui/separator';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeftIcon, BellIcon, Bars3Icon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface User {
    name: string;
    email: string;
    role?: string;
}

// Interface for the props returned by usePage()
interface PageProps {
    auth?: {
        user?: User;
    };
    [key: string]: unknown;
}

// Mock notifications - in a real app these would come from the server
const notifications = [
    {
        id: 1,
        title: "New Appointment",
        message: "Patient John Doe scheduled for 10:00 AM",
        time: "30 minutes ago",
        read: false
    },
    {
        id: 2,
        title: "Lab Results Ready",
        message: "Results for patient Maria Garcia are ready for review",
        time: "2 hours ago",
        read: false
    },
    {
        id: 3,
        title: "Appointment Canceled",
        message: "Patient Robert Smith canceled their 3:30 PM appointment",
        time: "Yesterday",
        read: true
    },
    {
        id: 4,
        title: "Staff Meeting",
        message: "Reminder: Staff meeting at 9:00 AM tomorrow",
        time: "Yesterday",
        read: true
    },
    {
        id: 5,
        title: "New Protocol",
        message: "New clinical protocol added to the system",
        time: "3 days ago",
        read: true
    }
];

export function Header({ user }: { user?: User }) {
    // Helper function to check if routes exist
    const { props } = usePage<PageProps>();

    // Attempt to get the authenticated user from the page props if not passed directly
    const authUser = props.auth?.user || user;

    // Safe getters for user properties with defaults
    const userName = authUser?.name || "Guest User";
    const userEmail = authUser?.email || "";
    const userRole = authUser?.role || "Clinical Staff";
    const userInitial = userName.charAt(0) || "G";

    // Check if the user is an admin
    const isAdmin = userRole.toLowerCase() === 'admin';

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 md:px-6 dark:border-gray-700 dark:bg-gray-800">
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
                <Bars3Icon className="h-5 w-5" />
            </Button>
            <div className="flex flex-1 items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 md:hidden">
                    <div className="flex items-center">
                        <img
                          src="/images/logo_famcare.jpg"
                          alt="Famcare Logo"
                          className="h-6 w-auto mr-2"
                        />
                        Famcare Health
                    </div>
                </h2>

                {/* Back to Admin button - only visible for admin users */}
                {isAdmin && (
                    <Link href={route('admin.dashboard')}>
                        <Button variant="outline" className="flex items-center gap-2">
                            <ArrowLeftIcon className="h-4 w-4" />
                            <span>Back to Admin</span>
                        </Button>
                    </Link>
                )}

                <div className="ml-auto flex items-center gap-4">
                    {/* Notifications Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <BellIcon className="h-5 w-5" />
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Notifications</span>
                                <Link href={route('staff.dashboard')} className="text-xs text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {notifications.length > 0 ? (
                                <div className="px-1">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`rounded-md p-2 mb-1 ${notification.read ? 'bg-gray-50' : 'bg-blue-50'} dark:bg-gray-800`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="font-medium">
                                                    {notification.title}
                                                    {!notification.read && (
                                                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">{notification.time}</div>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                                {notification.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4 text-gray-500">
                                    <BellIcon className="h-10 w-10 text-gray-300" />
                                    <p>No notifications</p>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Separator orientation="vertical" className="h-8" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/placeholder-avatar.jpg" alt={userName} />
                                    <AvatarFallback>{userInitial}</AvatarFallback>
                                </Avatar>
                                <div className="hidden text-sm md:block text-left mr-1">
                                    <p className="font-medium">{userName}</p>
                                </div>
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="p-2">
                                <p className="font-medium">{userName}</p>
                                <p className="text-xs text-gray-500">{userEmail}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {isAdmin ? 'Admin' : 'Clinical Staff'}
                                </p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link
                                    href={route('auth.logout')}
                                    method="post"
                                    className="flex w-full items-center gap-2"
                                >
                                    <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                    <span>Logout</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
