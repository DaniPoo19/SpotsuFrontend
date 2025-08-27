import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
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
  Calendar,
  ArrowRight,
  XCircle
} from 'lucide-react';
import { parqService } from '../../services/parq.service';
import { api } from '../../services/api';

// Memoizar componentes pesados
const PostulationCard = memo(({ postulation, index, hasPositiveParQ, progress, getProgressSteps, formatDate, navigate }: any) => {
  const isCompleted = postulation.status === 'completed';
  const isCancelled = postulation.status === 'cancelled';

  return (
    <motion.article
      key={postulation.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: Math.min(0.1 * index, 0.5), 
        duration: 0.4,
        ease: "easeOut"
      }}
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 sm:p-7 lg:p-8 relative overflow-hidden transform hover:-translate-y-1 ${
        hasPositiveParQ ? 'border-2 border-red-200 bg-red-50/30' : 'hover:border hover:border-gray-200'
      }`}
    >
      {/* Efectos visuales mejorados */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/10 to-gray-50/30 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#006837]/5 to-transparent rounded-full -translate-y-8 translate-x-8 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      
      <div className="relative space-y-6">
        {/* Header mejorado */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              {postulation.semester?.name || 'Postulación'}
            </h3>
            
            {/* Metadatos de la postulación */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">
                  {formatDate(postulation.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium truncate">
                  {postulation.athlete?.name || ''} {postulation.athlete?.last_name || ''}
                </span>
              </div>
            </div>
          </div>
          
          {/* Estado mejorado */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-shrink-0"
          >
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold tracking-wide ${
              isCancelled ? 'bg-red-100 text-red-800 border border-red-200' :
              isCompleted ? 'bg-green-100 text-green-800 border border-green-200' :
              postulation.status === 'active' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {isCancelled ? 'Cancelada' :
               isCompleted ? 'Completada' :
               postulation.status === 'active' ? 'En Proceso' :
               'Pendiente'}
            </span>
          </motion.div>
        </div>

        {/* Alerta para postulaciones canceladas */}
        {isCancelled && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-relaxed">
                La postulación ha sido cancelada debido a una respuesta positiva en el cuestionario PAR-Q.
              </p>
            </div>
          </motion.div>
        )}

        {/* Sección de progreso mejorada */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Progreso General</span>
            <span className="text-lg font-bold text-gray-900">{progress}%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className={`h-3 rounded-full ${
                  hasPositiveParQ 
                    ? 'bg-gradient-to-r from-red-400 to-red-600'
                    : 'bg-gradient-to-r from-[#006837] to-[#00a65a]'
                }`}
              />
            </div>
            
            {/* Indicador de progreso visual */}
            <div className="absolute -top-1 -bottom-1 left-0 right-0 flex items-center">
              <motion.div
                initial={{ left: '0%' }}
                animate={{ left: `${Math.max(0, Math.min(100, progress))}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                className="absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[#006837] -translate-x-2"
              />
            </div>
          </div>
        </div>

        {/* Lista de pasos mejorada */}
        <div className="space-y-3">
          {getProgressSteps(postulation).map((step: any, stepIndex: number) => (
            <motion.div 
              key={stepIndex} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (stepIndex * 0.1) }}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              {step.completed === true ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className={`text-sm font-medium ${step.completed === true ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.name}
                </span>
                {step.description && (
                  <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Botón de acción mejorado */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/user-dashboard/postulations/${postulation.id}`)}
          className="w-full bg-gradient-to-r from-[#006837] to-[#00a65a] text-white px-6 py-4 rounded-xl hover:from-[#005229] hover:to-[#008f47] transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-base shadow-lg hover:shadow-xl group"
        >
          <span>{isCompleted ? 'Ver Detalles' : 'Continuar Postulación'}</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.article>
  );
});

