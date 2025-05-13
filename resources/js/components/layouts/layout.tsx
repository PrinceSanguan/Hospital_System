import React from 'react';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';
import { UserData } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  user: UserData;
}

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
