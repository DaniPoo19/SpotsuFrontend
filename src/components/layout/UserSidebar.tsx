import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User,
  FileText,
  LogOut,
  Settings,
  Activity,
  BookOpen,
  FileCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/2.png';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/api/axios';

interface UserSidebarProps {
  hasAthlete: boolean;
}

const userMenuItems = [
  {
    path: '/user-dashboard/home',
    icon: Activity,
    label: 'Inicio',
    disabled: false
  },
  {
    path: '/user-dashboard/profile',
    icon: User,
    label: 'Mi Perfil',
    disabled: false
  },
  {
    path: '/register-personal-data',
    icon: UserPlus,
    label: 'Registrar Datos',
    disabled: false
  },
  {
    path: '/user-dashboard/postulations',
    icon: FileCheck,
    label: 'Mis Postulaciones',
    disabled: true
  },
  {
    path: '/user-dashboard/sports-history-management',
    icon: BookOpen,
    label: 'Historial Deportivo',
    disabled: false
  },
  {
    path: '/user-dashboard/documents',
    icon: FileText,
    label: 'Mis Documentos',
    disabled: true
  }
];

export const UserSidebar = ({ hasAthlete }: UserSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [menuItems, setMenuItems] = useState(userMenuItems);

  useEffect(() => {
    console.log('Estado del Sidebar:', {
      hasAthlete,
      isAuthenticated,
      user,
      currentPath: location.pathname
    });

    // Actualizar el estado de los elementos del menú basado en hasAthlete
    const updatedMenuItems = menuItems.map(item => {
      if (item.label === 'Registrar Datos') {
        return { ...item, disabled: hasAthlete };
      }
      if (item.label === 'Historial Deportivo') {
        return { ...item, disabled: false };
      }
      return { ...item, disabled: !hasAthlete };
    });
    setMenuItems(updatedMenuItems);
  }, [hasAthlete, isAuthenticated, user, location.pathname]);

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    logout();
    navigate('/login');
  };

  const handleNavigation = async (path: string, disabled: boolean, label: string) => {
    console.log('Intentando navegar desde Sidebar:', {
      path,
      disabled,
      label,
      isAuthenticated,
      user,
      hasAthlete
    });

    try {
      // Verificar el token antes de navegar
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No hay token, redirigiendo a login');
        navigate('/login');
        return;
      }

      // Configurar el token en axios
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (!isAuthenticated) {
        console.log('Usuario no autenticado en Sidebar, redirigiendo a login');
        navigate('/login');
        return;
      }

      if (disabled) {
        console.log('Navegación bloqueada en Sidebar:', path);
        if (!hasAthlete) {
          toast.error('Debes registrar tus datos personales primero');
        }
        return;
      }

      console.log('Navegando desde Sidebar a:', path);
      navigate(path);
    } catch (error) {
      console.error('Error al navegar:', error);
      toast.error('Error al navegar. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="bg-[#006837] text-white h-screen w-64 fixed left-0 top-0 p-4 flex flex-col">
      <div className="mb-8">
        <img 
          src={logo} 
          alt="Universidad de Córdoba" 
          className="w-20 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-center">SPOSTU</h1>
      </div>
      
      <nav className="flex-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path, item.disabled, item.label)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
              location.pathname === item.path
                ? 'bg-white/20'
                : item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-white/10'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                Bloqueado
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium">{user?.document_number || 'Usuario'}</p>
            <p className="text-sm text-white/70">{user?.role?.name || 'Deportista'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}; 