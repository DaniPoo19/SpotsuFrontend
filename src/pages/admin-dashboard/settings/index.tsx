import React from 'react';
import { Settings, Bell, Shield, Key, HelpCircle } from 'lucide-react';

const settingsGroups = [
  {
    title: 'General',
    icon: Settings,
    items: [
      { label: 'Idioma', description: 'Español' },
      { label: 'Zona Horaria', description: 'UTC-5 Bogotá' },
      { label: 'Tema', description: 'Claro' }
    ]
  },
  {
    title: 'Notificaciones',
    icon: Bell,
    items: [
      { label: 'Correo Electrónico', description: 'Activado' },
      { label: 'Notificaciones Push', description: 'Desactivado' }
    ]
  },
  {
    title: 'Seguridad',
    icon: Shield,
    items: [
      { label: 'Autenticación de dos factores', description: 'Desactivado' },
      { label: 'Sesiones activas', description: '1 dispositivo' }
    ]
  }
];

export const SettingsPage = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Configuración</h2>
      
      <div className="grid gap-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                <group.icon size={24} className="text-[#006837]" />
              </div>
              <h3 className="text-xl font-semibold">{group.title}</h3>
            </div>
            
            <div className="space-y-4">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <button className="text-[#006837] hover:text-[#A8D08D] transition-colors">
                    Cambiar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-100">
              <Key size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-600">Zona de Peligro</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="font-medium text-red-700">Eliminar Cuenta</p>
              <p className="text-sm text-red-600">Esta acción es irreversible</p>
              <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <HelpCircle size={20} />
            <span>Centro de Ayuda</span>
          </button>
        </div>
      </div>
    </div>
  );
};