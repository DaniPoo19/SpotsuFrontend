import React, { useState, useEffect } from 'react';
import { Search, Filter, Medal, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/axios';
import { toast } from 'sonner';

interface Athlete {
  id: string;
  person: {
    full_name: string;
    document_number: string;
    email: string;
  };
  sport_histories: {
    id: string;
    sport: {
      id: string;
      name: string;
    };
    status: string;
  }[];
  created_at: string;
}

export const AspirantsList = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        const response = await api.get('/athletes');
        console.log('Respuesta de atletas:', response.data);
        if (response.data && response.data.data) {
          setAthletes(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar atletas:', error);
        toast.error('Error al cargar la lista de aspirantes');
        setAthletes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAthletes();
  }, []);

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = 
      athlete.person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.person.document_number.includes(searchTerm);
    
    const matchesDiscipline = !selectedDiscipline || 
      athlete.sport_histories.some(history => history.sport.name === selectedDiscipline);
    
    return matchesSearch && matchesDiscipline;
  });

  // Obtener todas las disciplinas únicas
  const disciplines = Array.from(new Set(
    athletes.flatMap(athlete => 
      athlete.sport_histories.map(history => history.sport.name)
    )
  ));

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en revisión':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (athlete: Athlete) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/dashboard/aspirants/${athlete.id}`);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lista de Aspirantes</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              className="pl-10 pr-4 py-2 border rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Aspirante</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Documento</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Disciplinas</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAthletes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron aspirantes
                </td>
              </tr>
            ) : (
              filteredAthletes.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">{athlete.person.full_name}</div>
                        <div className="text-gray-500">{athlete.person.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{athlete.person.document_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {athlete.sport_histories.map((history) => (
                        <span 
                          key={history.id} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#006837] bg-opacity-10 text-[#006837]"
                        >
                          <Medal size={16} className="mr-1" />
                          {history.sport.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(athlete.sport_histories[0]?.status || 'pendiente')}`}>
                      <Award size={16} className="mr-1" />
                      {athlete.sport_histories[0]?.status || 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(athlete)}
                      className="text-[#006837] hover:text-[#A8D08D] font-medium"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};