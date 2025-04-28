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

export function Header({ user }: { user: User }) {
    // Helper function to check if routes exist
    const { props } = usePage();
    const routes = (props as any)?.ziggy?.routes || {};

    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    return (
        <header className="flex h-16 items-center border-b bg-white px-4 md:px-6 dark:border-gray-700 dark:bg-gray-800">
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
                <LayoutDashboard size={20} />
            </Button>
            <div className="flex flex-1 items-center justify-between">
                <div className="ml-auto flex items-center gap-4">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell size={20} />
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/api/placeholder/32/32" alt={user.name} />
                                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
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
