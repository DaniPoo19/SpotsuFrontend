import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/dashboard/home' },
  { icon: LayoutDashboard, label: 'Panel de Control', path: '/dashboard/inicio' },
  { icon: Users, label: 'Aspirantes', path: '/dashboard/aspirants' },
  { icon: FileText, label: 'Reportes', path: '/dashboard/reports' },
  { icon: Settings, label: 'Configuración', path: '/dashboard/settings' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-[#006837] text-white h-screen w-64 fixed left-0 top-0 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">SPOSTU</h1>
      </div>
      
      <nav className="flex-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              location.pathname === item.path
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium">{user?.document_number || 'Usuario'}</p>
            <p className="text-sm text-white/70">{user?.role?.name || 'Rol'}</p>
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