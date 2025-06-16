import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User,
  FileText,
  Loader2,
  AlertCircle,
  Edit,
  Camera,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';
import { mastersService } from '@/services/masters.service';

// interfaz parcial del atleta (según auth.types)
interface AthleteInfo {
  id: string;
  name: string;
  last_name: string;
  birth_date?: string;
  document_type_id?: string;
  document_number?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export const UserProfilePage = () => {
  const { athlete, isLoading: authLoading } = useAuth();
  const [docAbbrev, setDocAbbrev] = useState<string>('');

  // Obtener abreviatura de tipo de documento (misma lógica del sidebar)
  const getDocumentAbbrev = (docName?: string) => {
    if (!docName) return '';
    const lower = docName.toLowerCase();
    if (lower.includes('tarjeta') && lower.includes('identidad')) return 'TI';
    if ((lower.includes('cédula') || lower.includes('cedula')) && lower.includes('ciudad')) return 'CC';
    return docName;
  };

  // Extraer abreviatura directamente del token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const docTypeName: string | undefined = payload.document_type_name || payload.document_type;
      if (docTypeName) {
        const abbr = getDocumentAbbrev(docTypeName);
        setDocAbbrev(abbr);
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }, []);

  // Si aún no tenemos abreviatura, intentar resolver mediante masters
  useEffect(() => {
    const resolveAbbrev = async () => {
      if (docAbbrev) return;
      const docTypeId = athlete?.document_type_id;
      if (!docTypeId) return;
      try {
        const types = await mastersService.getDocumentTypes();
        const found = types.find((t: any) => t.id === docTypeId);
        if (found?.name) {
          setDocAbbrev(getDocumentAbbrev(found.name));
        }
      } catch (err) {
        console.warn('No se pudieron obtener tipos de documento:', err);
      }
    };
    resolveAbbrev();
  }, [athlete?.document_type_id, docAbbrev]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#006837]" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-2xl w-full shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-bold text-red-600">Error</h2>
              <p className="text-red-500">No se encontró información del atleta</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#006837] text-white hover:bg-[#005229]"
              >
                Intentar nuevamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name?: string, lastName?: string) => {
    if (!name && !lastName) return 'U';
    return `${(name || lastName || 'U')[0].toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-[#006837] to-[#00a65a]" />
          
          <div className="relative px-4 sm:px-6 lg:px-8 pb-8">
            <div className="relative -mt-24 flex justify-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-white p-2 shadow-lg">
                  <div className="w-full h-full rounded-full bg-[#006837] flex items-center justify-center text-3xl font-bold text-white">
                    {getInitials(athlete.name, athlete.last_name)}
                  </div>
                </div>
                <button className="absolute bottom-2 right-2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-50 transition-colors">
                  <Camera className="w-5 h-5 text-[#006837]" />
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {athlete.name} {athlete.last_name}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {docAbbrev && athlete.document_number ? `${docAbbrev} ${athlete.document_number}` : athlete.document_number || 'N/D'}
              </p>
            </div>

            <div className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#006837]/10 p-3">
                      <User className="h-6 w-6 text-[#006837]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nombre completo</p>
                      <p className="text-lg font-medium text-gray-900">
                        {athlete.name} {athlete.last_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#006837]/10 p-3">
                      <FileText className="h-6 w-6 text-[#006837]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Documento</p>
                      <p className="text-lg font-medium text-gray-900">
                        {docAbbrev && athlete.document_number ? `${docAbbrev} ${athlete.document_number}` : athlete.document_number || 'N/D'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#006837]/10 p-3">
                      <Mail className="h-6 w-6 text-[#006837]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Correo</p>
                      <p className="text-lg font-medium text-gray-900">
                        {athlete.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TELÉFONO */}
                <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#006837]/10 p-3">
                      <Phone className="h-6 w-6 text-[#006837]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-lg font-medium text-gray-900">
                        {athlete.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* FECHA NACIMIENTO */}
                <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#006837]/10 p-3">
                      <Calendar className="h-6 w-6 text-[#006837]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nacimiento</p>
                      <p className="text-lg font-medium text-gray-900">
                        {athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString() : 'N/D'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DIRECCIÓN */}
                <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#006837]/10 p-3">
                      <MapPin className="h-6 w-6 text-[#006837]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-lg font-medium text-gray-900">
                        {athlete.address || 'N/D'}, {athlete.city || ''} {athlete.department ? `- ${athlete.department}` : ''} {athlete.country ? `(${athlete.country})` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <Button
                onClick={() => {/* Implementar edición */}}
                className="bg-[#006837] text-white hover:bg-[#005229] px-8 py-3 rounded-xl flex items-center gap-2 text-lg"
              >
                <Edit className="w-5 h-5" />
                Detalles
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 