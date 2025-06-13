import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario está autenticado pero no tiene un rol asignado
  if (!user?.role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se especificaron roles permitidos, verificar que el usuario tenga uno de esos roles
  if (allowedRoles.length > 0 && !allowedRoles.some(role => role.toUpperCase() === user.role.name)) {
    // Redirigir según el rol del usuario
    switch (user.role.name) {
      case 'ADMIN':
      case 'PROFESSIONAL':
        return <Navigate to="/dashboard" replace />;
      case 'ATHLETE':
        return <Navigate to="/user-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}; 