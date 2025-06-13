import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { postulationService } from '../../services/postulation.service';
import { PostulationDTO } from '../../types/dtos';
import { athletesService } from '../../services/athletes.service';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  AlertCircle,
  User,
  ClipboardList,
  Trophy,
  ChevronRight,
  Calendar,
  ArrowRight,
  XCircle
} from 'lucide-react';
import { parqService } from '../../services/parq.service';
import { api } from '../../services/api';

export const PostulationsPage = () => {
  const navigate = useNavigate();
  const { user, athlete, isAuthenticated, isLoading } = useAuth();
  const [postulations, setPostulations] = useState<PostulationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasActivePostulation, setHasActivePostulation] = useState(false);

  const loadPostulations = async () => {
    if (!user?.document_number) {
      toast.error('No se encontró la información del usuario');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const athlete = await athletesService.getAthleteByDocument(user.document_number);
      if (!athlete) {
        toast.error('No se encontró la información del atleta');
        navigate('/user-dashboard/postulations/new/personal-info');
        return;
      }

      // Obtener las postulaciones
      const data = await postulationService.getPostulationsByAthlete(athlete.id);

      // Verificar si existe una postulación para el semestre activo
      const semesterResponse = await api.get('/semesters/active');
      const activeSemester = semesterResponse.data?.data;

      if (activeSemester?.id) {
        const sameSemesterPostulation = data.find(p => p.semester?.id === activeSemester.id);
        setHasActivePostulation(!!sameSemesterPostulation);
      } else {
        // Si no se pudo obtener el semestre activo, mantener la lógica anterior (por compatibilidad)
        const activePost = data.find(p => p.status === 'active');
        setHasActivePostulation(!!activePost);
      }
      
      // Verificar el estado del PAR-Q para cada postulación
      const updatedPostulations = await Promise.all(data.map(async (post) => {
        const parqCompleted = await parqService.checkParQCompletion(post.id);
        return {
          ...post,
          par_q_completed: parqCompleted || post.par_q_completed
        };
      }));
      
      console.log('[Postulations PAR-Q Status]', updatedPostulations.map(post => ({
        postulationId: post.id,
        parqCompleted: post.par_q_completed,
        sportsHistoryCompleted: post.sports_history_completed,
        status: post.status
      })));

      setPostulations(updatedPostulations);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error('Error al cargar las postulaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && athlete) {
      loadPostulations();
    } else if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (!athlete) {
        navigate('/user-dashboard/postulations/new/personal-info');
      }
    }
  }, [isLoading, isAuthenticated, athlete, navigate]);

  const handleNewPostulation = async () => {
    try {
      setLoading(true);

      if (!athlete?.id) {
        toast.error('No se encontró la información del atleta');
        setLoading(false);
        return;
      }

      // 1. Obtener el semestre activo actual
      const semesterResponse = await api.get('/semesters/active');
      const activeSemester = semesterResponse.data?.data;

      if (!activeSemester?.id) {
        toast.error('No se pudo determinar el semestre activo');
        setLoading(false);
        return;
      }

      // 2. Verificar si ya existe una postulación para el semestre actual (sin importar el estado)
      const currentPostulations = await postulationService.getPostulationsByAthlete(athlete.id);
      const sameSemesterPostulation = currentPostulations.find(p => p.semester?.id === activeSemester.id);

      if (sameSemesterPostulation) {
        toast.error(`Ya existe una postulación para el semestre actual.`, {
          duration: 5000,
          icon: <XCircle className="w-5 h-5 text-red-500" />,
        });
        setHasActivePostulation(true);
        setLoading(false);
        return;
      }

      // 3. Crear una nueva postulación porque no existe una del mismo semestre
      const newPostulation = await postulationService.createPostulation();

      toast.success('Postulación creada exitosamente. Por favor, completa todos los pasos requeridos.', {
        duration: 4000
      });

      await loadPostulations(); // Recargar lista

      // Redirigir al detalle de la postulación recién creada
      navigate(`/user-dashboard/postulations/${newPostulation.id}`);
    } catch (error: any) {
      console.error('Error al crear postulación:', error);
      toast.error(error.message || 'No se pudo crear la postulación. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressSteps = (postulation: PostulationDTO) => {
    return [
      {
        name: 'Información Personal',
        description: 'Datos personales y de contacto',
        completed: true,
        icon: User
      },
      {
        name: 'Cuestionario PAR-Q',
        description: 'Evaluación de preparación física',
        completed: postulation.par_q_completed === true,
        icon: ClipboardList
      },
      {
        name: 'Historial Deportivo',
        description: 'Experiencia y logros deportivos',
        completed: (postulation.status === 'completed') || (postulation.sports_history_completed === true && postulation.par_q_completed === true),
        icon: Trophy
      }
    ];
  };

  const getProgressPercentage = (postulation: PostulationDTO) => {
    const steps = getProgressSteps(postulation);
    const completedSteps = steps.filter(step => step.completed === true).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getNextStep = (postulation: PostulationDTO) => {
    const steps = getProgressSteps(postulation);
    return steps.find(step => step.completed !== true) || steps[steps.length - 1];
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#006837]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative"
    >
      <div className="px-4 py-6 lg:py-8 lg:pl-72 lg:pr-6 max-w-[1600px] mx-auto transition-all duration-300">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-6 lg:mb-8 relative"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 font-sans tracking-tight mb-2">
                Mis Postulaciones
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-sans">
                  Gestiona tus postulaciones a programas deportivos
                </p>
                {lastUpdate && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      Actualizado: {lastUpdate.toLocaleString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadPostulations}
                      className="text-[#006837] hover:text-[#005229] flex items-center gap-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Actualizar</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
            <motion.button
              whileHover={hasActivePostulation ? {} : { scale: 1.02, backgroundColor: '#005229' }}
              whileTap={hasActivePostulation ? {} : { scale: 0.98 }}
              onClick={handleNewPostulation}
              className={`fixed bottom-6 right-6 sm:relative sm:bottom-auto sm:right-auto z-10 inline-flex items-center justify-center gap-2 font-sans text-sm sm:text-base font-semibold shadow-lg px-5 sm:px-6 py-3 rounded-full sm:rounded-xl transition-all ${
                hasActivePostulation 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#006837] hover:bg-[#005229] hover:shadow-xl'
              } text-white`}
              disabled={hasActivePostulation}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Postulación</span>
            </motion.button>
          </div>
        </motion.div>

        {postulations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 sm:p-8 lg:p-10 text-center max-w-2xl mx-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
              className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#006837] to-[#00a65a] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
            >
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 font-sans tracking-tight relative">
              No tienes postulaciones
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 font-sans max-w-md mx-auto relative">
              Comienza tu primera postulación para participar en nuestros programas deportivos
            </p>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#005229' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewPostulation}
              className="bg-[#006837] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-[#005229] transition-all inline-flex items-center gap-2 font-sans text-sm sm:text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl relative"
            >
              <Plus className="w-5 h-5" />
              Nueva Postulación
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {postulations.map((postulation, index) => {
                const progress = getProgressPercentage(postulation);
                const nextStep = getNextStep(postulation);
                const isCompleted = postulation.status === 'completed';
                const isCancelled = postulation.status === 'cancelled';
                const hasPositiveParQ = isCancelled;

                return (
                  <motion.div
                    key={postulation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                    className={`group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 sm:p-6 relative overflow-hidden ${
                      hasPositiveParQ ? 'border-2 border-red-300' : ''
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-sans tracking-tight mb-1.5">
                            Postulación {postulation.semester?.name || 'Sin semestre'}
                          </h3>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-sans">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(postulation.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-sans">
                              <User className="w-4 h-4" />
                              <span>
                                {postulation.athlete?.name || ''} {postulation.athlete?.last_name || ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.span 
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                            isCancelled ? 'bg-red-100 text-red-800' :
                            isCompleted ? 'bg-green-100 text-green-800' :
                            postulation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isCancelled ? 'Cancelada' :
                           isCompleted ? 'Completada' :
                           postulation.status === 'active' ? 'En Proceso' :
                           'Pendiente'}
                        </motion.span>
                      </div>

                      {isCancelled && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">
                            La postulación ha sido cancelada debido a una respuesta positiva en el cuestionario PAR-Q.
                          </p>
                        </div>
                      )}

                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 font-sans">Progreso</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 font-sans">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-1.5 ${
                              hasPositiveParQ 
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : 'bg-gradient-to-r from-[#006837] to-[#00a65a]'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-5">
                        {getProgressSteps(postulation).map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-2">
                            {step.completed === true ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            )}
                            <span className={`text-xs sm:text-sm ${step.completed === true ? 'text-gray-900' : 'text-gray-500'} font-sans truncate`}>
                              {step.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate(`/user-dashboard/postulations/${postulation.id}`)}
                        className="w-full bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 font-sans text-xs sm:text-sm font-medium border border-gray-200 relative hover:border-gray-300"
                      >
                        {isCompleted ? 'Ver Detalles' : 'Continuar Postulación'}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}; 