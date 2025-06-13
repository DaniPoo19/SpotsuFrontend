import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { aspirantsService } from '@/services/aspirants.service';
import { sportsService } from '@/services/sports.service';
import { athletesService } from '@/services/athletes.service';
import { AspirantDTO } from '@/types/dtos';
import { Aspirant } from '@/types';

export const AspirantsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [aspirants, setAspirants] = useState<Aspirant[]>([]);
  const [postulationStatuses, setPostulationStatuses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [disciplines, setDisciplines] = useState<string[]>([]);

  const abbreviateDocumentType = (docType: string): string => {
    if (!docType) return 'CC';
    const upper = docType.toUpperCase();
    if (upper.startsWith('C')) return 'CC';
    if (upper.startsWith('T')) return 'TI';
    if (upper.startsWith('P')) return 'PP';
    return upper.slice(0, 2);
  };

  const mapDTOToAspirant = (dto: AspirantDTO): Aspirant => ({
    id: dto.id,
    name: dto.name,
    gender: (dto.gender?.toLowerCase() === 'female' || dto.gender?.startsWith('F')) ? 'female' : 'male',
    discipline: dto.discipline || '',
    documents: dto.documents,
    evaluated: dto.qualification !== null,
    sportsHistory: dto.sportHistories?.map(h => ({
      sport: h.sport?.name || '',
      years: 0,
      level: h.status as any,
      competition: '',
      certificate: undefined,
      approved: undefined
    })) || [],
    personalInfo: {
      email: dto.email,
      phone: dto.phone || '',
      emergencyPhone: '',
      birthDate: dto.birthDate || '',
      address: dto.address || '',
      city: dto.city || '',
      state: dto.state || '',
      country: dto.country || '',
      idType: abbreviateDocumentType(dto.documentType) as any,
      idNumber: dto.documentNumber,
    },
  });

  const loadPostulationStatuses = async (aspList: Aspirant[]) => {
    const statusEntries = await Promise.all(
      aspList.map(async (a) => {
        try {
          const postulations = await athletesService.getPostulations(a.id);
          const active = postulations.find((p: any) => p.status !== undefined);
          return [a.id, active?.status ?? 'Sin Postulación'];
        } catch (_) {
          return [a.id, 'Sin Postulación'];
        }
      })
    );
    setPostulationStatuses(Object.fromEntries(statusEntries));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ items }, sports] = await Promise.all([
          aspirantsService.getAll(1, 100),
          sportsService.getSports()
        ]);

        const mappedAspirants = items.map(mapDTOToAspirant);
        setAspirants(mappedAspirants);
        setDisciplines(sports.map(s => s.name));

        // Cargar estados en segundo plano para mejorar tiempo inicial
        loadPostulationStatuses(mappedAspirants);
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar aspirantes o disciplinas, usando datos mock:', error);
      }
    };

    fetchData();
  }, []);

  const filteredAspirants = aspirants.filter((aspirant: Aspirant) => {
    const matchesSearch = aspirant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aspirant.personalInfo.idNumber.includes(searchTerm);
    const matchesGender = !selectedGender || aspirant.gender === selectedGender;
    const matchesDiscipline = !selectedDiscipline || aspirant.discipline === selectedDiscipline;
    
    return matchesSearch && matchesGender && matchesDiscipline;
  });

  const disciplineOptions = disciplines.length ? disciplines : Array.from(new Set(aspirants.map((a: Aspirant) => a.discipline)));

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              className="pl-10 pr-4 py-2 w-full border rounded-xl"
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
            {disciplineOptions.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">Cargando...</div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Disciplina</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Postulación</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Calificación</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAspirants.map((aspirant: Aspirant) => (
              <tr key={aspirant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-gray-900">{aspirant.name}</div>
                      <div className="text-gray-500">{aspirant.personalInfo.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {aspirant.personalInfo.idType} {aspirant.personalInfo.idNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{aspirant.discipline}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const rawStatus = postulationStatuses[aspirant.id] || 'Sin Postulación';
                    let label = rawStatus;
                    let color = 'bg-gray-100 text-gray-800';

                    switch (rawStatus) {
                      case 'parq_completed':
                        label = 'Falta Historial Deportivo';
                        color = 'bg-yellow-100 text-yellow-800';
                        break;
                      case 'completed':
                        label = 'Completado';
                        color = 'bg-green-100 text-green-800';
                        break;
                      case 'cancelled':
                      case 'Cancelada':
                      case 'Cancelled':
                        label = 'Cancelada';
                        color = 'bg-red-100 text-red-800';
                        break;
                      case 'Sin Postulación':
                        color = 'bg-orange-100 text-orange-800';
                        break;
                      default:
                        label = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
                        color = 'bg-blue-100 text-blue-800';
                    }
                    return (
                      <span className={`px-2 py-1 text-sm font-semibold rounded-full ${color}`}>
                        {label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                    aspirant.evaluated
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {aspirant.evaluated ? 'Calificado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/dashboard/aspirants/${aspirant.id}`)}
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
      )}
    </div>
  );
};