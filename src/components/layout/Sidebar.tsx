import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  Medal,
  FileText
} from 'lucide-react';
import { currentUser } from '../../data';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Users, label: 'Aspirantes', path: '/aspirants' },
  { icon: FileText, label: 'Reportes', path: '/reports' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="bg-[#006837] text-white h-screen w-64 fixed left-0 top-0 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">TRACKSPORT</h1>
      </div>
      
      <nav className="flex-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
              location.pathname === item.path ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-white/20 pt-4">
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="text-left">
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-sm text-white/70">{currentUser.email}</p>
          </div>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-red-300 hover:text-red-200 mt-2"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};