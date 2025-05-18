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
import { ArrowLeftIcon, BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface User {
    name: string;
    email: string;
    role?: string;
}

interface PageProps {
    admin?: {
        navigation?: {
            current: string;
        };
    };
}

export function Header({ user }: { user: User }) {
    const page = usePage();
    const pageData = page.props as unknown as PageProps;
    const currentRoute = pageData.admin?.navigation?.current || '';

    // Check if the current route is a clinical staff route
    const isClinicalRoute = currentRoute.includes('clinical') ||
                           currentRoute.includes('lab') ||
                           currentRoute.includes('staff.appointments') ||
                           currentRoute.includes('record-requests') ||
                           currentRoute.includes('lab-results') ||
                           currentRoute.includes('receipts');

    return (
        <header className="flex h-16 items-center border-b bg-white px-4 md:px-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-1 items-center justify-between">
                <div className="font-semibold md:hidden">Famcare Admin</div>

                <div className="ml-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-gray-500">
                        <BellIcon className="h-5 w-5" />
                    </Button>
                    <Separator orientation="vertical" className="h-8" />

                    {/* Go back to admin button - now positioned next to the admin icon */}
                    {isClinicalRoute && (
                        <>
                            <Link href={route('admin.dashboard')}>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <ArrowLeftIcon className="h-4 w-4" />
                                    <span>Go back to admin</span>
                                </Button>
                            </Link>
                            <Separator orientation="vertical" className="h-8" />
                        </>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="hidden text-sm font-medium md:inline-flex">{user.name}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                    {user.role && (
                                        <span className="mt-1 text-xs font-normal text-blue-600">
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <Link href={route('admin.settings')} className="w-full">
                                <DropdownMenuItem className="flex w-full cursor-pointer items-center gap-2">
                                    <Cog6ToothIcon className="h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                            </Link>
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

