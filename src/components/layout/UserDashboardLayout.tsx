import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserDashboardSidebar } from './UserDashboardSidebar';

export const UserDashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <UserDashboardSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}; 