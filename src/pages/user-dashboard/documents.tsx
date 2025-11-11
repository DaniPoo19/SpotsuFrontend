import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, AlertCircle, Upload, Trash2, Eye, RefreshCw, ArrowLeft, Calendar, Plus, ChevronRight, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { attachedDocumentsService, CreateAttachedDocumentDTO } from '@/services/attached-documents.service';
import { athletesService } from '@/services/athletes.service';
import { attachedDocumentTypesService, AttachedDocumentType } from '@/services/attached-document-types.service';
import { postulationService } from '@/services/postulation.service';
import { reportsService } from '@/services/reports.service';

interface AttachedDocument {
  id: string;
  path: string;
  status: 'Completado' | 'Pendiente' | 'Cancelado';
  attachedDocumentType: {
    id: string;
    name: string;
    description: string;
  };
}

interface PostulationData {
  id: string;
  athlete_id: string;
  semester?: {
    id: string;
  name: string;
  };
  status: string;
  created_at: string;
}



export const DocumentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { athlete } = useAuth();
  const [postulations, setPostulations] = useState<PostulationData[]>([]);
  const [selectedPostulation, setSelectedPostulation] = useState<PostulationData | null>(null);
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<AttachedDocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  
  // Estado de la URL - si viene con una postulación específica
  const postulationIdFromState = location.state?.postulationId;

  // Cargar todas las postulaciones del atleta
  const loadPostulations = useCallback(async () => {
    if (!athlete?.id) return;

    try {
      setLoading(true);
      
      // Obtener todas las postulaciones del atleta
      const allPostulations = await athletesService.getPostulations(athlete.id);
      
      // Ordenar por fecha más reciente
      const sortedPostulations = allPostulations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setPostulations(sortedPostulations);
      
      // Si viene con una postulación específica desde el estado, seleccionarla
      if (postulationIdFromState) {
        const targetPostulation = sortedPostulations.find(p => p.id === postulationIdFromState);
        if (targetPostulation) {
          setSelectedPostulation(targetPostulation);
        }
      }
      
    } catch (error) {
      console.error('Error al cargar postulaciones:', error);
      toast.error('Error al cargar postulaciones');
    } finally {
      setLoading(false);
    }
  }, [athlete?.id, postulationIdFromState]);

  // Cargar documentos de la postulación seleccionada
  const loadDocuments = useCallback(async () => {
    if (!selectedPostulation) return;

    try {
      setLoading(true);
      
      // Cargar tipos de documentos y la postulación completa con sus documentos en paralelo
      const [docTypesResult, postulationResult] = await Promise.allSettled([
        attachedDocumentTypesService.getAttachedDocumentTypes(),
        postulationService.getPostulationById(selectedPostulation.id)
      ]);
      
      if (docTypesResult.status === 'fulfilled') {
        setDocumentTypes(docTypesResult.value);
      }
      
      if (postulationResult.status === 'fulfilled') {
        // Los documentos vienen directamente de la postulación con todas las relaciones
        const postulation = postulationResult.value as any;
        const postulationDocs = postulation.attached_documents || [];
        setDocuments(postulationDocs);
        setLastUpdate(new Date());
      }
      
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [selectedPostulation]);

  useEffect(() => {
    loadPostulations();
  }, [loadPostulations]);

  useEffect(() => {
    if (selectedPostulation) {
      loadDocuments();
    }
  }, [selectedPostulation, loadDocuments]);

  const handleFileUpload = useCallback(async (file: File, documentTypeId: string, existingDocumentId?: string) => {
    if (!selectedPostulation) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    // Validar que el archivo sea PDF
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño máximo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    try {
      setUploading(documentTypeId);
      
      if (existingDocumentId) {
        // Actualizar documento existente
        const formData = new FormData();
        formData.append('file', file);
        
        await attachedDocumentsService.updateDocument(existingDocumentId, { status: 'Pendiente' });
        toast.success('Documento actualizado exitosamente');
      } else {
        // Crear nuevo documento
        const uploadData: CreateAttachedDocumentDTO = {
          postulation_id: selectedPostulation.id,
          attached_document_type_id: documentTypeId,
          file: file
        };

        await attachedDocumentsService.uploadDocument(uploadData);
        toast.success('Documento subido exitosamente');
      }
      
      // Pequeño delay para asegurar que el backend haya procesado todo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar documentos
      await loadDocuments();
    } catch (error: any) {
      console.error('[Upload] Error al subir documento:', error);
      toast.error(error.message || 'Error al subir documento');
    } finally {
      setUploading(null);
    }
  }, [selectedPostulation, loadDocuments]);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await attachedDocumentsService.deleteDocument(documentId);
      toast.success('Documento eliminado exitosamente');
      await loadDocuments();
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
    }
  }, [loadDocuments]);

  const handleDownloadDocument = useCallback((document: AttachedDocument) => {
    const path = document.path;
    
    if (!path) {
      toast.error('No se encuentra la ruta del documento');
      return;
    }
    
    // Si ya viene como URL absoluta, usarla tal cual
    if (/^https?:\/\//.test(path)) {
      window.open(path, '_blank');
      return;
    }
    
    // Obtener la URL base del servidor
    // En desarrollo: http://localhost:3000 (remover prefijo /tracksport/api/v1)
    // En producción: https://api.tracksport.socratesunicordoba.co (ya está lista)
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const API_PREFIX = import.meta.env.VITE_API_PREFIX || '';
    
    // Si hay prefijo, removerlo para obtener la URL base del servidor
    let serverBaseUrl = BASE_URL;
    if (API_PREFIX && BASE_URL.includes(API_PREFIX)) {
      serverBaseUrl = BASE_URL.replace(API_PREFIX, '');
    } else if (BASE_URL.includes('/api/v1')) {
      serverBaseUrl = BASE_URL.replace(/\/(tracksport|spotsu)\/api\/v1\/?$/, '');
    }
    
    // Construir URL absoluta con el servidor base
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fileUrl = `${serverBaseUrl}${normalizedPath}`;
    
    console.log('[Documents] Server Base URL:', serverBaseUrl);
    console.log('[Documents] Opening document:', fileUrl);
    window.open(fileUrl, '_blank');
  }, []);

  const handleDownloadIndividualReport = useCallback(async () => {
    if (!selectedPostulation) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    if (selectedPostulation.status !== 'completed') {
      toast.error('El reporte solo está disponible cuando la postulación está completada');
      return;
    }

    setDownloadingReport(true);
    try {
      const athleteName = athlete?.name + ' ' + athlete?.last_name || 'Deportista';
      await reportsService.downloadIndividualReportPDF(selectedPostulation.id, athleteName);
      toast.success('Reporte individual descargado exitosamente');
    } catch (error: any) {
      console.error('Error descargando reporte individual:', error);
      toast.error(error.message || 'Error al descargar el reporte. Por favor, intenta de nuevo.');
    } finally {
      setDownloadingReport(false);
    }
  }, [selectedPostulation, athlete]);

  // Memoizar datos calculados para la postulación seleccionada
  const documentsByType = useMemo(() => {
    if (!selectedPostulation) return [];
    
    // Definir los tipos de documentos requeridos
    const requiredDocNames = ['certificado médico', 'consentimiento informado', 'certificado medico'];
    
    // Filtrar solo los tipos de documentos relevantes que existen en la BD
    const relevantDocTypes = documentTypes.filter(type => {
      const normalizedName = type.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return requiredDocNames.some(reqName => normalizedName.includes(reqName));
    });
    
    return relevantDocTypes.map(type => {
      // Buscar el documento que coincida con este tipo
      const userDoc = documents.find(doc => {
        const docTypeId = doc.attachedDocumentType?.id;
        return docTypeId === type.id;
      });
      
      // Determinar el estado del documento
      let status: 'completed' | 'pending' | 'rejected' | 'missing';
      if (!userDoc) {
        status = 'missing';
      } else if (userDoc.status === 'Completado') {
        status = 'completed';
      } else if (userDoc.status === 'Cancelado') {
        status = 'rejected';
      } else {
        status = 'pending';
      }
      
      return {
        id: type.id,
        name: type.name,
        description: type.description || 'Documento requerido para la postulación',
        required: true,
        document: userDoc,
        status,
        canUpload: status === 'missing',
        canReupload: status === 'rejected'
      };
    });
  }, [documents, documentTypes, selectedPostulation]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Calcular estadísticas de documentos
  const documentStats = useMemo(() => {
    const total = documentsByType.length;
    const uploaded = documentsByType.filter(d => d.document).length;
    const missing = documentsByType.filter(d => d.status === 'missing').length;
    const completed = documentsByType.filter(d => d.status === 'completed').length;
    const pending = documentsByType.filter(d => d.status === 'pending').length;
    const rejected = documentsByType.filter(d => d.status === 'rejected').length;
    
    return { total, uploaded, missing, completed, pending, rejected };
  }, [documentsByType]);

  if (!athlete) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Debes registrar tus datos personales primero</p>
          <Button 
            onClick={() => navigate('/user-dashboard/postulations/new/personal-info')}
            className="bg-[#006837] hover:bg-[#005229]"
          >
            Registrar Datos Personales
          </Button>
        </div>
      </div>
    );
  }

  // Vista de lista de postulaciones
  if (!selectedPostulation) {
      return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header mejorado y responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#006837] to-[#00a65a] bg-clip-text text-transparent">
                📄 Mis Documentos
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">
                Selecciona una postulación para ver y gestionar tus documentos
              </p>
            </div>
            <Button
              onClick={loadPostulations}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </motion.div>

                  {loading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-none shadow-xl bg-white/80 backdrop-blur-sm animate-pulse">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="w-48 h-6 bg-gray-200 rounded"></div>
                        <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-32 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : postulations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-16 text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Sin Postulaciones
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  No tienes postulaciones registradas. Crea una nueva postulación para comenzar a gestionar tus documentos.
                </p>
                <Button 
                  onClick={() => navigate('/user-dashboard/postulations')}
                  className="bg-gradient-to-r from-[#006837] to-[#00a65a] hover:from-[#005229] hover:to-[#008347] text-white px-8 py-3 text-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Postulación
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {postulations.map((postulation, index) => (
              <motion.div
                key={postulation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                      onClick={() => setSelectedPostulation(postulation)}>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-[#006837]/10 to-[#00a65a]/10 group-hover:from-[#006837]/20 group-hover:to-[#00a65a]/20 transition-colors">
                            <FileText className="w-6 h-6 text-[#006837]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#006837] transition-colors">
                              {postulation.semester?.name || 'Postulación'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(postulation.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${
                            postulation.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            postulation.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              postulation.status === 'completed' ? 'bg-green-500' :
                              postulation.status === 'active' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}></div>
                            {postulation.status === 'completed' ? 'Completada' :
                             postulation.status === 'active' ? 'Activa' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2 bg-white/50 border-gray-200 hover:bg-[#006837] hover:text-white hover:border-[#006837] transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Documentos
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    );
  }

  // Vista de documentos de la postulación seleccionada
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header limpio y minimalista */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Botón de regreso */}
          <button
            onClick={() => setSelectedPostulation(null)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
          
          {/* Título y descripción simplificados */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                📄 Documentos - {selectedPostulation.semester?.name}
              </h1>
              <p className="text-sm text-gray-500">
                Gestiona los documentos requeridos para esta postulación
              </p>
            </div>
            <button
              onClick={loadDocuments}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
          
          {lastUpdate && (
            <p className="text-xs text-gray-400">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </motion.div>

        {/* Resumen simplificado de documentos */}
        {!loading && documentsByType.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              {/* Resumen compacto */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Requeridos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{documentStats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">Aprobados</p>
                </div>
                {documentStats.pending > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{documentStats.pending}</p>
                    <p className="text-xs text-gray-500 mt-1">En Revisión</p>
                  </div>
                )}
                {documentStats.missing > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">{documentStats.missing}</p>
                    <p className="text-xs text-gray-500 mt-1">Pendientes</p>
                  </div>
                )}
              </div>
              
              {/* Nota informativa solo si hay documentos faltantes */}
              {documentStats.missing > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    <span>
                      Tienes {documentStats.missing} documento{documentStats.missing > 1 ? 's' : ''} pendiente{documentStats.missing > 1 ? 's' : ''} por subir.
                    </span>
                  </p>
                </div>
              )}

              {/* Botón de descarga de reporte - minimalista */}
              {selectedPostulation.status === 'completed' && (
                <button
                  onClick={handleDownloadIndividualReport}
                  disabled={downloadingReport}
                  className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    downloadingReport
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#006837] hover:bg-[#005229] text-white'
                  }`}
                >
                  {downloadingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar Mi Reporte</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}

                {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 space-y-2">
                    <div className="w-48 h-5 bg-gray-200 rounded"></div>
                    <div className="w-full h-4 bg-gray-100 rounded"></div>
                  </div>
                  <div className="w-24 h-6 bg-gray-100 rounded-full"></div>
                </div>
                <div className="flex gap-2 ml-8">
                  <div className="w-20 h-9 bg-gray-100 rounded-lg"></div>
                  <div className="w-20 h-9 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : documentsByType.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tipos de Documentos No Configurados
            </h3>
            <p className="text-sm text-gray-600 mb-2 max-w-md mx-auto">
              No hay tipos de documentos requeridos configurados en el sistema para esta postulación.
            </p>
            <p className="text-xs text-gray-500">
              Por favor, contacta con el administrador del sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documentsByType.map((docType, index) => (
              <motion.div
                key={docType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="p-5">
                    {/* Header del documento */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <h3 className="text-base font-semibold text-gray-900">
                            {docType.name}
                          </h3>
                          {docType.required && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Requerido
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 ml-8">
                          {docType.description}
                        </p>
                      </div>
                      
                      {/* Estado badge minimalista */}
                      <div className="flex-shrink-0">
                        {docType.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Aprobado
                          </span>
                        )}
                        {docType.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                            <AlertCircle className="w-3 h-3" />
                            En Revisión
                          </span>
                        )}
                        {docType.status === 'missing' && (
                          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-200">
                            <XCircle className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información del documento cargado */}
                    {docType.document && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 ml-8">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">📄 Documento PDF</span>
                          {docType.document.status === 'Completado' && (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Verificado por administrador
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 ml-8">
                      {docType.document ? (
                        <>
                          <button
                            onClick={() => handleDownloadDocument(docType.document!)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(docType.document!.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, docType.id, docType.document?.id);
                              }
                            }}
                            className="hidden"
                            id={`file-upload-${docType.id}`}
                            disabled={uploading === docType.id}
                          />
                          <button
                            onClick={() => document.getElementById(`file-upload-${docType.id}`)?.click()}
                            disabled={uploading === docType.id}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#006837] hover:bg-[#005229] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploading === docType.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Subir Documento
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500 ml-8 mt-1">
                            Solo archivos PDF (máx. 10MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Información adicional - simplificada */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Información Importante</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Los documentos requeridos son obligatorios para completar tu postulación</li>
                <li>• Formato soportado: Solo archivos PDF (.pdf)</li>
                <li>• Tamaño máximo por archivo: 10MB</li>
                <li>• Una vez subidos, puedes reemplazar documentos eliminando y subiendo nuevos</li>
                <li>• Los documentos serán revisados por un administrador antes de ser aprobados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 