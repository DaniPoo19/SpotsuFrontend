import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonalDataForm } from '../../components/PersonalDataForm';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSubmit = (data: any) => {
    // Aquí puedes enviar los datos al backend o guardarlos en el estado global
    console.log('Datos personales:', data);
    // Redirigir al historial deportivo
    navigate('/sports-history');
  };

  return <PersonalDataForm onSubmit={handleSubmit} />;
}; 