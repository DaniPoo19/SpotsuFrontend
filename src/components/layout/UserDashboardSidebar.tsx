import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { User, FileText, LogOut, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const UserDashboardSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [hasPersonalData, setHasPersonalData] = useState(false);

  useEffect(() => {
    const checkPersonalData = async () => {
      if (user?.person_id) {
        setHasPersonalData(true);
      }
    };
    checkPersonalData();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      path: '/user-dashboard/profile',
      icon: <User className="w-5 h-5" />,
      label: 'Mi Perfil',
      disabled: false
    },
    {
      path: '/register-personal-data',
      icon: <UserPlus className="w-5 h-5" />,
      label: 'Registrar Datos',
      disabled: hasPersonalData
    },
    {
      path: '/user-dashboard/postulations',
      icon: <FileText className="w-5 h-5" />,
      label: 'Mis Postulaciones',
      disabled: !hasPersonalData
    }
  ];

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 min-h-screen bg-white border-r border-gray-200 p-4"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#006837]">Spotsu</h2>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.disabled ? '#' : item.path}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    if (item.label === 'Mis Postulaciones') {
                      toast.error('Debes completar tus datos personales primero');
                    }
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#006837] text-white'
                    : item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    Bloqueado
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 