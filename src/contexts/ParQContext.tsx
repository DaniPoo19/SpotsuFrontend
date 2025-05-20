import React, { createContext, useContext, useState, useEffect } from 'react';
import { ParQQuestion, ParQAnswer, ParQResponse } from '../types/dtos';
import { parqService } from '../services/parq.service';
import { toast } from 'react-hot-toast';

interface ParQContextType {
  questions: ParQQuestion[];
  answers: Record<string, boolean | null>;
  loading: boolean;
  completed: boolean;
  passed: boolean;
  setAnswer: (questionId: string, answer: boolean) => void;
  submitAnswers: () => Promise<boolean>;
  resetParQ: () => void;
}

const ParQContext = createContext<ParQContextType | undefined>(undefined);

export const ParQProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<ParQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const questionsData = await parqService.getQuestions();
      setQuestions(questionsData);
      const initialAnswers: Record<string, boolean | null> = questionsData.reduce((acc, q) => {
        acc[q.id] = null;
        return acc;
      }, {} as Record<string, boolean | null>);
      setAnswers(initialAnswers);
    } catch (error: any) {
      toast.error('Error al cargar las preguntas del PAR-Q');
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionId: string, answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const validateForm = () => {
    return questions.every(q => answers[q.id] !== null);
  };

  const submitAnswers = async (): Promise<boolean> => {
    if (!validateForm()) {
      toast.error('Por favor responda todas las preguntas');
      return false;
    }

    try {
      const formattedAnswers: ParQAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: answer as boolean
      }));

      const response = await parqService.submitAnswers(formattedAnswers);
      setCompleted(true);
      setPassed(response.result.passed);

      if (!response.result.passed) {
        toast.error(response.result.message);
      } else {
        toast.success('¡Cuestionario completado exitosamente!');
      }

      return response.result.passed;
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar las respuestas');
      return false;
    }
  };

  const resetParQ = () => {
    setAnswers({});
    setCompleted(false);
    setPassed(false);
    loadQuestions();
  };

  const value = {
    questions,
    answers,
    loading,
    completed,
    passed,
    setAnswer,
    submitAnswers,
    resetParQ
  };

  return (
    <ParQContext.Provider value={value}>
      {children}
    </ParQContext.Provider>
  );
};

export const useParQ = (): ParQContextType => {
  const context = useContext(ParQContext);
  if (context === undefined) {
    throw new Error('useParQ debe ser usado dentro de un ParQProvider');
  }
  return context;
}; 