import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '@/services/api';

interface Person {
  id: string;
  name: string;
  lastName: string;
  documentNumber: string;
  documentType: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  country: string;
}

export const UserProfilePage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonData = async () => {
      // Validar que el personId esté definido
      if (!user?.person?.id) {
        setError('No se encontró información del usuario');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get(`/people/${user.person.id}`);
        setPerson(response.data);
      } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
        setError('Error al cargar los datos del perfil');
        toast.error('Error al cargar los datos del perfil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#006837] text-white hover:bg-[#005229]"
          >
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="text-xl font-bold text-gray-600 mb-4">No se encontraron datos</h2>
          <p className="text-gray-500 mb-6">No se encontraron datos del perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#006837]">Perfil de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#006837]" />
                <div>
                  <p className="text-sm text-gray-500">Nombre completo</p>
                  <p className="font-medium">{`${person.name} ${person.lastName}`}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#006837]" />
                <div>
                  <p className="text-sm text-gray-500">Correo electrónico</p>
                  <p className="font-medium">{person.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-[#006837]" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{person.phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#006837]" />
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{person.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#006837]" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                  <p className="font-medium">{new Date(person.birthDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#006837]" />
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{`${person.documentType} ${person.documentNumber}`}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#006837] text-white hover:bg-[#005229]"
            >
              Actualizar datos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 