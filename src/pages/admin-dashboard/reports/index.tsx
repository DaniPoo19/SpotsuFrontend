import React, { useState } from 'react';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import { mockAspirants } from '../data';

type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'male' | 'female';

interface EvaluatedAspirant {
  id: string;
  name: string;
  gender: string;
  discipline: string;
  sportsScore: number;
  morphoScore: number;
  finalScore: number;
}

const calculateScores = (aspirant: any): EvaluatedAspirant => {
  // Simulated score calculations
  const sportsScore = Math.random() * 5 + 5; // Random score between 5-10
  const morphoScore = Math.random() * 5 + 5;
  const finalScore = (sportsScore * 0.4) + (morphoScore * 0.6); // 40% sports, 60% morpho

  return {
    id: aspirant.id,
    name: aspirant.name,
    gender: aspirant.gender,
    discipline: aspirant.discipline,
    sportsScore: Number(sportsScore.toFixed(2)),
    morphoScore: Number(morphoScore.toFixed(2)),
    finalScore: Number(finalScore.toFixed(2))
  };
};

export const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [disciplineFilter, setDisciplineFilter] = useState('');

  // Generate evaluated aspirants with scores
  const evaluatedAspirants = mockAspirants
    .map(calculateScores)
    .sort((a, b) => sortOrder === 'desc' ? b.finalScore - a.finalScore : a.finalScore - b.finalScore);

  const disciplines = Array.from(new Set(mockAspirants.map(a => a.discipline)));

  const filteredAspirants = evaluatedAspirants.filter(aspirant => {
    const matchesSearch = aspirant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterType === 'all' || aspirant.gender === filterType;
    const matchesDiscipline = !disciplineFilter || aspirant.discipline === disciplineFilter;
    return matchesSearch && matchesGender && matchesDiscipline;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reporte de Evaluaciones</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors"
        >
          <Download size={20} />
          Exportar PDF
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-xl"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              <option value="all">Todos los géneros</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
            </select>
            <select
              className="px-4 py-2 border rounded-xl"
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
            >
              <option value="">Todas las disciplinas</option>
              {disciplines.map(discipline => (
                <option key={discipline} value={discipline}>{discipline}</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Disciplina</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Logros Deportivos (40%)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Valoración Morfofuncional (60%)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Calificación Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAspirants.map((aspirant) => (
                <tr key={aspirant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{aspirant.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{aspirant.discipline}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-[#006837] h-2 rounded-full"
                          style={{ width: `${(aspirant.sportsScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{aspirant.sportsScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-[#A8D08D] h-2 rounded-full"
                          style={{ width: `${(aspirant.morphoScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{aspirant.morphoScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      aspirant.finalScore >= 7
                        ? 'bg-green-100 text-green-800'
                        : aspirant.finalScore >= 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {aspirant.finalScore}
                    </span>
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