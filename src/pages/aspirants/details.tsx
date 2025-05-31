import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Phone, Mail, Award, Trophy, FileCheck, FileX, AlertCircle } from 'lucide-react';
import { aspirantsService } from '../../services/aspirants.service';
import { AspirantDTO } from '../../types/dtos';
import { toast } from 'sonner';

export const AspirantDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aspirant, setAspirant] = useState<AspirantDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAspirant = async () => {
      if (!id) return;
      
      try {
        const data = await aspirantsService.getById(id);
        setAspirant(data);
      } catch (error) {
        console.error('Error al cargar aspirante:', error);
        toast.error('Error al cargar los detalles del aspirante');
      } finally {
        setIsLoading(false);
      }
    };

    loadAspirant();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  if (!aspirant) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          No se encontró el aspirante
        </div>
      </div>
    );
  }

  const getFileStatusIcon = () => {
    switch (aspirant.fileStatus) {
      case 'Completo':
        return <FileCheck className="text-green-500" size={20} />;
      case 'Incompleto':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'Pendiente':
        return <FileX className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/aspirants')}
          className="flex items-center text-[#006837] hover:text-[#A8D08D]"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver a la lista
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{aspirant.name}</h2>
            <p className="text-gray-500">{aspirant.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {getFileStatusIcon()}
            <span className={`px-3 py-1 rounded-full text-sm ${
              aspirant.fileStatus === 'Completo'
                ? 'bg-green-100 text-green-800'
                : aspirant.fileStatus === 'Incompleto'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {aspirant.fileStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar size={20} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Fecha de nacimiento:</span>
                <span className="ml-2">{new Date(aspirant.birthDate || '').toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={20} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Dirección:</span>
                <span className="ml-2">{aspirant.address}, {aspirant.city}, {aspirant.state}, {aspirant.country}</span>
              </div>
              <div className="flex items-center">
                <Phone size={20} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Teléfono:</span>
                <span className="ml-2">{aspirant.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail size={20} className="text-gray-400 mr-2" />
                <span className="text-gray-600">Email:</span>
                <span className="ml-2">{aspirant.email}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Documentación</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600">Tipo de documento:</span>
                <span className="ml-2">{aspirant.documentType}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">Número de documento:</span>
                <span className="ml-2">{aspirant.documentNumber}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600">Certificado deportivo:</span>
                  <span className={`ml-2 ${aspirant.documents.sportsCertificate ? 'text-green-500' : 'text-red-500'}`}>
                    {aspirant.documents.sportsCertificate ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">Certificado médico:</span>
                  <span className={`ml-2 ${aspirant.documents.medicalCertificate ? 'text-green-500' : 'text-red-500'}`}>
                    {aspirant.documents.medicalCertificate ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">Formulario de consentimiento:</span>
                  <span className={`ml-2 ${aspirant.documents.consentForm ? 'text-green-500' : 'text-red-500'}`}>
                    {aspirant.documents.consentForm ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {aspirant.sportHistories && aspirant.sportHistories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Historial Deportivo</h3>
            <div className="space-y-4">
              {aspirant.sportHistories.map((history) => (
                <div key={history.id} className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Award size={20} className="text-[#006837] mr-2" />
                    <span className="font-medium">{history.sport.name}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                      history.status === 'Aprobado'
                        ? 'bg-green-100 text-green-800'
                        : history.status === 'Rechazado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {history.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Institución:</span>
                      <span className="ml-2">{history.institution}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Período:</span>
                      <span className="ml-2">
                        {new Date(history.startDate).toLocaleDateString()} - 
                        {history.endDate ? new Date(history.endDate).toLocaleDateString() : 'Presente'}
                      </span>
                    </div>
                    {history.achievements && (
                      <div className="col-span-2">
                        <div className="flex items-start">
                          <Trophy size={20} className="text-[#006837] mr-2 mt-1" />
                          <div>
                            <span className="text-gray-600">Logros:</span>
                            <p className="ml-2 mt-1">{history.achievements}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};