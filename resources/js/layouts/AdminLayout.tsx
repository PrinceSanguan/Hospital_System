import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import React from 'react';

interface AdminLayoutProps {
    children: React.ReactNode;
    user: {
        name: string;
        email: string;
        role?: string;
    };
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar component */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header with user data */}
                <Header user={user} />

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6 dark:bg-gray-900">{children}</main>
            </div>
        </div>
    );
}
