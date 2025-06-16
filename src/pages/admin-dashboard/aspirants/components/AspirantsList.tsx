import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { mockAspirants } from '../../data';
import { aspirantsService } from '@/services/aspirants.service';
import { sportsService } from '@/services/sports.service';
import { AspirantDTO } from '@/types/dtos';
import { Aspirant } from '@/types';
import { AspirantStatus } from '../../components/common/AspirantStatus';
import { athletesService } from '@/services/athletes.service';

export const AspirantsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [aspirants, setAspirants] = useState<Aspirant[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [postulationStatuses, setPostulationStatuses] = useState<Record<string, string>>({});
  const [aspirantSemesters, setAspirantSemesters] = useState<Record<string, string>>({});
  const [aspirantSports, setAspirantSports] = useState<Record<string, string>>({});
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchStatusesFor = async (aspList: Aspirant[]) => {
    const entries = await Promise.all(
      aspList.map(async (a) => {
        try {
          const fetched = await athletesService.getPostulations(a.id);
          const posts = (fetched || []).sort((p1: any, p2: any) => {
            const d1 = new Date(p1.createdAt || p1.created_at || 0).getTime();
            const d2 = new Date(p2.createdAt || p2.created_at || 0).getTime();
            return d2 - d1;
          });
          const active = posts.find((p: any) => ['active','pending','parq_completed'].includes(p.status));
          const rawStatus = active?.status ?? (posts[0]?.status ?? 'Sin Postulación');

          const mapStatusToLabel = (st: string) => {
            switch (st) {
              case 'parq_completed':
                return 'Falta Historial Deportivo';
              case 'active':
              case 'pending':
              case 'Pendiente':
              case 'Active':
                return 'En Proceso';
              case 'completed':
                return 'Completado';
              case 'cancelled':
              case 'Cancelada':
              case 'Cancelled':
                return 'Cancelada';
              case 'Sin Postulación':
                return 'Sin Postulación';
              default:
                return st.charAt(0).toUpperCase() + st.slice(1);
            }
          };

          const statusLabel = mapStatusToLabel(rawStatus);

          const rawSem = (active as any)?.semester?.name || (posts[0] as any)?.semester?.name || '';
          const match = rawSem.match(/(\d{4}-\d)/);
          const semesterName = match ? match[1] : rawSem || 'N/A';

          // deportes asociados (postulation_sports)
          const ps = (active as any)?.postulation_sports || (posts[0] as any)?.postulation_sports || [];
          const sportNames = Array.isArray(ps)
            ? Array.from(new Set(ps.map((psItem: any) => psItem?.sport?.name || '').filter(Boolean)))
            : [];
          const sportsLabel = sportNames.length ? sportNames.join(', ') : 'Sin deporte';

          return [a.id, { status: statusLabel, semester: semesterName, sports: sportsLabel }];
        } catch {
          return [a.id, 'Sin Postulación'];
        }
      })
    );
    const statusMap: Record<string,string> = {};
    const semesterMap: Record<string,string> = {};
    const sportsMap: Record<string,string> = {};
    entries.forEach(([id, obj]: any) => {
      if (typeof obj === 'string') {
        statusMap[id] = obj;
      } else {
        statusMap[id] = obj.status;
        semesterMap[id] = obj.semester;
        sportsMap[id] = obj.sports;
      }
    });
    setPostulationStatuses(statusMap);
    setAspirantSemesters(semesterMap);
    setAspirantSports(sportsMap);
    setIsLoading(false);
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

        // esperar a los estados antes de quitar loader para evitar parpadeo
        await fetchStatusesFor(mappedAspirants);
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
    const sportLabel = aspirantSports[aspirant.id] || aspirant.discipline || 'Sin deporte';
    const matchesDiscipline = !selectedDiscipline || sportLabel.split(',').map(s=>s.trim()).includes(selectedDiscipline);
    const matchesSemester = !selectedSemester || aspirantSemesters[aspirant.id] === selectedSemester;
    const matchesStatus = !selectedStatusFilter || postulationStatuses[aspirant.id] === selectedStatusFilter;
    
    return matchesSearch && matchesGender && matchesDiscipline && matchesSemester && matchesStatus;
  });

  const disciplineOptions = Array.from(new Set(Object.values(aspirantSports).flatMap(label => (label||'').split(',').map(s=>s.trim())).filter(v=>v && v!=='Sin deporte')));
  const semesterOptions = Array.from(new Set(Object.values(aspirantSemesters).filter(Boolean)));
  const statusOptions = Array.from(new Set(Object.values(postulationStatuses).filter(Boolean)));

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
          <select
            className="px-4 py-2 border rounded-xl"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Todos los semestres</option>
            {semesterOptions.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 border rounded-xl"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {statusOptions.map(stat => (
              <option key={stat} value={stat}>{stat}</option>
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Semestre</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
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
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{aspirant.personalInfo.idType}</div>
                  <div className="text-sm text-gray-500">{aspirant.personalInfo.idNumber}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{aspirantSports[aspirant.id] || aspirant.discipline || 'Sin deporte'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{aspirantSemesters[aspirant.id] || '…'}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const label = postulationStatuses[aspirant.id];
                    if (!label) {
                      return (<span className="text-gray-400 text-sm">…</span>);
                    }
                    let color = 'bg-gray-100 text-gray-800';

                    switch (label) {
                      case 'Falta Historial Deportivo':
                        color = 'bg-yellow-100 text-yellow-800';
                        break;
                      case 'En Proceso':
                        color = 'bg-blue-100 text-blue-800';
                        break;
                      case 'Completado':
                        color = 'bg-green-100 text-green-800';
                        break;
                      case 'Cancelada':
                        color = 'bg-red-100 text-red-800';
                        break;
                      case 'Sin Postulación':
                        color = 'bg-orange-100 text-orange-800';
                        break;
                      default:
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
                  {postulationStatuses[aspirant.id] && postulationStatuses[aspirant.id] !== 'Sin Postulación' ? (
                    <button
                      onClick={() => navigate(`/dashboard/aspirants/${aspirant.id}`)}
                      className="text-[#006837] hover:text-[#A8D08D] font-medium"
                    >
                      Ver detalles
                    </button>
                  ) : (
                    <button
                      disabled
                      className="text-gray-400 cursor-not-allowed font-medium"
                      title="El aspirante aún no tiene postulación registrada"
                    >
                      Ver detalles
                    </button>
                  )}
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