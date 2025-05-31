import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trophy, Calendar, FileText, 
  ChevronDown, LogOut, User, Settings,
  BarChart2, Activity, Award, BookOpen,
  Loader2, Search, Medal
} from 'lucide-react';
import { DashboardStats } from './components/DashboardStats';
import { DisciplineChart } from './components/DisciplineChart';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { toast } from 'sonner';

// Datos simulados para las métricas
const mockData = {
  totalDeportistas: 156,
  deportesActivos: 12,
  documentosPendientes: 23,
  logrosRecientes: [
    { deportista: 'Juan Pérez', deporte: 'Fútbol', logro: 'Campeonato Regional' },
    { deportista: 'María García', deporte: 'Natación', logro: 'Medalla de Oro' },
    { deportista: 'Carlos López', deporte: 'Atletismo', logro: 'Récord Departamental' }
  ],
  eventosProximos: [
    { nombre: 'Torneo Interuniversitario', fecha: '2024-03-15', deporte: 'Fútbol' },
    { nombre: 'Campeonato Nacional', fecha: '2024-04-01', deporte: 'Baloncesto' },
    { nombre: 'Competencia Regional', fecha: '2024-03-20', deporte: 'Atletismo' }
  ]
};

interface Postulation {
  id: string;
  athlete: {
    id: string;
    person: {
      full_name: string;
      document_number: string;
    };
  };
  status: string;
  postulation_sports: {
    id: string;
    sport: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
  semester: {
    id: string;
    name: string;
  };
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [postulations, setPostulations] = useState<Postulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadPostulations = async () => {
      try {
        // Obtener el semestre actual (esto debería venir de un contexto o estado global)
        const currentSemesterId = '1'; // Esto debería ser dinámico
        const response = await api.get(`/postulations/semester/${currentSemesterId}`);
        console.log('Respuesta de postulaciones:', response.data);
        if (response.data && response.data.data) {
          setPostulations(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar postulaciones:', error);
        toast.error('Error al cargar la lista de aspirantes');
        setPostulations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPostulations();
  }, []);

  const filteredPostulations = postulations.filter(postulation =>
    postulation.athlete.person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    postulation.athlete.person.document_number.includes(searchTerm)
  );

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#006837]" />
          <p className="text-gray-600">Cargando aspirantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg"
      >
        <div className="p-6">
          <img 
            src="/logo-universidad-cordoba.png" 
            alt="Universidad de Córdoba" 
            className="w-40 mx-auto mb-8"
          />
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#006837] bg-[#006837] bg-opacity-10 rounded-lg">
              <BarChart2 size={20} />
              <span>Panel de Control</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Users size={20} />
              <span>Deportistas</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Trophy size={20} />
              <span>Logros</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Calendar size={20} />
              <span>Eventos</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
              <FileText size={20} />
              <span>Documentos</span>
            </a>
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#006837] bg-opacity-10 flex items-center justify-center">
                  <User size={20} className="text-[#006837]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Admin</p>
                  <p className="text-sm text-gray-500">Administrador</p>
                </div>
              </div>
              <ChevronDown size={20} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border"
                >
                  <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50">
                    <Settings size={18} />
                    <span>Configuración</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50">
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deportistas</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.totalDeportistas}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <Activity size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deportes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.deportesActivos}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50">
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Eventos Próximos</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.eventosProximos.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-50">
                  <FileText size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documentos Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{mockData.documentosPendientes}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">Distribución por Disciplina</h3>
              <DisciplineChart />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-4">Logros Recientes</h3>
              <div className="space-y-4">
                {mockData.logrosRecientes.map((logro, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                      <Award size={20} className="text-[#006837]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{logro.deportista}</p>
                      <p className="text-sm text-gray-500">{logro.deporte} - {logro.logro}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-white p-6 rounded-xl shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4">Eventos Próximos</h3>
            <div className="space-y-4">
              {mockData.eventosProximos.map((evento, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                      <Calendar size={20} className="text-[#006837]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{evento.nombre}</p>
                      <p className="text-sm text-gray-500">{evento.deporte}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#006837]">
                      {new Date(evento.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center text-sm text-gray-500"
          >
            <p>© {new Date().getFullYear()} Universidad de Córdoba. Todos los derechos reservados.</p>
          </motion.div>

          {/* Lista de Aspirantes */}
          <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Lista de Aspirantes</h3>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Aspirante</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Deportes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Semestre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPostulations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No se encontraron aspirantes
                      </td>
                    </tr>
                  ) : (
                    filteredPostulations.map((postulation) => (
                      <motion.tr
                        key={postulation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/postulation/${postulation.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-[#006837] bg-opacity-10">
                              <User size={20} className="text-[#006837]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{postulation.athlete.person.full_name}</p>
                              <p className="text-sm text-gray-500">Doc: {postulation.athlete.person.document_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {postulation.postulation_sports.length === 0 ? (
                              <span className="text-sm text-gray-500">Sin deportes registrados</span>
                            ) : (
                              postulation.postulation_sports.map((sport) => (
                                <span
                                  key={sport.id}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#006837] bg-opacity-10 text-[#006837]"
                                >
                                  <Medal size={16} className="mr-1" />
                                  {sport.sport.name}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(postulation.status)}`}>
                            <Award size={16} className="mr-1" />
                            {postulation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {postulation.semester?.name || 'No especificado'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(postulation.created_at)}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};