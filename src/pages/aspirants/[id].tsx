import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Trophy,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  FileCheck,
  FileX,
  User,
  FileWarning,
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react';
import { aspirantsService } from '../../services/aspirants.service';
import { AspirantDTO } from '../../types/dtos';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Document {
  id: string;
  name: string;
  type: 'certificate' | 'consent' | 'medical';
  status: 'valid' | 'invalid';
  url: string;
  sport?: string;
  category?: string;
  competitionType?: string;
}

interface MorphologicalEvaluation {
  weight: number;
  height: number;
  bmi: number;
  muscleMass: number;
  fatMass: number;
  visceralFat: number;
  metabolicAge: number;
  boneMass: number;
  legerTest: number;
  isCompleted: boolean;
}

export const AspirantDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aspirant, setAspirant] = useState<AspirantDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [morphologicalEvaluation, setMorphologicalEvaluation] = useState<MorphologicalEvaluation | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'validate' | 'invalidate' | 'delete' | 'save';
    documentId?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadAspirant = async () => {
      if (!id) return;
      
      try {
        const data = await aspirantsService.getById(id);
        setAspirant(data);
        // Aquí se cargarían los documentos del aspirante
        setDocuments([
          {
            id: '1',
            name: 'Certificado Deportivo - Fútbol',
            type: 'certificate',
            status: 'valid',
            url: '/certificates/football.pdf',
            sport: 'Fútbol',
            category: 'Regional',
            competitionType: 'Campeonato'
          },
          {
            id: '2',
            name: 'Consentimiento Informado',
            type: 'consent',
            status: 'valid',
            url: '/consents/informed.pdf'
          },
          {
            id: '3',
            name: 'Certificado Médico',
            type: 'medical',
            status: 'invalid',
            url: '/medical/certificate.pdf'
          }
        ]);
      } catch (error) {
        console.error('Error al cargar aspirante:', error);
        toast.error('Error al cargar los detalles del aspirante');
      } finally {
        setIsLoading(false);
      }
    };

    loadAspirant();
  }, [id]);

  const handleDocumentStatusChange = async (documentId: string, newStatus: 'valid' | 'invalid') => {
    setConfirmAction({
      type: newStatus === 'valid' ? 'validate' : 'invalidate',
      documentId
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteDocument = async (documentId: string) => {
    setConfirmAction({
      type: 'delete',
      documentId
    });
    setShowConfirmDialog(true);
  };

  const handleDownload = async (document: Document) => {
    try {
      // Aquí iría la lógica para descargar el documento
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error al descargar documento:', error);
      toast.error('Error al descargar el documento');
    }
  };

  const handleSaveAll = async () => {
    if (!morphologicalEvaluation?.isCompleted) {
      toast.error('Debe completar la evaluación morfológica antes de guardar');
      return;
    }

    const invalidDocuments = documents.filter(doc => doc.status === 'invalid');
    if (invalidDocuments.length > 0) {
      toast.error('Todos los documentos deben estar validados antes de guardar');
      return;
    }

    setConfirmAction({
      type: 'save'
    });
    setShowConfirmDialog(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case 'validate':
        case 'invalidate':
          if (confirmAction.documentId) {
            setDocuments(docs => 
              docs.map(doc => 
                doc.id === confirmAction.documentId 
                  ? { ...doc, status: confirmAction.type === 'validate' ? 'valid' : 'invalid' }
                  : doc
              )
            );
            toast.success(`Documento ${confirmAction.type === 'validate' ? 'validado' : 'invalidado'} exitosamente`);
          }
          break;

        case 'delete':
          if (confirmAction.documentId) {
            setDocuments(docs => docs.filter(doc => doc.id !== confirmAction.documentId));
            toast.success('Documento eliminado exitosamente');
          }
          break;

        case 'save':
          setIsSaving(true);
          // Aquí iría la lógica para guardar todos los datos
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación de guardado
          toast.success('Todos los datos han sido guardados exitosamente');
          break;
      }
    } catch (error) {
      console.error('Error al ejecutar acción:', error);
      toast.error('Error al ejecutar la acción');
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

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
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold">{aspirant.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-500">{aspirant.email}</p>
              <span className="text-gray-400">|</span>
              <p className="text-gray-500">Documento: {aspirant.documentNumber}</p>
              <span className="text-gray-400">|</span>
              <p className="text-gray-500">Sexo: {aspirant.gender}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/dashboard/aspirants/${id}/morphological-evaluation`)}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 ${
                morphologicalEvaluation?.isCompleted
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-[#006837] hover:bg-[#005229]'
              }`}
            >
              {morphologicalEvaluation?.isCompleted ? (
                <>
                  <CheckCircle2 size={20} />
                  Evaluación Completada
                </>
              ) : (
                <>
                  <span>Registrar Evaluación Morfológica</span>
                </>
              )}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || !morphologicalEvaluation?.isCompleted}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 ${
                isSaving || !morphologicalEvaluation?.isCompleted
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#006837] hover:bg-[#005229]'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Todo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Información Personal y Documentación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="text-[#006837]" />
              Información Personal
            </h3>
            <div className="space-y-4">
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

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="text-[#006837]" />
              Documentación
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-gray-600">Tipo de documento:</span>
                <span className="ml-2">{aspirant.documentType}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">Número de documento:</span>
                <span className="ml-2">{aspirant.documentNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos Médicos y Consentimientos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileCheck className="text-[#006837]" />
            Documentos Médicos y Consentimientos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.filter(doc => doc.type === 'medical' || doc.type === 'consent').map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {doc.type === 'medical' ? (
                      <FileCheck className="text-[#006837]" size={24} />
                    ) : (
                      <FileText className="text-[#006837]" size={24} />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.name}</h4>
                      <p className="text-sm text-gray-500">
                        {doc.type === 'medical' ? 'Certificado Médico' : 'Consentimiento Informado'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doc.status === 'valid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {doc.status === 'valid' ? 'Válido' : 'Inválido'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-600 hover:text-[#006837] transition-colors"
                    title="Descargar"
                  >
                    <Download size={20} />
                  </button>
                  {doc.status === 'valid' ? (
                    <button
                      onClick={() => handleDocumentStatusChange(doc.id, 'invalid')}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Invalidar"
                    >
                      <XCircle size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDocumentStatusChange(doc.id, 'valid')}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Validar"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <FileX size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificados Deportivos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="text-[#006837]" />
            Certificados Deportivos
          </h3>
          <div className="bg-white rounded-xl border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deporte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.filter(doc => doc.type === 'certificate').map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Award className="text-[#006837] mr-2" size={20} />
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{doc.sport}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{doc.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{doc.competitionType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === 'valid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doc.status === 'valid' ? 'Válido' : 'Inválido'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-gray-600 hover:text-[#006837] transition-colors"
                          title="Descargar"
                        >
                          <Download size={20} />
                        </button>
                        {doc.status === 'valid' ? (
                          <button
                            onClick={() => handleDocumentStatusChange(doc.id, 'invalid')}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Invalidar"
                          >
                            <XCircle size={20} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDocumentStatusChange(doc.id, 'valid')}
                            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                            title="Validar"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <FileX size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial Deportivo */}
        {aspirant.sportHistories && aspirant.sportHistories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="text-[#006837]" />
              Historial Deportivo
            </h3>
            <div className="space-y-4">
              {aspirant.sportHistories.map((history) => (
                <div key={history.id} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Award size={20} className="text-[#006837] mr-2" />
                    <span className="font-medium">{history.sport.name}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

      {/* Diálogo de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'validate' && 'Validar Documento'}
              {confirmAction?.type === 'invalidate' && 'Invalidar Documento'}
              {confirmAction?.type === 'delete' && 'Eliminar Documento'}
              {confirmAction?.type === 'save' && 'Guardar Todos los Datos'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'validate' && '¿Está seguro que desea validar este documento?'}
              {confirmAction?.type === 'invalidate' && '¿Está seguro que desea invalidar este documento?'}
              {confirmAction?.type === 'delete' && '¿Está seguro que desea eliminar este documento? Esta acción no se puede deshacer.'}
              {confirmAction?.type === 'save' && '¿Está seguro que desea guardar todos los datos? Esta acción guardará la evaluación morfológica y el estado de todos los documentos.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={executeConfirmedAction}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                confirmAction?.type === 'delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#006837] hover:bg-[#005229]'
              }`}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </div>
              ) : (
                <>
                  {confirmAction?.type === 'validate' && 'Validar'}
                  {confirmAction?.type === 'invalidate' && 'Invalidar'}
                  {confirmAction?.type === 'delete' && 'Eliminar'}
                  {confirmAction?.type === 'save' && 'Guardar'}
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 