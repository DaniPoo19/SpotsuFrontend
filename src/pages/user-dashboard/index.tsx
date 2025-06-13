import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserSidebar } from './components/UserSidebar';
import { useAuth } from '@/contexts/AuthContext';

export const UserDashboardPage = () => {
  const { athlete, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <UserSidebar hasAthlete={!!athlete} />
      <main className="flex-1 overflow-y-auto ml-64">
        <Outlet context={{ hasAthlete: !!athlete }} />
      </main>
    </div>
  );
};