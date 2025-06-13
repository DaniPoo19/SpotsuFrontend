import React from 'react';
import { Mail, Phone, MapPin, Calendar, Camera, Edit2 } from 'lucide-react';
import { currentUser } from '../data';

export const ProfilePage = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-48 bg-[#006837]"></div>
          
          <div className="px-8 pb-8">
            <div className="relative -mt-20 mb-6">
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                  <Camera size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                <p className="text-gray-600">{currentUser.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors">
                <Edit2 size={18} />
                Editar Perfil
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Correo Electrónico</p>
                      <p className="font-medium">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">+57 300 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium">Montería, Colombia</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Registro</p>
                      <p className="font-medium">Enero 15, 2024</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Permisos del Sistema</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-[#006837] bg-opacity-10 text-[#006837] rounded-full text-sm">
                        Gestión de Aspirantes
                      </span>
                      <span className="px-3 py-1 bg-[#006837] bg-opacity-10 text-[#006837] rounded-full text-sm">
                        Evaluación Física
                      </span>
                      <span className="px-3 py-1 bg-[#006837] bg-opacity-10 text-[#006837] rounded-full text-sm">
                        Administración
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
              <div className="space-y-4">
                {[
                  { action: 'Evaluó al aspirante Ana García', time: 'Hace 2 horas' },
                  { action: 'Actualizó documentación de Carlos Rodríguez', time: 'Ayer' },
                  { action: 'Registró nuevo aspirante', time: 'Hace 2 días' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <p className="text-gray-600">{activity.action}</p>
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};