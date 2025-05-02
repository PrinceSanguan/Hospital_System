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
import { ChevronDown, LayoutDashboard, Settings, Bell } from 'lucide-react';

interface User {
    name: string;
    email: string;
    role?: string;
}

interface HeaderProps {
    user: User;
    unreadNotifications?: number;
    onMenuClick?: () => void;
}

export function Header({ user, unreadNotifications = 0, onMenuClick }: HeaderProps) {
    // Helper function to check if routes exist
    const { props } = usePage();
    const routes = (props as { ziggy?: { routes: Record<string, unknown> } })?.ziggy?.routes || {};

    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    return (
        <header className="flex h-16 items-center border-b bg-white px-4 md:px-6 dark:border-gray-700 dark:bg-gray-800">
            <Button
                variant="outline"
                size="icon"
                className="mr-2 md:hidden"
                onClick={onMenuClick}
            >
                <LayoutDashboard size={20} />
            </Button>
            <div className="flex flex-1 items-center justify-between">
                <div className="ml-auto flex items-center gap-4">
                    {/* Notifications */}
                    <Link href={route('doctor.notifications.index')} className="relative">
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell size={20} />
                            {unreadNotifications > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                </span>
                            )}
                    </Button>
                    </Link>
                    <Separator orientation="vertical" className="h-8" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="hidden text-sm font-medium md:inline-flex">Dr. {user.name}</span>
                                <ChevronDown size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>Dr. {user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {routeExists('doctor.profile') ? (
                                <Link href={route('doctor.profile')} className="w-full">
                                    <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                                        <Settings size={16} />
                                        Profile Settings
                                    </DropdownMenuItem>
                                </Link>
                            ) : (
                                <Link href={route('doctor.dashboard')} className="w-full">
                                    <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                                        <Settings size={16} />
                                        Settings
                                    </DropdownMenuItem>
                                </Link>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={route('auth.logout')} className="flex w-full cursor-pointer">
                                    Logout
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
