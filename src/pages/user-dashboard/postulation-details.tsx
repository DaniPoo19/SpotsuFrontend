import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { postulationService } from '../../services/postulation.service';
import { PostulationDTO } from '../../types/dtos';
import { useAuth } from '@/contexts/AuthContext';
import { parqService } from '../../services/parq.service';
import { 
  FileText, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  Clock, 
  AlertCircle,
  ChevronRight,
  User,
  ClipboardList,
  Trophy,
  Calendar,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { api } from '../../services/api';

interface ProgressStep {
  name: string;
  description: string;
  completed: boolean;
  icon: LucideIcon;
  path: string;
  requiresAthlete: boolean;
  clickable: boolean;
}

export const PostulationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { athlete, user } = useAuth();
  const [postulation, setPostulation] = useState<PostulationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasPositiveParQ, setHasPositiveParQ] = useState(false);

  const loadPostulation = async () => {
    try {
      if (!id) {
        throw new Error('No se encontró el ID de la postulación');
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      if (id === 'new') {
        const { postulation: activePost, existed } = await postulationService.getOrCreateActivePostulation();
        setPostulation(activePost);
        setLastUpdate(new Date());
        if (existed) {
          toast('Ya existe una postulación activa para el semestre actual', { icon: 'ℹ️' });
          navigate('/user-dashboard/postulations');
          return;
        }
        toast.success('Postulación creada con éxito');
        navigate(`/user-dashboard/postulations/${activePost.id}`);
        return;
      }

      const existingPostulation = await postulationService.getPostulationById(id);
      if (!existingPostulation) {
        throw new Error('No se encontró la postulación');
      }

      // Verificar el estado del PAR-Q (devuelve true si el cuestionario está respondido)
      const parqCompleted = await parqService.checkParQCompletion(id);

      // Si la postulación está en estado cancelado significa que hubo al menos una respuesta positiva
      const notApt = existingPostulation.status === 'cancelled';
      setHasPositiveParQ(notApt);

      // Actualizar la postulación en estado local con flags verdaderos
      setPostulation({
        ...existingPostulation,
        par_q_completed: parqCompleted ?? existingPostulation.par_q_completed
      });
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error al cargar postulación:', error);
      setError(error.message || 'Error al cargar la postulación');
      toast.error(error.message || 'Error al cargar la postulación');
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial para cargar la postulación
  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      loadPostulation();
    }
  }, [id, navigate, initialized]);

  // Efecto para recargar cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {
      if (id && id !== 'new') {
        loadPostulation();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id]);

  // Efecto para recargar periódicamente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (id && id !== 'new') {
      interval = setInterval(() => {
        loadPostulation();
      }, 30000); // Recargar cada 30 segundos
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [id]);

  const getProgressSteps = (postulation: PostulationDTO): ProgressStep[] => {
    const tieneAtleta = !!athlete;
    const parqCompletado = !!postulation.par_q_completed;
    const historialCompletado = postulation.status === 'completed' || !!postulation.sports_history_completed;
    const isCancelled = postulation.status === 'cancelled';

    return [
      {
        name: 'Información Personal',
        description: 'Datos personales y de contacto',
        completed: true,
        icon: User,
        path: `/user-dashboard/postulations/${id}/personal-info`,
        requiresAthlete: false,
        clickable: !isCancelled
      },
      {
        name: 'Cuestionario PAR-Q',
        description: 'Evaluación de preparación física',
        completed: parqCompletado,
        icon: ClipboardList,
        path: `/parq?postulationId=${postulation.id}`,
        requiresAthlete: true,
        clickable: !isCancelled && !parqCompletado
      },
      {
        name: 'Historial Deportivo',
        description: 'Experiencia y logros deportivos',
        completed: historialCompletado,
        icon: Trophy,
        path: `/sports-history?postulationId=${postulation.id}`,
        requiresAthlete: true,
        clickable: !isCancelled && parqCompletado
      }
    ];
  };

  const handleStepClick = async (stepName: string) => {
    console.log('[handleStepClick] Iniciando con:', {
      stepName,
      postulationExists: !!postulation,
      userExists: !!user,
      athleteExists: !!athlete
    });

    if (!postulation) {
      console.log('[handleStepClick] No hay postulación, retornando');
      return;
    }

    if (!user) {
      console.log('[handleStepClick] No hay usuario autenticado, redirigiendo a login');
      toast.error('Debe iniciar sesión para continuar');
      navigate('/login');
      return;
    }

    const steps = getProgressSteps(postulation);
    const currentStep = steps.find(s => s.name === stepName);
    
    // Log específico para el estado del PAR-Q
    console.log('[PAR-Q Status]', {
      postulationId: postulation.id,
      parqCompleted: postulation.par_q_completed,
      currentStep: stepName,
      isClickable: currentStep?.clickable,
      sportsHistoryEnabled: postulation.par_q_completed === true
    });
    
    if (!currentStep?.clickable) {
      console.log('[handleStepClick] Paso no clickeable:', {
        stepName,
        parqCompleted: postulation.par_q_completed,
        isHistoryStep: stepName === 'Historial Deportivo'
      });

      if (stepName === 'Cuestionario PAR-Q' && postulation.par_q_completed) {
        toast.success('Ya has completado el cuestionario PAR-Q');
      } else if (stepName === 'Historial Deportivo' && !postulation.par_q_completed) {
        toast.error('Debes completar el cuestionario PAR-Q primero');
      }
      return;
    }

    if (currentStep.requiresAthlete && !athlete) {
      console.log('[handleStepClick] Se requiere atleta pero no existe');
      toast.error('Debes registrar tus datos personales primero');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      console.log('[handleStepClick] Estado de autenticación:', {
        tokenExists: !!token,
        tokenLength: token?.length,
        headers: api.defaults.headers.common['Authorization']
      });
      
      if (!token) {
        console.log('[handleStepClick] No hay token en localStorage');
        toast.error('Debe iniciar sesión para continuar');
        navigate('/login');
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (!api.defaults.headers.common['Authorization']) {
        console.log('[handleStepClick] No se pudo establecer el header de autorización');
        toast.error('Error de autenticación');
        return;
      }

      switch (currentStep.name) {
        case 'Información Personal':
          console.log('[handleStepClick] Navegando a perfil personal');
          navigate('/user-dashboard/profile');
          break;
        case 'Cuestionario PAR-Q':
          if (postulation.par_q_completed) {
            console.log('[handleStepClick] PAR-Q ya completado');
            toast.success('Ya has completado el cuestionario PAR-Q');
            return;
          }
          console.log('[handleStepClick] Navegando a PAR-Q');
          navigate(`/parq?postulationId=${postulation.id}`);
          break;
        case 'Historial Deportivo':
          console.log('[handleStepClick] Intentando navegar a Historial Deportivo:', {
            parqCompleted: postulation.par_q_completed,
            postulationId: postulation.id
          });
          if (!postulation.par_q_completed) {
            console.log('[handleStepClick] No se puede acceder al historial - PAR-Q incompleto');
            toast.error('Debes completar el cuestionario PAR-Q primero');
            return;
          }
          console.log('[handleStepClick] Navegando a Historial Deportivo');
          navigate(`/sports-history?postulationId=${postulation.id}`);
          break;
      }
    } catch (error) {
      console.error('[handleStepClick] Error:', error);
      toast.error('Error al acceder a la página solicitada');
    }
  };

  const getNextStep = (postulation: PostulationDTO) => {
    const steps = getProgressSteps(postulation);
    return steps.find(step => !step.completed && (!step.requiresAthlete || athlete)) || steps[steps.length - 1];
  };

  const handleContinue = () => {
    if (!postulation) return;
    const nextStep = getNextStep(postulation);
    
    if (nextStep.requiresAthlete && !athlete) {
      toast.error('Debes registrar tus datos personales primero');
      navigate('/user-dashboard/postulations/new/personal-info');
      return;
    }
    
    if (nextStep.name === 'Cuestionario PAR-Q' && postulation.status === 'active' && !postulation.par_q_completed) {
      navigate(`/parq?postulationId=${postulation.id}`);
      return;
    }
    
    if (nextStep.name === 'Historial Deportivo' && postulation.status === 'active' && postulation.par_q_completed && !postulation.sports_history_completed) {
      navigate(`/sports-history?postulationId=${postulation.id}`);
      return;
    }
    
    navigate('/user-dashboard/postulations');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#006837]"></div>
      </div>
    );
  }

  if (!postulation) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 font-sans tracking-tight">Postulación no encontrada</h2>
          <p className="text-gray-600 mb-8 font-sans text-lg max-w-md mx-auto">
            La postulación que buscas no existe o no tienes permiso para verla.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/user-dashboard/postulations')}
            className="bg-[#006837] text-white px-8 py-4 rounded-xl hover:bg-[#005229] transition-colors font-sans text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            Volver a Mis Postulaciones
          </motion.button>
        </div>
      </div>
    );
  }

  const nextStep = getNextStep(postulation);
  const isCompleted = postulation.status === 'completed';

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
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('/user-dashboard/postulations')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all mb-4 font-sans text-sm sm:text-base group"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
            <span>Volver a Mis Postulaciones</span>
          </motion.button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 font-sans tracking-tight mb-2">
                Detalles de la Postulación
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-sans">
                <Calendar className="w-4 h-4" />
                <span>
                  Creada el {formatDate(postulation.created_at)}
                </span>
              </div>
            </div>
            <motion.span 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                hasPositiveParQ ? 'bg-red-100 text-red-800' :
                postulation.status === 'completed' ? 'bg-green-100 text-green-800' :
                postulation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                postulation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {hasPositiveParQ ? 'No Apto' :
               postulation.status === 'completed' ? 'Completada' :
               postulation.status === 'active' ? 'En Proceso' :
               postulation.status === 'cancelled' ? 'Cancelada' :
               'Pendiente'}
            </motion.span>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {hasPositiveParQ && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="lg:col-span-2 bg-red-50 border-2 border-red-200 rounded-xl p-5 sm:p-6 relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Postulación No Apta - PAR-Q
                  </h3>
                  <p className="text-red-700 text-sm mb-4">
                    Tu postulación ha sido marcada como no apta debido a una respuesta positiva en el cuestionario PAR-Q.
                    Por tu seguridad y bienestar, te recomendamos:
                  </p>
                  <ul className="list-disc list-inside text-red-700 text-sm mb-4 space-y-2">
                    <li>Consultar con un profesional de la salud antes de iniciar actividades deportivas</li>
                    <li>Obtener una evaluación médica completa</li>
                    <li>Considerar iniciar con actividades físicas moderadas bajo supervisión médica</li>
                  </ul>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-red-200">
                    <button
                      onClick={() => navigate('/user-dashboard/postulations')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver a Mis Postulaciones
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 sm:p-6 relative overflow-hidden ${
              hasPositiveParQ || postulation.status === 'cancelled' ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30"></div>
            <div className="relative">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-5 sm:mb-6 font-sans tracking-tight">
                Progreso de la Postulación
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {getProgressSteps(postulation).map((step, index) => {
                  const isDisabled = hasPositiveParQ || postulation.status === 'cancelled';
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                      onClick={() => {
                        if (step.clickable && !isDisabled) {
                          handleStepClick(step.name);
                        }
                      }}
                      className={`group flex items-start gap-3 p-4 rounded-lg border transition-all ${
                        step.completed 
                          ? 'border-green-200 bg-green-50 cursor-default' 
                          : step.clickable && !isDisabled
                            ? 'border-gray-200 hover:border-[#006837] hover:bg-gray-50 cursor-pointer' 
                            : 'border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : isDisabled ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm sm:text-base font-semibold ${
                          step.completed ? 'text-gray-900' : 
                          isDisabled ? 'text-gray-400' :
                          'text-gray-700'
                        } font-sans mb-1 truncate`}>
                          {step.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 font-sans line-clamp-2">{step.description}</p>
                        {!step.clickable && !step.completed && !isDisabled && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            {step.requiresAthlete && !athlete 
                              ? 'Debes registrar tus datos personales primero'
                              : step.name === 'Cuestionario PAR-Q' && athlete
                                ? 'Haz clic para completar el cuestionario PAR-Q'
                                : ''}
                          </p>
                        )}
                        {isDisabled && (
                          <p className="text-xs text-red-500 mt-1.5">
                            {hasPositiveParQ ? 'No disponible - Postulación no apta' : 'No disponible - Postulación cancelada'}
                          </p>
                        )}
                      </div>
                      {step.clickable && !step.completed && !isDisabled && (
                        <div className="flex-shrink-0 flex items-center gap-1.5">
                          <span className="text-xs text-[#006837] font-medium font-sans">Continuar</span>
                          <ChevronRight className="w-4 h-4 text-[#006837] transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            {!hasPositiveParQ && postulation.status !== 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 sm:p-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/30"></div>
                <div className="relative">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 font-sans tracking-tight">
                      Estado Actual
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadPostulation}
                      className="text-sm text-[#006837] hover:text-[#005229] flex items-center gap-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Actualizar</span>
                    </motion.button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
                    <p className="text-sm sm:text-base text-gray-700 font-sans">
                      {nextStep.completed 
                        ? '¡Felicitaciones! Has completado todos los pasos de tu postulación.' 
                        : `Siguiente paso: ${nextStep.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-sans">
                      Última actualización: {lastUpdate ? lastUpdate.toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Nunca'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}; 