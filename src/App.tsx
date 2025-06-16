import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/auth/login';
import { RegisterAccountPage } from '@/pages/auth/register-account';
import { UserDashboardPage } from '@/pages/user-dashboard';
import { UserDashboardHome } from '@/pages/user-dashboard/home';
import { UserProfilePage } from '@/pages/user-dashboard/profile';
import { DocumentsPage } from '@/pages/user-dashboard/documents';
import { PostulationsPage } from '@/pages/user-dashboard/postulations';
import { PostulationDetailsPage } from '@/pages/user-dashboard/postulation-details';
import { ParQForm } from '@/pages/parq/ParQForm';
import { PersonalDataForm } from '@/components/PersonalDataForm';
import { Toaster } from 'react-hot-toast';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { SportsHistoryPage } from '@/pages/sports-history';
import { Layout as AdminDashboardLayout } from '@/pages/admin-dashboard/components/layout';
import { HomePage } from '@/pages/admin-dashboard/home';
import { AspirantsPage } from '@/pages/admin-dashboard/aspirants';
import { AspirantDetailsPage } from '@/pages/admin-dashboard/aspirants/details';
import { ReportsPage } from '@/pages/admin-dashboard/reports';
import { SettingsPage } from '@/pages/admin-dashboard/settings';
import { ProfilePage } from '@/pages/admin-dashboard/profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterAccountPage />} />
          
          {/* Rutas protegidas para usuarios */}
          <Route path="/user-dashboard" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <UserDashboardPage />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/user-dashboard/home" replace />} />
            <Route path="home" element={<UserDashboardHome />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="postulations" element={<PostulationsPage />} />
            <Route path="postulations/:id" element={<PostulationDetailsPage />} />
          </Route>

          {/* Ruta protegida para el formulario de datos personales */}
          <Route path="/register-personal-data" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <PersonalDataForm />
            </ProtectedRoute>
          } />

          {/* Ruta protegida para el cuestionario PAR-Q */}
          <Route path="/parq" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <ParQForm />
            </ProtectedRoute>
          } />

          {/* Ruta protegida para el historial deportivo */}
          <Route path="/sports-history" element={
            <ProtectedRoute allowedRoles={['ATHLETE']}>
              <SportsHistoryPage />
            </ProtectedRoute>
          } />

          {/* Rutas protegidas para administradores y profesionales */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PROFESSIONAL']}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }>
        
            <Route path="home" element={<HomePage />} />
            <Route path="aspirants" element={<AspirantsPage />} />
            <Route path="aspirants/:id" element={<AspirantDetailsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="sports-history" element={<SportsHistoryPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;