import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield, Lock, Moon, Sun } from "lucide-react";
import { FormEvent, useState } from "react";
import { Switch } from "@/components/ui/switch";

interface UserProfile {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface SettingsProps {
    user: UserProfile;
}

export default function DoctorSettings({ user }: SettingsProps) {
    const [formData, setFormData] = useState({
        emailNotifications: true,
        appointmentReminders: true,
        darkMode: false,
        twoFactorEnabled: false,
    });

    const handleChange = (field: string, value: boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.post('/doctor/settings/update', formData);
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header user={user} />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Manage your application settings and preferences
                            </p>
                        </div>

                        <Tabs defaultValue="notifications" className="w-full">
                            <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto">
                                <TabsTrigger value="notifications" className="flex items-center gap-2">
                                    <Bell className="h-4 w-4" />
                                    Notifications
                                </TabsTrigger>
                                <TabsTrigger value="appearance" className="flex items-center gap-2">
                                    <Sun className="h-4 w-4" />
                                    Appearance
                                </TabsTrigger>
                                <TabsTrigger value="security" className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Security
                                </TabsTrigger>
                            </TabsList>

                            {/* Notifications Tab */}
                            <TabsContent value="notifications">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Notification Settings</CardTitle>
                                        <CardDescription>
                                            Configure how and when you receive notifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <form onSubmit={handleSubmit}>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">Email Notifications</h3>
                                                        <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                                                    </div>
                                                    <Switch
                                                        checked={formData.emailNotifications}
                                                        onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                                                    />
                                                </div>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">Appointment Reminders</h3>
                                                        <p className="text-sm text-gray-500">Get reminders before scheduled appointments</p>
                                                    </div>
                                                    <Switch
                                                        checked={formData.appointmentReminders}
                                                        onCheckedChange={(checked) => handleChange('appointmentReminders', checked)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end mt-6">
                                                <Button type="submit">
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Appearance Tab */}
                            <TabsContent value="appearance">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Appearance Settings</CardTitle>
                                        <CardDescription>
                                            Customize the appearance of your doctor portal
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <form onSubmit={handleSubmit}>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">Dark Mode</h3>
                                                        <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                                                    </div>
                                                    <Switch
                                                        checked={formData.darkMode}
                                                        onCheckedChange={(checked) => handleChange('darkMode', checked)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end mt-6">
                                                <Button type="submit">
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Security Tab */}
                            <TabsContent value="security">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Security Settings</CardTitle>
                                        <CardDescription>
                                            Update your security preferences and password
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <form onSubmit={handleSubmit}>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">Two-Factor Authentication</h3>
                                                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                                    </div>
                                                    <Switch
                                                        checked={formData.twoFactorEnabled}
                                                        onCheckedChange={(checked) => handleChange('twoFactorEnabled', checked)}
                                                    />
                                                </div>
                                                <Separator />
                                                <div className="space-y-2">
                                                    <h3 className="font-medium">Change Password</h3>
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="currentPassword">Current Password</Label>
                                                            <Input id="currentPassword" type="password" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="newPassword">New Password</Label>
                                                            <Input id="newPassword" type="password" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                            <Input id="confirmPassword" type="password" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end mt-6">
                                                <Button type="submit">
                                                    Update Security Settings
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
