import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Calendar, Award, FileCheck } from 'lucide-react';

interface PostulationDetail {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  semester: string;
  sports: string[];
  personalData: {
    name: string;
    document: string;
    email: string;
    phone: string;
  };
  documents: {
    medicalCertificate: boolean;
    consentForm: boolean;
    achievements: boolean;
  };
}

const mockPostulationDetail: PostulationDetail = {
  id: '1',
  status: 'pending',
  date: '2024-03-15',
  semester: '2024-1',
  sports: ['Fútbol', 'Atletismo'],
  personalData: {
    name: 'Juan Pérez',
    document: '1234567890',
    email: 'juan@example.com',
    phone: '123-456-7890'
  },
  documents: {
    medicalCertificate: true,
    consentForm: false,
    achievements: true
  }
};

const getStatusColor = (status: PostulationDetail['status']) => {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50';
    case 'rejected':
      return 'text-red-600 bg-red-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
  }
};

const getStatusText = (status: PostulationDetail['status']) => {
  switch (status) {
    case 'approved':
      return 'Aprobada';
    case 'rejected':
      return 'Rechazada';
    case 'pending':
      return 'Pendiente';
  }
};

export const PostulationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#006837]">
            Detalles de Postulación
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(mockPostulationDetail.status)}`}>
            <span className="text-sm font-medium">
              {getStatusText(mockPostulationDetail.status)}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Información Personal */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#006837] flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre Completo</p>
                  <p className="font-medium">{mockPostulationDetail.personalData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{mockPostulationDetail.personalData.document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Correo Electrónico</p>
                  <p className="font-medium">{mockPostulationDetail.personalData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{mockPostulationDetail.personalData.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deportes Seleccionados */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#006837] flex items-center gap-2">
                <Award className="w-5 h-5" />
                Deportes Seleccionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockPostulationDetail.sports.map((sport, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#006837] bg-opacity-10 text-[#006837] rounded-full text-sm"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#006837] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Requeridos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-[#006837]" />
                    <span>Certificado Médico</span>
                  </div>
                  <button
                    className={`px-3 py-1 rounded-full ${
                      mockPostulationDetail.documents.medicalCertificate
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {mockPostulationDetail.documents.medicalCertificate ? 'Completado' : 'Pendiente'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-[#006837]" />
                    <span>Consentimiento Informado</span>
                  </div>
                  <button
                    className={`px-3 py-1 rounded-full ${
                      mockPostulationDetail.documents.consentForm
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {mockPostulationDetail.documents.consentForm ? 'Completado' : 'Pendiente'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-[#006837]" />
                    <span>Logros Deportivos</span>
                  </div>
                  <button
                    className={`px-3 py-1 rounded-full ${
                      mockPostulationDetail.documents.achievements
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {mockPostulationDetail.documents.achievements ? 'Completado' : 'Pendiente'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 