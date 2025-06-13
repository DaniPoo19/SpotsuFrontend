import React, { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface OutletContext {
  hasAthlete: boolean;
}

interface Document {
  name: string;
  status: 'completed' | 'pending' | 'missing';
  lastUpdate?: string;
  description: string;
}

const documents: Document[] = [
  {
    name: 'Certificado Médico',
    status: 'completed',
    lastUpdate: '2024-03-15',
    description: 'Certificado médico actualizado y válido'
  },
  {
    name: 'Consentimiento Informado',
    status: 'pending',
    lastUpdate: '2024-03-10',
    description: 'Pendiente de firma digital'
  },
  {
    name: 'Logros Deportivos',
    status: 'completed',
    lastUpdate: '2024-03-18',
    description: 'Documentación de logros deportivos actualizada'
  }
];

const getStatusColor = (status: Document['status']) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'missing':
      return 'text-red-600 bg-red-50';
  }
};

const getStatusIcon = (status: Document['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5" />;
    case 'missing':
      return <XCircle className="w-5 h-5" />;
  }
};

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const { hasAthlete } = useOutletContext<OutletContext>();

  useEffect(() => {
    if (!hasAthlete) {
      toast.error('Debes registrar tus datos personales primero');
      navigate('/register-personal-data');
      return;
    }
  }, [hasAthlete, navigate]);

  if (!hasAthlete) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#006837]">Mis Documentos</h2>
        </div>

        <div className="grid gap-6">
          {documents.map((doc, index) => (
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#006837] bg-opacity-10">
                      <FileText className="w-6 h-6 text-[#006837]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      <span className="text-sm font-medium">
                        {doc.status === 'completed' ? 'Completado' : 
                         doc.status === 'pending' ? 'Pendiente' : 'Faltante'}
                      </span>
                    </div>
                    {doc.lastUpdate && (
                      <span className="text-sm text-gray-500">
                        Última actualización: {new Date(doc.lastUpdate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}; 