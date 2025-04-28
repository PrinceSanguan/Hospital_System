import { Header } from '@/components/doctor/header';
import { Sidebar } from '@/components/doctor/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Settings, Lock, Calendar, ClipboardList } from "lucide-react";

interface UserProfile {
    name: string;
    email: string;
    role?: string;
    specialization?: string;
    qualifications?: string;
    about?: string;
    phone?: string;
    address?: string;
    profileImage?: string;
}

interface ProfileProps {
    user: UserProfile;
}

export default function DoctorProfile({ user }: ProfileProps) {
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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Manage your account settings and profile information
                            </p>
                        </div>

                        <Tabs defaultValue="personal" className="w-full">
                            <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto">
                                <TabsTrigger value="personal" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Personal Info
                                </TabsTrigger>
                                <TabsTrigger value="account" className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Account Settings
                                </TabsTrigger>
                                <TabsTrigger value="security" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Security
                                </TabsTrigger>
                            </TabsList>

                            {/* Personal Information Tab */}
                            <TabsContent value="personal">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>
                                            Update your personal details and professional information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="fullName">Full Name</Label>
                                                <Input id="fullName" defaultValue={user.name} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" defaultValue={user.email} disabled />
                                                <p className="text-xs text-gray-500">Your email address cannot be changed</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input id="phone" defaultValue={user.phone || ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="specialization">Specialization</Label>
                                                <Input id="specialization" defaultValue={user.specialization || 'General Medicine'} />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="qualifications">Qualifications</Label>
                                                <Input id="qualifications" defaultValue={user.qualifications || 'MD, PhD'} />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="address">Address</Label>
                                                <Input id="address" defaultValue={user.address || ''} />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="about">About</Label>
                                                <textarea
                                                    id="about"
                                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    defaultValue={user.about || 'Experienced physician specializing in patient care with over 10 years of practice.'}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button type="submit">
                                                Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle>Professional Details</CardTitle>
                                        <CardDescription>
                                            Information that will be displayed to patients
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="experience">Years of Experience</Label>
                                                <Input id="experience" defaultValue="10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="languages">Languages Spoken</Label>
                                                <Input id="languages" defaultValue="English, Spanish" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="education">Education</Label>
                                                <Input id="education" defaultValue="University of California, San Francisco" />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button type="submit">
                                                Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Account Settings Tab */}
                            <TabsContent value="account">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Account Settings</CardTitle>
                                        <CardDescription>
                                            Manage your account preferences and settings
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium">Email Notifications</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">New Appointments</p>
                                                        <p className="text-sm text-gray-500">Receive email notifications for new appointments</p>
                                                    </div>
                                                    <div className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200">
                                                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-white" />
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">Appointment Reminders</p>
                                                        <p className="text-sm text-gray-500">Receive reminders before scheduled appointments</p>
                                                    </div>
                                                    <div className="relative h-6 w-11 cursor-pointer rounded-full bg-blue-600">
                                                        <span className="absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-white" />
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">Medical Record Updates</p>
                                                        <p className="text-sm text-gray-500">Receive notifications when patient records are updated</p>
                                                    </div>
                                                    <div className="relative h-6 w-11 cursor-pointer rounded-full bg-blue-600">
                                                        <span className="absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium">Availability Settings</h3>
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="workingHours">Working Hours</Label>
                                                    <Input id="workingHours" defaultValue="9:00 AM - 5:00 PM" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="workingDays">Working Days</Label>
                                                    <Input id="workingDays" defaultValue="Monday - Friday" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button type="submit">
                                                Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Security Tab */}
                            <TabsContent value="security">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Security Settings</CardTitle>
                                        <CardDescription>
                                            Update your password and security preferences
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium">Change Password</h3>
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

                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-500">Enable two-factor authentication for additional security</p>
                                                </div>
                                                <div className="relative h-6 w-11 cursor-pointer rounded-full bg-gray-200">
                                                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button type="submit">
                                                Update Security Settings
                                            </Button>
                                        </div>
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
