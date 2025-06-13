import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from '../pages/auth/login';
import { RegisterAccountPage } from '../pages/auth/register-account';
import { PersonalDataForm } from '../components/PersonalDataForm';
import { HomePage } from '../pages/home';
import { AspirantsPage } from '../pages/aspirants';
import { AspirantDetailsPage } from '../pages/aspirants/[id]';
import { MorphologicalEvaluationPage } from '../pages/aspirants/morphological-evaluation';
import { ReportsPage } from '../pages/reports';
import { ProfilePage } from '../pages/admin-dashboard/profile';
import { SettingsPage } from '../pages/settings';
import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { SportsHistoryPage } from '../pages/sports-history';
import { ParQForm } from '../pages/parq/ParQForm';
import { useAuth } from '../contexts/AuthContext';
import { UserDashboardPage } from '../pages/user-dashboard';
import { PostulationsPage } from '../pages/user-dashboard/postulations';
import { UserProfilePage } from '../pages/user-dashboard/profile';
import axios from 'axios';
import { api } from '../services/api';

// Componente para rutas públicas (solo accesibles cuando no hay sesión)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

// Componente para rutas protegidas (solo accesibles con sesión)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  // Mientras se carga la autenticación global, mostramos loader
  if (isLoading) {
    console.log('[ProtectedRoute] AuthContext aún cargando, mostrando loader');
    return <div>Cargando...</div>;
  }

  // Si no hay token o usuario, redirigimos al login
  if (!token || !user) {
    console.warn('[ProtectedRoute] Sin token o usuario. token?', !!token, 'user?', !!user);
    console.log('[ProtectedRoute] Redirigiendo al login - Falta token o usuario');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token y usuario presentes => acceso permitido
  console.log('[ProtectedRoute] Acceso permitido a ruta protegida:', location.pathname);
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

      {/* Rutas del dashboard de usuario */}
      <Route
        path="/user-dashboard"
        element={
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="postulations" element={<PostulationsPage />} />
      </Route>

      {/* Rutas de postulaciones */}
      <Route path="/user-dashboard/postulations" element={<PostulationsPage />} />
      {/* La ruta postulations/new redirige a personal-info, página dedicada no necesaria */}
      <Route path="/user-dashboard/postulations/new/personal-info" element={<PersonalDataForm />} />
      <Route path="/user-dashboard/postulations/new/parq" element={<ParQForm />} />
      <Route path="/user-dashboard/postulations/new/sports-history" element={<SportsHistoryPage />} />

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/unauthorized" element={<div>No tienes permiso para acceder a esta página</div>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};
