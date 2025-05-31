import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, FileCheck, FileWarning, FileX, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aspirantsService } from '../../services/aspirants.service';
import { AspirantDTO } from '../../types/dtos';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export const AspirantsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [aspirants, setAspirants] = useState<AspirantDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadAspirants = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingMore(true);
      const data = await aspirantsService.getAll(page, ITEMS_PER_PAGE);
      setAspirants(prev => page === 1 ? data.items : [...prev, ...data.items]);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error al cargar aspirantes:', error);
      toast.error('Error al cargar la lista de aspirantes');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadAspirants(currentPage);
  }, [currentPage, loadAspirants]);

  const filteredAspirants = useMemo(() => {
    return aspirants.filter(aspirant => {
      const matchesSearch = 
        aspirant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aspirant.documentNumber.includes(searchTerm);
      
      const matchesDiscipline = !selectedDiscipline || 
        aspirant.discipline === selectedDiscipline;
      
      return matchesSearch && matchesDiscipline;
    });
  }, [aspirants, searchTerm, selectedDiscipline]);

  const disciplines = useMemo(() => {
    return Array.from(new Set(
      aspirants
        .map(aspirant => aspirant.discipline)
        .filter((discipline): discipline is string => discipline !== null)
    ));
  }, [aspirants]);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getFileStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completo':
        return <FileCheck className="text-green-500" />;
      case 'Incompleto':
        return <FileWarning className="text-yellow-500" />;
      case 'Pendiente':
        return <FileX className="text-red-500" />;
      default:
        return <FileX className="text-gray-500" />;
    }
  }, []);

  const handleViewDetails = useCallback((aspirant: AspirantDTO) => {
    navigate(`/dashboard/aspirants/${aspirant.id}`);
  }, [navigate]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isLoadingMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages, isLoadingMore]);

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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Disciplina</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Archivos</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAspirants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron aspirantes
                </td>
              </tr>
            ) : (
              filteredAspirants.map((aspirant) => (
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
                    <div className="text-sm text-gray-900">{aspirant.documentNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#006837] bg-opacity-10 text-[#006837]">
                      {aspirant.discipline || 'Sin disciplina'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(aspirant.status)}`}>
                      {aspirant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getFileStatusIcon(aspirant.fileStatus)}
                      <span className="ml-2 text-sm text-gray-600">{aspirant.fileStatus}</span>
                    </div>
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
              ))
            )}
          </tbody>
        </table>
        
        {currentPage < totalPages && (
          <div className="px-6 py-4 border-t">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-2 text-[#006837] hover:text-[#A8D08D] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#006837]"></div>
                  Cargando...
                </>
              ) : (
                <>
                  Cargar más
                  <ChevronDown size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};