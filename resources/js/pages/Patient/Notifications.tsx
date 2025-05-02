import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PatientLayout } from '@/layouts/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ArrowLeft, Check } from "lucide-react";
import { UserData } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    related_id?: number;
    related_type?: string;
}

interface NotificationsProps {
    user: UserData;
    notifications: Notification[];
}

export default function Notifications({ user, notifications }: NotificationsProps) {
    const [activeTab, setActiveTab] = useState('all');

    // Filter notifications based on tab
    const filteredNotifications = activeTab === 'all'
        ? notifications
        : activeTab === 'unread'
        ? notifications.filter(n => !n.read_at)
        : notifications.filter(n => n.read_at);

    // Helper to format notification time
    const formatNotificationTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            if (isToday) {
                return formatDistanceToNow(date, { addSuffix: true });
            } else {
                return format(date, 'MMM d, yyyy h:mm a');
            }
        } catch {
            return dateString;
        }
    };

    // Helper to get icon based on notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'appointment_confirmed':
                return <Badge className="bg-green-100 text-green-800">Appointment Confirmed</Badge>;
            case 'appointment_cancelled':
                return <Badge className="bg-red-100 text-red-800">Appointment Cancelled</Badge>;
            case 'appointment_request':
                return <Badge className="bg-blue-100 text-blue-800">Appointment Request</Badge>;
            case 'medical_record_updated':
                return <Badge className="bg-purple-100 text-purple-800">Record Updated</Badge>;
            case 'lab_results_available':
                return <Badge className="bg-yellow-100 text-yellow-800">Lab Results</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Notification</Badge>;
        }
    };

    // Mark notification as read
    const markAsRead = (id: number) => {
        router.put(route('patient.notifications.mark.read', id));
    };

    // Mark all notifications as read
    const markAllAsRead = () => {
        router.put(route('patient.notifications.mark.all.read'));
    };

    return (
        <PatientLayout user={user}>
            <Head title="Notifications" />
            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Button variant="ghost" asChild className="mb-4">
                            <Link href={route('patient.dashboard')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>

                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={markAllAsRead}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Mark All as Read
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Your Notifications</CardTitle>
                            <CardDescription>
                                View and manage your notifications
                            </CardDescription>

                            <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveTab}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="unread">
                                        Unread
                                        {notifications.filter(n => !n.read_at).length > 0 && (
                                            <Badge className="ml-2 bg-red-500 text-white">
                                                {notifications.filter(n => !n.read_at).length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="read">Read</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent>
                            {filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <Bell size={48} strokeWidth={1.5} className="mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No notifications</p>
                                    <p className="text-sm">You don't have any {activeTab !== 'all' ? activeTab : ''} notifications at the moment</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 rounded-lg border ${!notification.read_at ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="mb-1">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatNotificationTime(notification.created_at)}
                                                </div>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mt-2">{notification.title}</h3>
                                            <p className="text-gray-700 mt-1">{notification.message}</p>

                                            <div className="flex items-center justify-between mt-4">
                                                {notification.related_id && notification.related_type === 'appointment' && (
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={route('patient.appointments.show', notification.related_id)}>
                                                            View Appointment
                                                        </Link>
                                                    </Button>
                                                )}

                                                {notification.related_id && notification.related_type === 'record' && (
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={route('patient.records.show', notification.related_id)}>
                                                            View Record
                                                        </Link>
                                                    </Button>
                                                )}

                                                {!notification.read_at && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        Mark as Read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PatientLayout>
    );
}
