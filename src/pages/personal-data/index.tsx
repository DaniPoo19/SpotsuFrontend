import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { personService } from '../../services/personService';
import { authService } from '../../services/authService';
import { CreatePersonDTO } from '../../dtos/personDTO';

export const PersonalDataPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreatePersonDTO) => {
    if (!user?.id) {
      toast.error('No se ha encontrado el usuario');
      return;
    }

    setIsSubmitting(true);
    try {
      // Guardar datos personales
      await personService.createPerson({
        ...data,
        user_id: user.id
      });

      // Marcar datos personales como completados
      authService.markPersonalDataCompleted();

      // Redirigir al historial deportivo
      navigate('/sports-history');
      
      toast.success('Datos personales guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar datos personales:', error);
      toast.error('Error al guardar datos personales');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... resto del código del componente ...
}; 