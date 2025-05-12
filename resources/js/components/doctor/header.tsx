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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, Settings, Bell } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import React, { useState, useEffect } from 'react';

interface User {
    name: string;
    email: string;
    role?: string;
}

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
    related_id?: number;
    related_type?: string;
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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const routeExists = (name: string) => {
        return Object.keys(routes).includes(name);
    };

    // Fetch recent notifications when popover is opened
    const fetchNotifications = async (open: boolean) => {
        if (open && notifications.length === 0 && !isLoading) {
            setIsLoading(true);
            try {
                const response = await fetch(route('doctor.notifications.recent'));
                const data = await response.json();
                setNotifications(data.notifications);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Mark notification as read
    const markAsRead = (id: number) => {
        router.put(route('doctor.notifications.mark.read', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Update the local state
                setNotifications(notifications.map(n =>
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n
                ));
            }
        });
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    <Popover onOpenChange={fetchNotifications}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell size={20} />
                                {unreadNotifications > 0 && (
                                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <div className="border-b p-4">
                                <h4 className="text-sm font-semibold">Notifications</h4>
                            </div>
                            <div className="max-h-80 overflow-auto">
                                {isLoading ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        Loading...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        No notifications
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 ${notification.read_at ? "" : "bg-blue-50"}`}
                                                onClick={() => {
                                                    if (!notification.read_at) {
                                                        markAsRead(notification.id);
                                                    }

                                                    if (notification.related_id && notification.related_type === 'appointment') {
                                                        router.visit(route('doctor.appointments.show', notification.related_id));
                                                    }
                                                }}
                                            >
                                                <p className="font-semibold text-sm">{notification.title}</p>
                                                <p className="text-sm">{notification.message}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {formatDate(notification.created_at)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="border-t p-2">
                                <Button asChild variant="ghost" size="sm" className="w-full">
                                    <Link href={route('doctor.notifications.index')}>View all notifications</Link>
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                                        Settings
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
                                <Link href={route('auth.logout')} method="post" className="flex w-full cursor-pointer">
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
