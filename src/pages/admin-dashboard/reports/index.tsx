import React, { useEffect, useState } from 'react';
import { Search, ArrowUpDown, Download, FileDown } from 'lucide-react';
import { api } from '@/lib/axios';
import { reportsService } from '@/services/reports.service';
import toast from 'react-hot-toast';

type SortOrder = 'asc' | 'desc';

interface ReportRow {
  athlete_name: string;
  sports_score: number;
  morpho_score: number;
  total_score: number;
}

export const ReportsPage = () => {
  const [semesterId, setSemesterId] = useState<string>('all');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch list of semesters (simple)
  const [semesters, setSemesters] = useState<{id:string,name:string}[]>([]);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const resp = await api.get('/semesters');
        const fetched = resp.data.data || [];
        // Agregar opción "Todos" al inicio
        const allOption = { id: 'all', name: 'Todos' } as { id: string; name: string };
        setSemesters([allOption, ...fetched]);
        if (!semesterId && resp.data.data?.length) {
          setSemesterId(resp.data.data[0].id);
        }
      } catch (err) {
        console.error('Error cargando semestres', err);
      }
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!semesterId) return;
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        if (semesterId === 'all') {
          // Obtener reportes de todos los semestres en paralelo
          const semesterIds = semesters.filter(s => s.id !== 'all').map(s => s.id);
          const results = await Promise.all(
            semesterIds.map(async id => {
              try {
                const r = await api.get(`/postulations/report/${id}`);
                console.log(`[Reports] Datos crudos del semestre ${id}:`, r.data);
                
                const reportData = r.data.data || r.data;
                let data: ReportRow[] = [];
                
                if (Array.isArray(reportData)) {
                  data = reportData;
                } else if (reportData && Array.isArray(reportData.data)) {
                  data = reportData.data;
                } else {
                  console.warn(`[Reports] Formato de datos inesperado para semestre ${id}:`, reportData);
                  data = [];
                }
                
                console.log(`[Reports] Datos procesados del semestre ${id}:`, data);
                return data;
              } catch (err) {
                console.error(`[Reports] Error obteniendo datos del semestre ${id}:`, err);
                return [];
              }
            })
          );
          // Flatten array y eliminar duplicados por nombre
          const merged: ReportRow[] = ([] as ReportRow[]).concat(...results);
          console.log('[Reports] Datos combinados detallados:', merged.map((row: ReportRow) => ({
            nombre: row.athlete_name,
            sports_score: row.sports_score,
            morpho_score: row.morpho_score,
            total_score: row.total_score
          })));
          setRows(merged);
        } else {
          const resp = await api.get(`/postulations/report/${semesterId}`);
          console.log(`[Reports] Respuesta completa del servidor para semestre ${semesterId}:`, resp.data);
          
          // El backend devuelve: { status: 'success', message: '...', data: { data: [...], pdfDefinition: {...} } }
          const reportData = resp.data.data || resp.data;
          let incoming: ReportRow[] = [];
          
          if (Array.isArray(reportData)) {
            // Si data es directamente un array
            incoming = reportData;
          } else if (reportData && Array.isArray(reportData.data)) {
            // Si data contiene un objeto con propiedad data que es array
            incoming = reportData.data;
          } else {
            console.warn('[Reports] Formato de datos inesperado:', reportData);
            incoming = [];
          }
          
          console.log(`[Reports] Datos procesados del semestre ${semesterId}:`, incoming.map((row: ReportRow) => ({
            nombre: row.athlete_name,
            sports_score: row.sports_score,
            morpho_score: row.morpho_score,
            total_score: row.total_score
          })));
          setRows(incoming);
        }
      } catch (err) {
        console.error('Error cargando reporte', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [semesterId, semesters]);

  const filtered = (rows || [])
    .filter(r => r?.athlete_name?.toLowerCase()?.includes(search.toLowerCase()) ?? false)
    .sort((a,b)=> sortOrder==='desc'? (b.total_score || 0) - (a.total_score || 0) : (a.total_score || 0) - (b.total_score || 0));

  // Puntajes máximos para escalar barras por separado
  const maxSports = filtered.length ? Math.max(...filtered.map(r => r?.sports_score || 0)) : 1;
  const maxMorpho = filtered.length ? Math.max(...filtered.map(r => r?.morpho_score || 0)) : 1;

  const toggleSortOrder = () => setSortOrder(p=> p==='asc'?'desc':'asc');

  const handleDownloadPDF = async () => {
    if (!semesterId) {
      toast.error('Por favor selecciona un semestre para descargar el reporte');
      return;
    }

    setIsDownloading(true);
    try {
      if (semesterId === 'all') {
        // Para reporte combinado de todos los semestres
        const semesterIds = semesters.filter(s => s.id !== 'all').map(s => s.id);
        const semesterNames = semesters.filter(s => s.id !== 'all').map(s => s.name);
        
        await reportsService.downloadCombinedReportPDF(semesterIds, semesterNames);
        toast.success('Reporte combinado descargado exitosamente');
      } else {
        // Para un semestre específico
        const selectedSemester = semesters.find(s => s.id === semesterId);
        const semesterName = selectedSemester?.name || 'Semestre';
        
        await reportsService.downloadReportPDF(semesterId, semesterName);
        toast.success('Reporte descargado exitosamente');
      }
    } catch (error) {
      console.error('Error descargando reporte:', error);
      toast.error('Error al descargar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Postulaciones</h1>
          <p className="text-gray-600 mt-1">Visualiza y descarga reportes de evaluación por semestre</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading || !semesterId}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            !semesterId || isDownloading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#006837] text-white hover:bg-[#005828] shadow-lg hover:shadow-xl'
          }`}
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <FileDown size={20} />
              Descargar PDF
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="pl-10 pr-4 py-2 w-full border rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-xl"
              value={semesterId}
              onChange={(e)=> setSemesterId(e.target.value)}
            >
              {semesters.map(s=> (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50"
            >
              <ArrowUpDown size={20} />
              {sortOrder === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Posición</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Logros Deportivos (40%)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Valoración Morfofuncional (60%)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Calificación Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[#006837] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-500">Cargando reportes...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-gray-500 text-lg mb-2">No hay datos disponibles</p>
                      <p className="text-gray-400 text-sm">
                        {search ? 'No se encontraron resultados para tu búsqueda' : 'No hay postulaciones para mostrar'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row,i) => (
                <tr key={row?.athlete_name || `row-${i}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">
                    {i+1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{row?.athlete_name || 'Nombre no disponible'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                        <div
                          className="bg-[#006837] h-2"
                          style={{ width: `${(((row?.sports_score || 0) / maxSports) * 100).toFixed(2)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(row?.sports_score || 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                        <div
                          className="bg-[#A8D08D] h-2"
                          style={{ width: `${(((row?.morpho_score || 0) / maxMorpho) * 100).toFixed(2)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(row?.morpho_score || 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{(row?.total_score || 0).toFixed(2)}</span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};