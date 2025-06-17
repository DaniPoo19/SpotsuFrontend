import React from 'react';
import {
  Home,
  Users,
  GraduationCap,
  Settings,
  LayoutDashboard,
  User
} from 'lucide-react';
import { currentUser } from '../data';

const navItems = [
  { icon: Home, label: 'Inicio', href: '#' },
  { icon: Users, label: 'Aspirantes', href: '#aspirantes' },
  { icon: GraduationCap, label: 'Calificaciones', href: '#' },
  { icon: Settings, label: 'Configuración', href: '#' },
];

export const Sidebar = () => {
  return (
    <div className="bg-[#006837] text-white h-screen w-64 fixed left-0 top-0 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">SPOSTU</h1>
      </div>
      
      <nav className="flex-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center gap-3 p-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-sm text-white/70">{currentUser.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};