import React, { useState, useEffect, ReactNode } from 'react';
import { Sidebar } from '@/components/doctor/sidebar';
import { Header } from '@/components/doctor/header';
import { UserData } from '@/types';

interface Props {
  user: UserData;
  children: ReactNode;
}

const DoctorLayout: React.FC<Props> = ({ user, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/doctor/notifications/unread/count');
        const data = await response.json();
        setUnreadNotifications(data.count || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch initially
    fetchNotifications();

    // Set up interval to check periodically (every minute)
    const interval = setInterval(fetchNotifications, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <Sidebar user={user} unreadNotifications={unreadNotifications} />
        </div>

        <div className="flex-shrink-0 w-14"></div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <Sidebar user={user} unreadNotifications={unreadNotifications} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header
          user={user}
          unreadNotifications={unreadNotifications}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
