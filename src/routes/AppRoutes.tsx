import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/login';
import { RegisterAccountPage } from '../pages/auth/register-account';
import { PersonalDataForm } from '../components/PersonalDataForm';
import { HomePage } from '../pages/home';
import { AspirantsPage } from '../pages/aspirants';
import { AspirantDetailsPage } from '../pages/aspirants/[id]';
import { MorphologicalEvaluationPage } from '../pages/aspirants/morphological-evaluation';
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
  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterAccountPage />} />
      <Route path="/register-personal-data" element={<PersonalDataForm />} />
      <Route path="/par-q" element={<ParQForm />} />

      {/* Rutas protegidas */}
      <Route
        path="/sports-history"
        element={
          <ProtectedRoute>
            <SportsHistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas del dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="aspirants" element={<AspirantsPage />} />
        <Route path="aspirants/:id" element={<AspirantDetailsPage />} />
        <Route path="aspirants/:id/morphological-evaluation" element={<MorphologicalEvaluationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/unauthorized" element={<div>No tienes permiso para acceder a esta página</div>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};
