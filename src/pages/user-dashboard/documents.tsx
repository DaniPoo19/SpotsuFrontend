import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, AlertCircle, Upload, Trash2, Eye, RefreshCw, ArrowLeft, Calendar, User, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { attachedDocumentsService, CreateAttachedDocumentDTO } from '@/services/attached-documents.service';
import { athletesService } from '@/services/athletes.service';
import { documentTypesService, DocumentType } from '@/services/document-types.service';

interface AttachedDocument {
  id: string;
  postulation_id: string;
  attached_document_type_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: 'Completado' | 'Pendiente' | 'Cancelado';
  created_at: string;
  updated_at: string;
  attachedDocumentType?: {
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
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  
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
      
      console.log('[Documents] Cargando documentos para postulación:', selectedPostulation.id);
      
      // Cargar tipos de documentos y documentos adjuntos en paralelo
      const [docTypesResult, allDocsResult] = await Promise.allSettled([
        documentTypesService.getDocumentTypes(),
        attachedDocumentsService.getDocuments()
      ]);
      
      if (docTypesResult.status === 'fulfilled') {
        setDocumentTypes(docTypesResult.value);
      }
      
      if (allDocsResult.status === 'fulfilled') {
        // Filtrar documentos de la postulación seleccionada
        const postulationDocs = allDocsResult.value.filter(doc => 
          doc.postulation_id === selectedPostulation.id
        );
        console.log('[Documents] Documentos encontrados:', postulationDocs);
        setDocuments(postulationDocs);
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
      
      // Recargar documentos
      await loadDocuments();
    } catch (error: any) {
      console.error('Error al subir documento:', error);
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
    const uploadBase = `${import.meta.env.VITE_API_URL || '/api'}/uploads/`;
    const fileUrl = document.file_path.startsWith('http') 
      ? document.file_path 
      : `${uploadBase}${document.file_path}`;
    
    window.open(fileUrl, '_blank');
  }, []);

  // Memoizar datos calculados para la postulación seleccionada
  const documentsByType = useMemo(() => {
    if (!selectedPostulation) return [];
    
    // Usar tipos de documentos reales del backend
    return documentTypes.map(type => {
      const userDoc = documents.find(doc => 
        doc.attached_document_type_id === type.id ||
        doc.attachedDocumentType?.id === type.id
      );
      
      return {
        id: type.id,
        name: type.name,
        description: type.description || 'Documento requerido para la postulación',
        required: true, // Asumir que todos son requeridos
        document: userDoc,
        status: userDoc ? (userDoc.status === 'Completado' ? 'completed' : 'pending') : 'missing' as 'completed' | 'pending' | 'missing'
      };
    });
  }, [documents, documentTypes, selectedPostulation]);

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
    case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'missing':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

  const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5" />;
    case 'missing':
      return <XCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        {/* Header mejorado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#006837] to-[#00a65a] bg-clip-text text-transparent">
              📄 Mis Documentos
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Selecciona una postulación para ver y gestionar tus documentos
            </p>
          </div>
          <Button
            onClick={loadPostulations}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
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
                    <X className="w-4 h-4 text-red-500" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón de regreso mejorado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            onClick={() => setSelectedPostulation(null)}
            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#006837] to-[#00a65a] bg-clip-text text-transparent">
              📄 Documentos - {selectedPostulation.semester?.name}
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Gestiona los documentos requeridos para esta postulación
            </p>
          </div>
          <Button
            onClick={loadDocuments}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </motion.div>

                {loading ? (
          <div className="grid gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="border-none shadow-xl bg-white/80 backdrop-blur-sm animate-pulse">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-5 bg-gray-200 rounded"></div>
                        <div className="w-48 h-4 bg-gray-200 rounded"></div>
                        <div className="w-40 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {documentsByType.map((docType, index) => (
              <motion.div
                key={docType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6 flex-1">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#006837]/10 to-[#00a65a]/10 group-hover:from-[#006837]/20 group-hover:to-[#00a65a]/20 transition-colors">
                          <FileText className="w-8 h-8 text-[#006837]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#006837] transition-colors">
                              {docType.name}
                            </h3>
                            {docType.required && (
                              <span className="text-xs bg-gradient-to-r from-red-100 to-red-50 text-red-800 px-3 py-1 rounded-full border border-red-200 font-medium">
                                Requerido
                              </span>
                            )}
                          </div>
                          <p className="text-base text-gray-600 mb-4 leading-relaxed">
                            {docType.description}
                          </p>
                          {docType.document && (
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">{docType.document.file_name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>📊 {formatFileSize(docType.document.file_size)}</span>
                                <span>📅 {formatDate(docType.document.created_at)}</span>
                                <span className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    docType.document.status === 'Completado' ? 'bg-green-500' :
                                    docType.document.status === 'Pendiente' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}></div>
                                  {docType.document.status}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-4 ml-6">
                        {/* Estado */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-medium text-sm ${getStatusColor(docType.status)}`}>
                          {getStatusIcon(docType.status)}
                          <span>
                            {docType.status === 'completed' ? 'Subido' : 
                             docType.status === 'pending' ? 'Pendiente' : 'Faltante'}
                          </span>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2">
                          {docType.document ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDocument(docType.document!)}
                                className="flex items-center gap-2 bg-white/50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(docType.document!.id)}
                                className="flex items-center gap-2 bg-white/50 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                              <Button
                                onClick={() => document.getElementById(`file-upload-${docType.id}`)?.click()}
                                disabled={uploading === docType.id}
                                className="bg-gradient-to-r from-[#006837] to-[#00a65a] hover:from-[#005229] hover:to-[#008347] text-white flex items-center gap-2 px-6 py-2 text-sm"
                              >
                                {uploading === docType.id ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Subiendo...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    Subir Archivo
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Información Importante</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Los documentos requeridos son obligatorios para completar tu postulación</li>
                  <li>• Formatos soportados: PDF, Word (.doc, .docx), Imágenes (.jpg, .jpeg, .png)</li>
                  <li>• Tamaño máximo por archivo: 10MB</li>
                  <li>• Una vez subidos, puedes reemplazar documentos eliminando y subiendo nuevos</li>
                </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}; 