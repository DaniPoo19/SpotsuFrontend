import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { mockAspirants } from '../data';
import type { Aspirant } from '../types';

export const AspirantsList = ({ onAspirantClick }: { onAspirantClick: (id: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');

  const filteredAspirants = mockAspirants.filter(aspirant => {
    const matchesSearch = aspirant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aspirant.personalInfo.idNumber.includes(searchTerm);
    const matchesGender = !selectedGender || aspirant.gender === selectedGender;
    const matchesDiscipline = !selectedDiscipline || aspirant.discipline === selectedDiscipline;
    
    return matchesSearch && matchesGender && matchesDiscipline;
  });

  const disciplines = Array.from(new Set(mockAspirants.map(a => a.discipline)));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lista de Aspirantes</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              className="pl-10 pr-4 py-2 border rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-xl"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            <option value="">Todos los géneros</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
          <select
            className="px-4 py-2 border rounded-xl"
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
          >
            <option value="">Todas las disciplinas</option>
            {disciplines.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Disciplina</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nivel</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAspirants.map((aspirant) => (
              <tr key={aspirant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-gray-900">{aspirant.name}</div>
                      <div className="text-gray-500">{aspirant.personalInfo.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{aspirant.personalInfo.idType}</div>
                  <div className="text-sm text-gray-500">{aspirant.personalInfo.idNumber}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{aspirant.discipline}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{aspirant.level}</td>
                <td className="px-6 py-4">
                  {aspirant.documents.sportsCertificate && 
                   aspirant.documents.medicalCertificate && 
                   aspirant.documents.consentForm ? (
                    <span className="px-2 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                      Completo
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onAspirantClick(aspirant.id)}
                    className="text-[#006837] hover:text-[#A8D08D] font-medium"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};