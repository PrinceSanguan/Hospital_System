import React from 'react';
import { usePage } from '@inertiajs/react';
import { Sidebar } from '@/components/clinicalstaff/sidebar';
import { Header } from '@/components/clinicalstaff/header';

interface UserProps {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface PageProps {
  url?: string;
  user: UserProps;
}

interface Props {
  children: React.ReactNode;
}

const ClinicalStaffLayout: React.FC<Props> = ({ children }) => {
  const { user } = usePage<PageProps>().props;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Header */}
        <Header user={user} />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Hidden Logout Form */}
      <form id="logout-form" method="POST" action={route('auth.logout')} className="hidden">
        <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''} />
      </form>
    </div>
  );
};

export default ClinicalStaffLayout;
