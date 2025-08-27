import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { parqService } from '../../services/parq.service';
import { ParQQuestion } from '../../types/parq';
import { useAuth } from '../../contexts/AuthContext';
import { postulationService } from '../../services/postulation.service';
import { ArrowLeft, AlertTriangle, CheckCircle, X } from 'lucide-react';

export const ParQForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ParQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [postulationId, setPostulationId] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  const initializeForm = useCallback(async () => {
    if (initialized) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Debe iniciar sesión para continuar');
      navigate('/login');
      return;
    }

    if (!user?.id) {
      toast.error('No se encontró la información del usuario');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const urlPostulationId = searchParams.get('postulationId');
      if (!urlPostulationId) {
        toast.error('No se encontró el ID de la postulación');
        navigate('/user-dashboard/postulations');
        return;
      }

      setPostulationId(urlPostulationId);

      // Verificar si ya completó el PARQ
      const isCompleted = await parqService.checkParQCompletion(urlPostulationId);
      if (isCompleted) {
        toast.success('Ya has completado el cuestionario PARQ');
        navigate(`/user-dashboard/postulations/${urlPostulationId}`);
        return;
      }

      // Cargar preguntas
      const questionsData = await parqService.getParQQuestions();
      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        throw new Error('No se pudieron cargar las preguntas');
      }

      setQuestions(questionsData);
      const initialAnswers: Record<string, boolean | null> = questionsData.reduce((acc, q) => {
        acc[q.id] = null;
        return acc;
      }, {} as Record<string, boolean | null>);
      setAnswers(initialAnswers);
      setInitialized(true);
    } catch (error: any) {
      console.error('Error al inicializar el formulario PAR-Q:', error);
      if (error.response?.status === 401) {
        toast.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        navigate('/login');
        return;
      }
      setError(error.message || 'Error al cargar el formulario');
      toast.error(error.message || 'Error al cargar el formulario');
    } finally {
      setLoading(false);
    }
  }, [user, navigate, searchParams, initialized]);

  useEffect(() => {
    if (!initialized) {
      initializeForm();
    }
  }, [initializeForm, initialized]);

  const setAnswer = (questionId: string, answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const validateForm = () => {
    return questions.every(q => answers[q.id] !== null);
  };

  const handleSaveAnswer = async () => {
    const actualQuestion = questions[currentQuestion];
    const answer = answers[actualQuestion.id];

    if(answer === null){
      toast.error('Por favor responda la pregunta');
      return;
    }

    if(currentQuestion < questions.length - 1){
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postulationId) {
      toast.error('No se encontró el ID de la postulación');
      navigate('/user-dashboard/postulations');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Validar que todas las preguntas tengan respuesta
      const totalQuestions = questions.length;
      const answeredQuestions = Object.values(answers).filter(answer => answer !== null).length;

      if (answeredQuestions !== totalQuestions) {
        setError(`Por favor, responde todas las preguntas antes de enviar (${answeredQuestions}/${totalQuestions})`);
        toast.error(`Por favor, responde todas las preguntas (${answeredQuestions}/${totalQuestions})`);
        return;
      }

      // Convertir respuestas a boolean
      const formattedAnswers: Record<string, boolean> = {};
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer !== null) {
          formattedAnswers[questionId] = answer;
        }
      });

      // Verificar si existe al menos una respuesta positiva
      const hasPositiveResponse = Object.values(formattedAnswers).some(v => v === true);

      console.log('[PAR-Q Form] Enviando respuestas:', {
        postulationId,
        answers: formattedAnswers
      });

      // Enviar respuestas
      await parqService.submitParQResponses(postulationId, formattedAnswers);
      
      // Verificar que las respuestas se guardaron correctamente
      const isComplete = await parqService.checkParQCompletion(postulationId);
      console.log('[PAR-Q Form] Verificación de completitud:', {
        postulationId,
        isComplete
      });

      if (isComplete) {
        try {
          // Sólo actualizamos estado PAR-Q si NO hubo respuestas positivas
          if (!hasPositiveResponse) {
            await postulationService.updateParQCompletion(postulationId);
          }
          
          // Obtener la postulación actualizada para verificar el cambio
          const updatedPostulation = await postulationService.getPostulationById(postulationId);
          console.log('[PAR-Q Form] Estado final de la postulación:', {
            postulationId,
            parqCompleted: updatedPostulation.par_q_completed,
            status: updatedPostulation.status
          });

          toast.success('¡Cuestionario PAR-Q completado exitosamente!');
          navigate(`/user-dashboard/postulations/${postulationId}`);
        } catch (updateError: any) {
          console.error('[PAR-Q Form] Error al actualizar estado:', updateError);
          toast.success('Cuestionario guardado correctamente');
          toast.error('Se guardaron las respuestas pero hubo un problema al actualizar el estado. Por favor, contacta al soporte si el problema persiste.');
          navigate(`/user-dashboard/postulations/${postulationId}`);
        }
      } else {
        throw new Error('No se pudieron verificar todas las respuestas del PAR-Q');
      }
    } catch (error: any) {
      console.error('[PAR-Q Form] Error al enviar respuestas:', error);
      setError(error.message || 'Error al enviar las respuestas');
      toast.error(error.message || 'Error al enviar las respuestas');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006837]"
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      >
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">Error</h2>
          <p className="text-gray-700 mb-6 text-center">{error}</p>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#006837] text-white rounded-lg hover:bg-[#005828] transition-colors"
            >
              Intentar nuevamente
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleCancel = () => {
    if (postulationId) {
      navigate(`/user-dashboard/postulations/${postulationId}`);
    } else {
      navigate('/user-dashboard/postulations');
    }
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header responsive */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ x: -2 }}
              onClick={handleCancel}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all group"
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-medium">Volver a Postulaciones</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header del cuestionario */}
            <div className="bg-gradient-to-r from-[#006837] to-[#00a65a] text-white p-6 sm:p-8 lg:p-10">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
                >
                  <AlertTriangle className="w-8 h-8" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                  Cuestionario PAR-Q
                </h1>
                <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  Por favor, responda honestamente las siguientes preguntas. Este cuestionario es importante para su seguridad deportiva.
                </p>
              </div>
              
              {/* Barra de progreso mejorada */}
              <div className="mt-8 lg:mt-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white/80 font-medium">Progreso</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{Math.round(progressPercentage)}%</span>
                    <span className="text-white/80 text-sm">completado</span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-4 bg-white rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"></div>
                    </motion.div>
                  </div>
                  
                  {/* Indicador de posición */}
                  <motion.div
                    initial={{ left: '0%', opacity: 0 }}
                    animate={{ 
                      left: `${Math.max(0, Math.min(100, progressPercentage))}%`, 
                      opacity: progressPercentage > 0 ? 1 : 0 
                    }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="absolute -top-1 -bottom-1 flex items-center"
                  >
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center -translate-x-3">
                      <div className="w-2 h-2 bg-[#006837] rounded-full"></div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex justify-between text-sm text-white/70 mt-3">
                  <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
                  <span>{questions.length - currentQuestion - 1} restantes</span>
                </div>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="p-6 sm:p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Pregunta */}
                    <div className="bg-gray-50 rounded-2xl p-6 lg:p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-[#006837] text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {currentQuestion + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                            {questions[currentQuestion].question}
                          </h2>
                          {questions[currentQuestion].description && (
                            <p className="text-gray-600 leading-relaxed">
                              {questions[currentQuestion].description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Opciones de respuesta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setAnswer(questions[currentQuestion].id, true)}
                        className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                          answers[questions[currentQuestion].id] === true
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            answers[questions[currentQuestion].id] === true
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300 group-hover:border-red-300'
                          }`}>
                            {answers[questions[currentQuestion].id] === true && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-xl font-semibold">Sí</span>
                        </div>
                        <p className="text-sm mt-2 text-gray-600">
                          Esta condición se aplica a mí
                        </p>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setAnswer(questions[currentQuestion].id, false)}
                        className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                          answers[questions[currentQuestion].id] === false
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            answers[questions[currentQuestion].id] === false
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300 group-hover:border-green-300'
                          }`}>
                            {answers[questions[currentQuestion].id] === false && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-xl font-semibold">No</span>
                        </div>
                        <p className="text-sm mt-2 text-gray-600">
                          Esta condición no se aplica a mí
                        </p>
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Mensaje de error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Botones de navegación */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
                  <div className="flex gap-3 w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestion === 0}
                      className="flex-1 sm:flex-none px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Anterior
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 sm:flex-none px-6 py-3 text-red-600 border-2 border-red-300 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all font-medium"
                    >
                      Cancelar
                    </motion.button>
                  </div>

                  {currentQuestion === questions.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!validateForm() || submitting}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#006837] to-[#00a65a] text-white rounded-xl hover:from-[#005828] hover:to-[#008f47] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>Enviar Respuestas</span>
                        </div>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleSaveAnswer}
                      disabled={answers[questions[currentQuestion].id] === null}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#006837] to-[#00a65a] text-white rounded-xl hover:from-[#005828] hover:to-[#008f47] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>Siguiente Pregunta</span>
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </div>
                    </motion.button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}; 