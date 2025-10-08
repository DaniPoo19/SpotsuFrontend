import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { postulationService } from '../../services/postulation.service';
import { PostulationDTO } from '../../types/dtos';
import { useAuth } from '@/contexts/AuthContext';
import { parqService } from '../../services/parq.service';
import { 
  CheckCircle2, 
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

// Memoizar componentes pesados
const ProgressStepComponent = memo(({ step, index, isDisabled, handleStepClick }: {
  step: ProgressStep;
  index: number;
  isDisabled: boolean;
  handleStepClick: (stepName: string) => void;
}) => {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index + 0.5, duration: 0.4 }}
      onClick={() => {
        if (step.clickable && !isDisabled) {
          handleStepClick(step.name);
        }
      }}
      className={`group flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 ${
        step.completed 
          ? 'border-green-200 bg-green-50/50 cursor-default' 
          : step.clickable && !isDisabled
            ? 'border-gray-200 hover:border-[#006837] hover:bg-[#006837]/5 cursor-pointer hover:shadow-md' 
            : 'border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-60'
      }`}
    >
      {/* Icono del paso */}
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          step.completed 
            ? 'bg-green-500 text-white' 
            : step.clickable && !isDisabled
              ? 'bg-[#006837] text-white'
              : 'bg-gray-200 text-gray-400'
        }`}>
          {step.completed ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <step.icon className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className={`text-lg font-bold ${
            step.completed ? 'text-gray-900' : 
            isDisabled ? 'text-gray-400' :
            'text-gray-700'
          } tracking-tight`}>
            {step.name}
          </h3>
          {step.completed && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Completado
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-2 leading-relaxed">{step.description}</p>
        
        {/* Estados y mensajes */}
        {!step.clickable && !step.completed && !isDisabled && (
          <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            {step.requiresAthlete && !step.clickable 
              ? '⚠️ Debes registrar tus datos personales primero'
              : step.name === 'Cuestionario PAR-Q'
                ? '▶️ Listo para completar'
                : '⏳ En espera de pasos anteriores'}
          </p>
        )}
        {isDisabled && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            🚫 No disponible - Postulación no apta
          </p>
        )}
      </div>

      {/* Indicador de acción */}
      {step.clickable && !step.completed && !isDisabled && (
        <div className="flex-shrink-0 flex items-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#006837]/10 text-[#006837] rounded-lg group-hover:bg-[#006837] group-hover:text-white transition-colors">
            <span className="text-sm font-medium">Continuar</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      )}
    </motion.div>
  );
});

export const PostulationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { athlete, user } = useAuth();
  const [postulation, setPostulation] = useState<PostulationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasPositiveParQ, setHasPositiveParQ] = useState(false);

  const loadPostulation = useCallback(async () => {
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

      // Optimización: cargar postulación y PAR-Q en paralelo
      const [existingPostulation, parqCompleted] = await Promise.allSettled([
        postulationService.getPostulationById(id),
        parqService.checkParQCompletion(id)
      ]);
      
      if (existingPostulation.status === 'rejected' || !existingPostulation.value) {
        throw new Error('No se encontró la postulación');
      }
      
      const postulationData = existingPostulation.value;
      const parqStatus = parqCompleted.status === 'fulfilled' ? parqCompleted.value : null;
      
      // Si la postulación está en estado cancelado significa que hubo al menos una respuesta positiva
      const notApt = postulationData.status === 'cancelled';
      setHasPositiveParQ(notApt);
      
      // Actualizar la postulación en estado local con flags verdaderos
      setPostulation({
        ...postulationData,
        par_q_completed: parqStatus ?? postulationData.par_q_completed
      });
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error al cargar postulación:', error);
      toast.error(error.message || 'Error al cargar la postulación');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Efecto inicial para cargar la postulación
  useEffect(() => {
    if (id) {
      setLoading(true);
      loadPostulation();
    }
  }, [id, navigate]);

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

  // Memoizar getProgressSteps para evitar recálculos
  const getProgressSteps = useCallback((postulation: PostulationDTO): ProgressStep[] => {
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
  }, [id]);

  // Usar useCallback para evitar recrear la función en cada render
  const handleStepClick = useCallback(async (stepName: string) => {
    if (!postulation || !user) {
      if (!user) {
        toast.error('Debe iniciar sesión para continuar');
        navigate('/login');
      }
      return;
    }

    const steps = getProgressSteps(postulation);
    const currentStep = steps.find(s => s.name === stepName);
    
    if (!currentStep?.clickable) {
      if (stepName === 'Cuestionario PAR-Q' && postulation.par_q_completed) {
        toast.success('Ya has completado el cuestionario PAR-Q');
      } else if (stepName === 'Historial Deportivo' && !postulation.par_q_completed) {
        toast.error('Debes completar el cuestionario PAR-Q primero');
      }
      return;
    }

    if (currentStep.requiresAthlete && !athlete) {
      toast.error('Debes registrar tus datos personales primero');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Debe iniciar sesión para continuar');
        navigate('/login');
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      switch (currentStep.name) {
        case 'Información Personal':
          navigate('/user-dashboard/profile');
          break;
        case 'Cuestionario PAR-Q':
          if (postulation.par_q_completed) {
            toast.success('Ya has completado el cuestionario PAR-Q');
            return;
          }
          navigate(`/parq?postulationId=${postulation.id}`);
          break;
        case 'Historial Deportivo':
          if (!postulation.par_q_completed) {
            toast.error('Debes completar el cuestionario PAR-Q primero');
            return;
          }
          navigate(`/sports-history?postulationId=${postulation.id}`);
          break;
      }
    } catch (error) {
      console.error('[handleStepClick] Error:', error);
      toast.error('Error al acceder a la página solicitada');
    }
  }, [postulation, user, athlete, navigate]);

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

  // Memoizar formatDate
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    let parsed = dateString;
    // Si el formato es "YYYY-MM-DD HH:MM:SS" (con espacio) lo convertimos a ISO simple
    if (parsed.includes(' ') && !parsed.includes('T')) {
      parsed = parsed.replace(' ', 'T');
    }
    const date = new Date(parsed);
    if (isNaN(date.getTime())) return 'Fecha no disponible';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);
  
  // Memoizar cálculos complejos
  const memoizedData = useMemo(() => {
    if (!postulation) return null;
    
    const steps = getProgressSteps(postulation);
    const nextStep = steps.find(step => !step.completed && (!step.requiresAthlete || athlete)) || steps[steps.length - 1];
    const completedSteps = steps.filter(step => step.completed).length;
    const progressPercentage = Math.round((completedSteps / steps.length) * 100);
    
    return {
      steps,
      nextStep,
      completedSteps,
      progressPercentage
    };
  }, [postulation, getProgressSteps, athlete]);

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

  const { steps, nextStep, completedSteps, progressPercentage } = memoizedData || {
    steps: [],
    nextStep: null,
    completedSteps: 0,
    progressPercentage: 0
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      {/* Container optimizado para sidebar */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 transition-all duration-300">
        {/* Header mejorado */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-8 lg:mb-10"
        >
          {/* Botón de navegación mejorado */}
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('/user-dashboard/postulations')}
            className="inline-flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-all mb-6 group"
          >
            <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="font-medium">Volver a Mis Postulaciones</span>
          </motion.button>

          {/* Información principal del header */}
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6 xl:gap-8">
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-3">
                  {postulation.semester?.name || 'Postulación'} 
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      Creada el {formatDate(postulation.created_at)}
                    </span>
                  </div>
                  {lastUpdate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        Actualizado {lastUpdate.toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progreso mejorada */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Progreso General</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#006837]">{progressPercentage}%</span>
                    <span className="text-sm text-gray-500">completado</span>
                  </div>
                </div>
                
                {/* Barra de progreso visual */}
                <div className="relative mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      className="h-4 bg-gradient-to-r from-[#006837] via-[#00a65a] to-[#4ade80] rounded-full relative"
                    >
                      {/* Efecto de brillo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
                    </motion.div>
                  </div>
                  
                  {/* Indicador de posición */}
                  <motion.div
                    initial={{ left: '0%', opacity: 0 }}
                    animate={{ 
                      left: `${Math.max(0, Math.min(100, progressPercentage))}%`, 
                      opacity: progressPercentage > 0 ? 1 : 0 
                    }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
                    className="absolute -top-2 -bottom-2 flex items-center"
                  >
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg border-3 border-[#006837] flex items-center justify-center -translate-x-3">
                      <div className="w-2 h-2 bg-[#006837] rounded-full"></div>
                    </div>
                  </motion.div>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{completedSteps} de {steps.length} pasos completados</span>
                  <span className="font-medium">
                    {progressPercentage === 100 ? '¡Completado!' : `${steps.length - completedSteps} restantes`}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Estado de la postulación */}
            <div className="flex-shrink-0">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className={`px-6 py-3 rounded-2xl text-lg font-semibold tracking-wide border-2 ${
                  hasPositiveParQ ? 'bg-red-50 text-red-800 border-red-200' :
                  postulation.status === 'completed' ? 'bg-green-50 text-green-800 border-green-200' :
                  postulation.status === 'active' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  postulation.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' :
                  'bg-gray-50 text-gray-800 border-gray-200'
                }`}>
                  {hasPositiveParQ ? 'No Apto' :
                   postulation.status === 'completed' ? 'Completada' :
                   postulation.status === 'active' ? 'En Proceso' :
                   postulation.status === 'cancelled' ? 'Cancelada' :
                   'Pendiente'}
                </div>
                
                {/* Indicador visual adicional */}
                <div className={`w-3 h-3 rounded-full ${
                  hasPositiveParQ ? 'bg-red-500' :
                  postulation.status === 'completed' ? 'bg-green-500' :
                  postulation.status === 'active' ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-400'
                }`}></div>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Contenido principal */}
        <div className="grid gap-6 lg:gap-8 grid-cols-1 xl:grid-cols-3">
          
          {/* Alerta para postulaciones no aptas - span completo */}
          {hasPositiveParQ && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="xl:col-span-3 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 lg:p-8 relative overflow-hidden"
            >
              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-200/30 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-red-200 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-800 mb-3">
                    Postulación No Apta - Evaluación PAR-Q
                  </h3>
                  <p className="text-red-700 mb-4 leading-relaxed">
                    Tu postulación ha sido marcada como no apta debido a una respuesta positiva en el cuestionario PAR-Q.
                    Por tu seguridad y bienestar, te recomendamos seguir estos pasos:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Consulta Médica</h4>
                      <p className="text-sm text-red-700">Obtén una evaluación médica completa antes de iniciar actividades deportivas</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Actividad Supervisada</h4>
                      <p className="text-sm text-red-700">Considera actividades físicas moderadas bajo supervisión profesional</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/user-dashboard/postulations')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Mis Postulaciones
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pasos de la postulación - 2 columnas */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`xl:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8 relative overflow-hidden ${
              hasPositiveParQ || postulation.status === 'cancelled' ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#006837]/5 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#006837]/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-[#006837]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Pasos de la Postulación
                </h2>
              </div>
              
              <div className="space-y-4">
                {memoizedData?.steps.map((step, index) => {
                  const isDisabled = hasPositiveParQ || postulation.status === 'cancelled';
                  return (
                    <ProgressStepComponent
                      key={index}
                      step={step}
                      index={index}
                      isDisabled={isDisabled}
                      handleStepClick={handleStepClick}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Panel lateral de información */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="space-y-6"
          >
            {/* Estado actual y siguiente paso */}
            {!hasPositiveParQ && postulation.status !== 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden"
              >
                {/* Elementos decorativos */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Estado Actual</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadPostulation}
                      className="ml-auto text-sm text-[#006837] hover:text-[#005229] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#006837]/5 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Actualizar</span>
                    </motion.button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Siguiente paso */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        {nextStep.completed ? '🎉 ¡Todo Completo!' : '🎯 Siguiente Paso'}
                      </h4>
                      <p className="text-blue-700 text-sm leading-relaxed">
                        {nextStep.completed 
                          ? '¡Felicitaciones! Has completado todos los pasos de tu postulación.' 
                          : `${nextStep.name} - ${nextStep.description}`}
                      </p>
                      
                      {!nextStep.completed && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleContinue}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <span>Continuar</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    {/* Información de tiempo */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Última actualización</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        {lastUpdate ? lastUpdate.toLocaleString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Nunca'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}



            {/* Ayuda y soporte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="bg-gradient-to-br from-[#006837]/5 to-green-50 rounded-2xl border border-green-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-800">¿Necesitas Ayuda?</h3>
              </div>
              
              <p className="text-green-700 text-sm mb-4 leading-relaxed">
                Si tienes dudas sobre el proceso de postulación o necesitas asistencia técnica, nuestro equipo está aquí para ayudarte.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span>📧</span>
                  <span>soporte@tracksport.edu.co</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span>📞</span>
                  <span>+57 (4) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span>🕒</span>
                  <span>Lun - Vie: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}; 