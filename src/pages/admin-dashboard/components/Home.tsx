import React from 'react';
import { ArrowRight } from 'lucide-react';

export const Home = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600"
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