import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth';
import { RegisterPage } from '../pages/auth';
import { HomePage } from '../pages/home';
import { DashboardPage } from '../pages/dashboard';
import { AspirantsPage } from '../pages/aspirants';
import { AspirantDetailsPage } from '../pages/aspirants/details';
import { AspirantMeasurementsPage } from '../pages/aspirants/measurements';
import { SettingsPage } from '../pages/settings';
import { ProfilePage } from '../pages/profile';
import { ReportsPage } from '../pages/reports';
import { SportsHistoryPage } from '../pages/sports-history';
import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { Home } from '../components/Home';
import { AspirantDetails } from '../components/AspirantDetails';
import { AspirantsList } from '../components/AspirantsList';
import { useAuth } from '../contexts/AuthContext';

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard/home" replace /> : <LoginPage />
      } />
      
      {/* Rutas de registro de aspirante */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sports-history" element={<SportsHistoryPage />} />

      {/* Rutas del dashboard de administrador */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Navigate to="/dashboard/home" replace />} />
        <Route path="/dashboard/home" element={<Home />} />
        <Route path="/dashboard/inicio" element={<DashboardPage />} />
        <Route path="/dashboard/aspirants" element={<AspirantsList />} />
        <Route path="/dashboard/aspirants/:id" element={<AspirantDetails />} />
        <Route path="/dashboard/aspirants/:id/measurements" element={<AspirantMeasurementsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/reports" element={<ReportsPage />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard/home" replace /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};