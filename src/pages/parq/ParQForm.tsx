import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { parqService } from '../../services/parq.service';
import { ParQQuestion } from '../../types/parq';
import { useAuth } from '../../contexts/AuthContext';
import { postulationService } from '../../services/postulation.service';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#006837] mb-4">Cuestionario PAR-Q</h1>
            <p className="text-gray-600">
              Por favor, responda honestamente las siguientes preguntas. Este cuestionario es importante para su seguridad.
            </p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  className="bg-[#006837] h-2 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Pregunta {currentQuestion + 1} de {questions.length}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="border-b border-gray-200 pb-6"
              >
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {currentQuestion + 1}. {questions[currentQuestion].question}
                </p>
                {questions[currentQuestion].description && (
                  <p className="text-sm text-gray-600 mb-4">{questions[currentQuestion].description}</p>
                )}
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setAnswer(questions[currentQuestion].id, true)}
                    className={`flex-1 py-3 px-6 rounded-xl border text-lg font-medium transition-all ${
                      answers[questions[currentQuestion].id] === true
                        ? 'bg-[#006837] text-white border-[#006837]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Sí
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setAnswer(questions[currentQuestion].id, false)}
                    className={`flex-1 py-3 px-6 rounded-xl border text-lg font-medium transition-all ${
                      answers[questions[currentQuestion].id] === false
                        ? 'bg-[#006837] text-white border-[#006837]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    No
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200"
              >
                {error}
              </motion.div>
            )}

            <div className="flex justify-between items-center pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-2 text-[#006837] border border-[#006837] rounded-lg hover:bg-[#006837] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </motion.button>

              {currentQuestion === questions.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!validateForm() || submitting}
                  className="px-8 py-3 bg-[#006837] text-white rounded-lg hover:bg-[#005828] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Enviar Respuestas'
                  )}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSaveAnswer}
                  disabled={answers[questions[currentQuestion].id] === null}
                  className="px-6 py-2 bg-[#006837] text-white rounded-lg hover:bg-[#005828] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}; 