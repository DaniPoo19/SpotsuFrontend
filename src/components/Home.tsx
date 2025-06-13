import React from 'react';
import { ArrowRight } from 'lucide-react';
import admin from '@/assets/adminsitrativo.jpg';

export const Home = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src="adminsitrativo.jpg"
            alt="Sports"
            className="w-full h-64 object-cover"
          />
          <div className="p-8">
            <h1 className="text-4xl font-bold text-[#006837] mb-4">
              Bienvenido a SPOSTU
            </h1>
            <p className="text-gray-600 mb-6">
              Sistema de gestión deportiva universitaria para el seguimiento y evaluación
              de aspirantes deportistas.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="#panel"
                className="bg-[#006837] text-white p-6 rounded-xl hover:bg-[#005828] transition-colors"
              >
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  Panel de Control <ArrowRight size={20} />
                </h3>
                <p>Accede a las estadísticas y métricas principales del sistema.</p>
              </a>
              <a
                href="#aspirantes"
                className="bg-[#A8D08D] text-[#006837] p-6 rounded-xl hover:bg-[#97c077] transition-colors"
              >
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  Gestión de Aspirantes <ArrowRight size={20} />
                </h3>
                <p>Administra y revisa la información de los aspirantes registrados.</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};