export const PostulationsPage = () => {
  const navigate = useNavigate();
  const { user, athlete, isAuthenticated, isLoading } = useAuth();
  const [postulations, setPostulations] = useState<PostulationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasActivePostulation, setHasActivePostulation] = useState(false);

  // Memoizar funciones para evitar re-creaciones
  const loadPostulations = useCallback(async () => {
    if (!user?.document_number) {
      toast.error('No se encontró la información del usuario');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Optimización: hacer llamadas en paralelo donde sea posible
      const [athleteResult, semesterResult] = await Promise.allSettled([
        athletesService.getAthleteByDocument(user.document_number),
        api.get('/semesters/active')
      ]);
      
      if (athleteResult.status === 'rejected' || !athleteResult.value) {
        toast.error('No se encontró la información del atleta');
        navigate('/user-dashboard/postulations/new/personal-info');
        return;
      }
      
      const athlete = athleteResult.value;
      const activeSemester = semesterResult.status === 'fulfilled' ? semesterResult.value.data?.data : null;

      // Obtener las postulaciones
      const data = await postulationService.getPostulationsByAthlete(athlete.id);

      // Verificar si existe una postulación para el semestre activo
      if (activeSemester?.id) {
        const sameSemesterPostulation = data.find(p => p.semester?.id === activeSemester.id);
        setHasActivePostulation(!!sameSemesterPostulation);
      } else {
        // Si no se pudo obtener el semestre activo, mantener la lógica anterior (por compatibilidad)
        const activePost = data.find(p => p.status === 'active');
        setHasActivePostulation(!!activePost);
      }
      
      // Optimización: usar Promise.allSettled para verificar PAR-Q sin bloquear
      const parqPromises = data.map(async (post) => {
        try {
          const parqCompleted = await parqService.checkParQCompletion(post.id);
          return {
            ...post,
            par_q_completed: parqCompleted || post.par_q_completed
          };
        } catch (error) {
          // Si falla el check de PAR-Q, usar el valor existente
          return post;
        }
      });
      
      const updatedPostulations = await Promise.all(parqPromises);
      
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
  }, [user?.document_number, navigate]);

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

  const handleNewPostulation = useCallback(async () => {
    try {
      setLoading(true);

      if (!athlete?.id) {
        toast.error('No se encontró la información del atleta');
        setLoading(false);
        return;
      }

      // Optimización: hacer llamadas en paralelo
      const [semesterResult, currentPostulationsResult] = await Promise.allSettled([
        api.get('/semesters/active'),
        postulationService.getPostulationsByAthlete(athlete.id)
      ]);
      
      if (semesterResult.status === 'rejected' || !semesterResult.value.data?.data?.id) {
        toast.error('No se pudo determinar el semestre activo');
        setLoading(false);
        return;
      }
      
      if (currentPostulationsResult.status === 'rejected') {
        toast.error('Error al verificar postulaciones existentes');
        setLoading(false);
        return;
      }
      
      const activeSemester = semesterResult.value.data.data;
      const currentPostulations = currentPostulationsResult.value;
      
      // 2. Verificar si ya existe una postulación para el semestre actual (sin importar el estado)
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
  }, [athlete?.id, loadPostulations, navigate]);

  // Memoizar funciones de cálculo para evitar recálculos innecesarios
  const getProgressSteps = useCallback((postulation: PostulationDTO) => {
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
  }, []);

  const getProgressPercentage = useCallback((postulation: PostulationDTO) => {
    const steps = getProgressSteps(postulation);
    const completedSteps = steps.filter(step => step.completed === true).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [getProgressSteps]);



  // Memoizar formatDate para evitar recálculos
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    let parsed = dateString;
    // Reemplazar espacio entre fecha y hora por 'T' si existe
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
  
  // Memoizar datos calculados para evitar recálculos en cada render
  const postulationData = useMemo(() => {
    return postulations.map(postulation => ({
      ...postulation,
      progress: getProgressPercentage(postulation),
      hasPositiveParQ: postulation.status === 'cancelled'
    }));
  }, [postulations, getProgressPercentage]);

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
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      {/* Container principal con espaciado optimizado para evitar colisiones con sidebar */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 transition-all duration-300">
        {/* Header section mejorada */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6 xl:gap-8">
            {/* Información del header */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-3">
                  Mis Postulaciones
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl">
                  Gestiona tus postulaciones a programas deportivos de manera eficiente
                </p>
              </div>
              
              {/* Información de actualización */}
              {lastUpdate && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Actualizado: {lastUpdate.toLocaleString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadPostulations}
                    className="text-[#006837] hover:text-[#005229] flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#006837]/5 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">Actualizar</span>
                  </motion.button>
                </div>
              )}
            </div>
            
            {/* Botón de nueva postulación - posicionamiento mejorado */}
            <div className="flex-shrink-0">
              <motion.button
                whileHover={hasActivePostulation ? {} : { scale: 1.02, backgroundColor: '#005229' }}
                whileTap={hasActivePostulation ? {} : { scale: 0.98 }}
                onClick={handleNewPostulation}
                className={`inline-flex items-center justify-center gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-semibold text-base lg:text-lg shadow-lg transition-all duration-200 ${
                  hasActivePostulation 
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-[#006837] hover:bg-[#005229] hover:shadow-xl text-white'
                }`}
                disabled={hasActivePostulation}
              >
                <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
                <span>Nueva Postulación</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {postulations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 sm:p-10 lg:p-12 text-center max-w-3xl mx-auto relative overflow-hidden"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/20 to-gray-50/40"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#006837]/5 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#006837]/5 rounded-full translate-x-12 translate-y-12"></div>
            
            {/* Content */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-[#006837] to-[#00a65a] rounded-2xl flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-lg"
              >
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white" />
              </motion.div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                No tienes postulaciones
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 lg:mb-10 max-w-xl mx-auto leading-relaxed">
                Comienza tu primera postulación para participar en nuestros programas deportivos y dar el siguiente paso en tu carrera
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#005229' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewPostulation}
                className="bg-[#006837] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl hover:bg-[#005229] transition-all duration-200 inline-flex items-center gap-3 text-base sm:text-lg lg:text-xl font-semibold shadow-lg hover:shadow-xl"
              >
                <Plus className="w-6 h-6" />
                Nueva Postulación
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-8"
          >
            {/* Grid optimizado para diferentes breakpoints */}
            <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
              {postulationData.map((postulation, index) => (
                <PostulationCard
                  key={postulation.id}
                  postulation={postulation}
                  index={index}
                  hasPositiveParQ={postulation.hasPositiveParQ}
                  progress={postulation.progress}
                  getProgressSteps={getProgressSteps}
                  formatDate={formatDate}
                  navigate={navigate}
                />
              ))}
            </div>
          </motion.section>
        )}
        
        {/* Botón flotante mejorado para móviles - solo cuando hay postulaciones */}
        {postulations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className="lg:hidden fixed bottom-6 right-6 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNewPostulation}
              disabled={hasActivePostulation}
              className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 ${
                hasActivePostulation 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#006837] to-[#00a65a] hover:from-[#005229] hover:to-[#008f47] hover:shadow-3xl'
              }`}
            >
              <Plus className="w-7 h-7 text-white" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}; 