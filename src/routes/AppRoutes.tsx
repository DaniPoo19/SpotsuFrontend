import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/login';
import { RegisterAccountPage } from '../pages/auth/register-account';
import { PersonalDataForm } from '../components/PersonalDataForm';
import { HomePage } from '../pages/home';
import { AspirantsPage } from '../pages/aspirants';
import { AspirantDetailsPage } from '../pages/aspirants/details';
import { ReportsPage } from '../pages/reports';
import { ProfilePage } from '../pages/profile';
import { SettingsPage } from '../pages/settings';
import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { SportsHistoryPage } from '../pages/sports-history';
import { ParQForm } from '../pages/parq/ParQForm';
import { useAuth } from '../contexts/AuthContext';

// Componente para rutas públicas (solo accesibles cuando no hay sesión)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

// Componente para rutas protegidas (solo accesibles con sesión)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register-account"
        element={
          <PublicRoute>
            <RegisterAccountPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register-personal-data"
        element={
          <ProtectedRoute>
            <PersonalDataForm />
          </ProtectedRoute>
        }
      />

      {/* Rutas protegidas */}
      <Route
        path="/par-q"
        element={
          <ProtectedRoute>
            <ParQForm />
          </ProtectedRoute>
        }
      />

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/sports-history" element={<SportsHistoryPage />} />
      <Route path="/unauthorized" element={<div>No tienes permiso para acceder a esta página</div>} />
      <Route path="/dashboard" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="aspirants" element={<AspirantsPage />} />
        <Route path="aspirants/:id" element={<AspirantDetailsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};
