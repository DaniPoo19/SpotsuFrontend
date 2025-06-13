import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  FileCheck, 
  BookOpen, 
  FileText,
  Activity,
  AlertCircle,
  Home as HomeIcon,
  Calendar,
  Trophy,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import admin from '@/assets/adminsitrativo.jpg';
import { toast } from 'react-hot-toast';
import { DashboardCard } from '@/components/ui/DashboardCard';

export const UserDashboardHome = () => {
  const navigate = useNavigate();
  const { athlete, isLoading, user, isAuthenticated } = useAuth();
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  useEffect(() => {
    console.log('Estado de autenticación en Home:', {
      isAuthenticated,
      user,
      athlete,
      isLoading
    });
    setIsLocalLoading(false);
  }, [athlete, isAuthenticated, user, isLoading]);

  const handleNavigation = (path: string, disabled: boolean) => {
    console.log('Intentando navegar a:', {
      path,
      disabled,
      isAuthenticated,
      user,
      athlete
    });

    if (!isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a login');
      navigate('/login');
      return;
    }

    if (disabled) {
      console.log('Navegación bloqueada:', path);
      return;
    }

    console.log('Navegando a:', path);
    navigate(path);
  };

  /*
    Construimos las tarjetas dinámicamente. Si el atleta ya existe,
    ocultamos la opción "Registrar Datos" para no mostrarla bloqueada.
  */
  const dashboardItems = [
    // Solo incluimos "Registrar Datos" si el atleta aún NO ha sido creado
    ...(!athlete
      ? [{
      title: 'Registrar Datos',
      description: 'Completa tu información personal y deportiva para acceder a todas las funcionalidades',
      icon: UserPlus,
      path: '/register-personal-data',
          disabled: false,
          required: true
        }]
      : []),
    {
      title: 'Mi Perfil',
      description: 'Gestiona tu información personal y deportiva',
      icon: Calendar,
      path: '/user-dashboard/profile',
      disabled: !athlete
    },
    {
      title: 'Mis Postulaciones',
      description: 'Revisa el estado de tus postulaciones a convocatorias deportivas',
      icon: Trophy,
      path: '/user-dashboard/postulations',
      disabled: !athlete
    },
    {
      title: 'Mis Documentos',
      description: 'Gestiona tus documentos y certificaciones deportivas',
      icon: Settings,
      path: '/user-dashboard/documents',
      disabled: !athlete
    }
  ];

  if (isLoading || isLocalLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <img
            src={admin}
            alt="Sports"
            className="w-full h-64 object-cover"
          />
          <div className="p-8">
            <h1 className="text-4xl font-bold text-[#006837] mb-4">
              Bienvenido a tu Dashboard
            </h1>
            <p className="text-gray-600 mb-6">
              {athlete 
                ? 'Gestiona tu perfil deportivo y mantente al día con las convocatorias y oportunidades deportivas.'
                : 'Para comenzar, necesitas completar tu registro como atleta. Esto te permitirá acceder a todas las funcionalidades.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => (
            <DashboardCard
              key={item.path}
              title={item.title}
              description={item.description}
              icon={item.icon}
              path={item.path}
              onClick={() => handleNavigation(item.path, item.disabled)}
              disabled={item.disabled}
              required={item.required}
            />
          ))}
        </div>

        {!athlete && (
          <div className="mt-8 bg-[#006837]/5 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#006837] mb-4">Guía de Uso</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#006837]/10">
                  <span className="text-[#006837] font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Registro de Datos</h3>
                  <p className="text-sm text-gray-600">Completa tu información personal y deportiva para acceder a todas las funcionalidades.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#006837]/10">
                  <span className="text-[#006837] font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Postulaciones</h3>
                  <p className="text-sm text-gray-600">Una vez registrado, podrás postularte a las convocatorias deportivas disponibles.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#006837]/10">
                  <span className="text-[#006837] font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Documentos</h3>
                  <p className="text-sm text-gray-600">Sube y gestiona tus documentos deportivos para mantener tu perfil actualizado.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};