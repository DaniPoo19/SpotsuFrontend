import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

// Rutas que deben mostrar la barra lateral (solo para administrador)
const ADMIN_ROUTES = [
  '/dashboard',
  '/dashboard/aspirants',
  '/dashboard/settings',
  '/dashboard/profile',
  '/dashboard/reports'
];

export const ProtectedLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si el usuario es administrador
  if (user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}; 