import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MeasurementsForm } from '@/components/MeasurementsForm';

export const AspirantMeasurementsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleSubmit = (data: any) => {
    // Aquí iría la lógica para guardar las medidas
    console.log('Medidas guardadas:', data);
    // Redirigir de vuelta a los detalles del aspirante
    navigate(`/aspirants/${id}`);
  };

  const handleCancel = () => {
    navigate(`/aspirants/${id}`);
  };

  return (
    <div className="flex justify-center items-start min-h-screen py-8">
      <MeasurementsForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}; 