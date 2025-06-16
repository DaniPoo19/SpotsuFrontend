import React, { useEffect, useState } from 'react';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import { api } from '@/lib/axios';

type SortOrder = 'asc' | 'desc';

interface ReportRow {
  athlete_name: string;
  sports_score: number;
  morpho_score: number;
  total_score: number;
}

export const ReportsPage = () => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [semesterId, setSemesterId] = useState<string>('all');
  const [semesters, setSemesters] = useState<{id:string,name:string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const resp = await api.get('/semesters');
        const fetched = resp.data.data || [];
        setSemesters([{ id: 'all', name: 'Todos' }, ...fetched]);
      } catch (err) {
        console.error('Error cargando semestres', err);
      }
    };
    fetchSemesters();
  }, []);

  // Fetch report(s)
  useEffect(() => {
    if (!semesterId) return;
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        if (semesterId === 'all') {
          // gather all semesters
          const ids = semesters.filter(s=>s.id!=='all').map(s=>s.id);
          const list = await Promise.all(ids.map(async id => {
            try {
              const r = await api.get(`/postulations/report/${id}`);
              return r.data.data || r.data;
            } catch {
              return [];
            }
          }));
          setRows(([] as ReportRow[]).concat(...list));
        } else {
          const resp = await api.get(`/postulations/report/${semesterId}`);
          setRows(resp.data.data || resp.data);
        }
      } catch (err) {
        console.error('Error cargando reporte', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [semesterId, semesters]);

  const filtered = rows
    .filter(r => r.athlete_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=> sortOrder==='desc'? b.total_score - a.total_score : a.total_score - b.total_score);

  const maxScore = filtered.length ? Math.max(...filtered.map(r=>r.total_score)) : 1;

  const toggleSortOrder = () => setSortOrder(p=> p==='asc'?'desc':'asc');


  return (
    <div className="p-8">


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
              onChange={(e)=>setSemesterId(e.target.value)}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Calificación Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row,i) => (
                <tr key={row.athlete_name+'-'+i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{row.athlete_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                        <div className="bg-[#006837] h-2" style={{ width: `${((row.sports_score / maxScore) * 100).toFixed(2)}%` }} />
                      </div>
                      <span className="text-sm font-medium">{row.sports_score.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2 overflow-hidden">
                        <div className="bg-[#A8D08D] h-2" style={{ width: `${((row.morpho_score / maxScore) * 100).toFixed(2)}%` }} />
                      </div>
                      <span className="text-sm font-medium">{row.morpho_score.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{row.total_score.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};