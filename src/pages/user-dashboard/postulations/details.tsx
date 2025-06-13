import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { postulationService } from '../../../services/postulation.service';
import { PostulationDTO } from '../../../types/dtos';

const PostulationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [postulation, setPostulation] = useState<PostulationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPostulation = async () => {
      if (!id) {
        setError('No se encontró el ID de la postulación');
        setLoading(false);
        return;
      }

      try {
        const data = await postulationService.getPostulationById(id);
        setPostulation(data);
      } catch (err) {
        setError('Error al cargar la postulación');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostulation();
  }, [id]);

  const handleStepClick = (step: string) => {
    if (!postulation) return;

    switch (step) {
      case 'Información Personal':
        navigate('/user-dashboard/profile');
        break;
      case 'Cuestionario PAR-Q':
        navigate(`/parq?postulationId=${postulation.id}`);
        break;
      case 'Historial Deportivo':
        navigate(`/sports-history?postulationId=${postulation.id}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !postulation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'No se encontró la postulación'}</div>
      </div>
    );
  }

  const getProgressSteps = () => {
    return [
      {
        name: 'Información Personal',
        description: 'Datos personales y de contacto',
        completed: postulation.personal_info_completed,
        path: '/user-dashboard/profile'
      },
      {
        name: 'Cuestionario PAR-Q',
        description: 'Evaluación de preparación física',
        completed: postulation.parq_completed,
        path: `/parq?postulationId=${postulation.id}`
      },
      {
        name: 'Historial Deportivo',
        description: 'Experiencia y logros deportivos',
        completed: postulation.sports_history_completed,
        path: `/sports-history?postulationId=${postulation.id}`
      }
    ];
  };

  const steps = getProgressSteps();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <h1 className="text-3xl font-bold mb-8">Detalles de la Postulación</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {steps.map((step, index) => {
          const isClickable = !step.completed && 
            (step.name === 'Información Personal' || 
             (step.name === 'Cuestionario PAR-Q' && steps[0].completed) ||
             (step.name === 'Historial Deportivo' && steps[1].completed));

          return (
            <div
              key={index}
              onClick={() => isClickable && handleStepClick(step.name)}
              className={`p-4 rounded-lg border ${
                isClickable 
                  ? 'border-blue-200 hover:border-blue-300 cursor-pointer bg-blue-50' 
                  : step.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
              } transition-all duration-200`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className={`${
                    step.completed 
                      ? 'bg-green-500' 
                      : isClickable 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200'
                  } h-10 w-10 rounded-full flex items-center justify-center`}>
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-lg leading-6 font-medium text-gray-900">
                    {step.name}
                  </div>
                  <div className="text-base leading-6 font-normal text-gray-500">
                    {step.description}
                  </div>
                </div>
                <div className="ml-auto">
                  <ChevronRight className={`${
                    isClickable ? 'text-gray-500' : 'text-gray-400'
                  } h-5 w-5`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PostulationDetails; 