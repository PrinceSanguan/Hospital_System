import React from 'react';
import { Head } from '@inertiajs/react';
import DoctorLayout from '@/layouts/DoctorLayout';
import { Card, CardContent } from "@/components/ui/card";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface RecordsProps {
    user: User;
}

export default function Records({ user }: RecordsProps) {
    return (
        <DoctorLayout user={user}>
            <Head title="Medical Records" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Records</h1>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center py-12">
                                <h2 className="text-xl mb-4 text-gray-700">Medical Records Access Restricted</h2>
                                <p className="text-gray-500 mb-2">
                                    Access to medical records has been restricted for doctors.
                                </p>
                                <p className="text-gray-500">
                                    Please contact the administrator if you need to access this functionality.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DoctorLayout>
    );
}
