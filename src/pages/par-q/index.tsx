import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ParQFormData } from '../../types/ParQFormData';
import { parQService } from '../../services/ParQService';
import { authService } from '../../services/AuthService';

export const ParQPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ParQFormData) => {
    if (!user?.id) {
      toast.error('No se ha encontrado el usuario');
      return;
    }

    setIsSubmitting(true);
    try {
      // Guardar respuestas del Par-Q
      await parQService.submitResponses(data.responses);

      // Marcar Par-Q como completado
      authService.markParQCompleted();

      // Redirigir al siguiente paso
      navigate('/personal-data');
      
      toast.success('Par-Q completado exitosamente');
    } catch (error) {
      console.error('Error al guardar respuestas del Par-Q:', error);
      toast.error('Error al guardar respuestas del Par-Q');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... resto del código del componente ...
}; 