import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#006837] text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl">
      {/* Logo y título */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight">SPOSTU</h1>
        <p className="text-sm text-white/70 mt-1">Sistema de Gestión Deportiva</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 ${
                isActive 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Perfil y cerrar sesión */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'}
            alt={user?.name || 'Usuario'}
            className="w-10 h-10 rounded-full border-2 border-white/20"
          />
          <div>
            <p className="font-medium">{user?.name || 'Usuario'}</p>
            <p className="text-sm text-white/70">{user?.email || 'usuario@spostu.com'}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};