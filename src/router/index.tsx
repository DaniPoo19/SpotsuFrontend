import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { ParQForm } from '../pages/parq/ParQForm';
import { LoginPage } from '../pages/auth/login';
import { RegisterPage } from '../pages/auth/register';

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
        element: <RegisterPage />,
      },
      {
        path: '/par-q',
        element: <ParQForm />,
      },
    ],
  },
]);

export default router; 