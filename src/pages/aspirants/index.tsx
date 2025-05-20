import React, { useState, useEffect } from 'react';
import { Search, FileCheck, FileWarning, FileX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aspirantsService } from '../../services/aspirants.service';
import { AspirantDTO } from '../../types/dtos';

const FileStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'Completo':
      return (
        <span className="px-2 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full flex items-center gap-1">
          <FileCheck size={16} />
          Completo
        </span>
      );
    case 'Incompleto':
      return (
        <span className="px-2 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded-full flex items-center gap-1">
          <FileWarning size={16} />
          Incompleto
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full flex items-center gap-1">
          <FileX size={16} />
          Pendiente
        </span>
      );
  }
};

export const AspirantsPage = () => {
  const navigate = useNavigate();
  const [aspirants, setAspirants] = useState<AspirantDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAspirants();
  }, []);

  const loadAspirants = async () => {
    try {
      const data = await aspirantsService.getAll();
      setAspirants(data);
    } catch (error) {
      console.error('Error al cargar aspirantes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAspirants = aspirants.filter(aspirant => 
    aspirant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aspirant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aspirant.documentNumber.includes(searchTerm)
  );

  const handleViewDetails = (aspirant: AspirantDTO) => {
    navigate(`/dashboard/aspirants/${aspirant.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#006837] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#006837]">Lista de Aspirantes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o documento..."
            className="pl-10 pr-4 py-2 border rounded-xl w-80 focus:ring-2 focus:ring-[#006837] focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado Archivos</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado Calificación</th>
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
                      <div className="text-gray-500">{aspirant.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{aspirant.documentType}</div>
                  <div className="text-sm text-gray-500">{aspirant.documentNumber}</div>
                </td>
                <td className="px-6 py-4">
                  <FileStatusBadge status={aspirant.fileStatus} />
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                    aspirant.status === 'Aprobado' 
                      ? 'text-green-800 bg-green-100'
                      : aspirant.status === 'Rechazado'
                      ? 'text-red-800 bg-red-100'
                      : 'text-yellow-800 bg-yellow-100'
                  }`}>
                    {aspirant.qualification ? `${aspirant.qualification}/10` : aspirant.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDetails(aspirant)}
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