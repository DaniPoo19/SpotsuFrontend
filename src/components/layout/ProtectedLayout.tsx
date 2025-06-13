import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserSidebar } from './UserSidebar';


export const ProtectedLayout = () => {
  const { user, athlete } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {user?.role.name === 'ATHLETE' ? (
        <UserSidebar hasAthlete={!!athlete} />
      ) : (
        
      )}
      <main className="flex-1 overflow-y-auto ml-64">
        <Outlet />
      </main>
    </div>
  );
}; 