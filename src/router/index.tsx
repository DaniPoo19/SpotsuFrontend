import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { ParQForm } from '../pages/parq/ParQForm';
import { LoginPage } from '../pages/auth/login';
import { RegisterAccountPage } from '../pages/auth/register-account';
import { Layout as AdminLayout } from '../pages/admin-dashboard/components/layout';
import { DashboardPage } from '../pages/admin-dashboard/dashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterAccountPage />,
      },
      {
        path: '/par-q',
        element: <ParQForm />,
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          {
            path: '',
            element: <DashboardPage />
          },
          // Aquí irán otras rutas del admin
        ]
      }
    ],
  },
],
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — flag futuro no existe aún en definiciones de tipos incluidas
{
  future: {
    v7_startTransition: true,
  },
} as any);

export default router; 