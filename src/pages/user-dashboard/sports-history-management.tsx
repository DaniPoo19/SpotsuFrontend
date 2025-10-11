import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Medal, 
  Plus, 
  Edit2, 
  Eye, 
  RefreshCw, 
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Award,
  FileText,
  ArrowLeft,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { athletesService } from '@/services/athletes.service';
import { postulationService } from '@/services/postulation.service';
import { attachedDocumentsService } from '@/services/attached-documents.service';
import { api } from '@/lib/axios';

interface SportHistoryAchievement {
  id: string;
  competition_name: string;
  certificate_url?: string;
  status: 'Pendiente' | 'Completado' | 'Cancelado';
  created_at: string;
  updated_at: string;
  sports_achievement?: {
    id: string;
    name: string;
    sports_competition_category: {
      id: string;
      name: string;
    };
    competition_hierarchy: {
      id: string;
      name: string;
    };
  };
}

interface PostulationSport {
  id: string;
  sport: {
    id: string;
    name: string;
  };
  experience_years: number;
  postulation_sport_achievements: SportHistoryAchievement[];
  created_at: string;
  updated_at: string;
}

interface PostulationData {
  id: string;
  athlete_id: string;
  semester: {
    id: string;
    name: string;
  };
  status: string;
  postulation_sports: PostulationSport[];
  sports_history_completed: boolean;
  created_at: string;
}

export const SportsHistoryManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, athlete } = useAuth();
  const [postulations, setPostulations] = useState<PostulationData[]>([]);
  const [selectedPostulation, setSelectedPostulation] = useState<PostulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
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
      
      // Obtener detalles completos de cada postulación con historial deportivo
      const postulationsWithDetails = await Promise.allSettled(
        allPostulations.map(async (postulation) => {
          try {
            const fullPostulation = await postulationService.getPostulationById(postulation.id);
            return fullPostulation;
          } catch (error) {
            console.warn(`Error al cargar postulación ${postulation.id}:`, error);
            return postulation; // Retornar datos básicos si falla
          }
        })
      );
      
      const validPostulations = postulationsWithDetails
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPostulations(validPostulations);
      
      // Si viene con una postulación específica desde el estado, seleccionarla
      if (postulationIdFromState) {
        const targetPostulation = validPostulations.find(p => p.id === postulationIdFromState);
        if (targetPostulation) {
          setSelectedPostulation(targetPostulation);
        }
      }
      
    } catch (error) {
      console.error('Error al cargar postulaciones:', error);
      toast.error('Error al cargar historial deportivo');
    } finally {
      setLoading(false);
    }
  }, [athlete?.id, postulationIdFromState]);

  useEffect(() => {
    loadPostulations();
  }, [loadPostulations]);

  // Actualizar logro (solo el campo competition_name)
  const handleUpdateAchievement = useCallback(async (
    achievementId: string, 
    newCompetitionName: string
  ) => {
    try {
      setUpdating(achievementId);
      
      await api.patch(`/postulation-sport-achievements/${achievementId}`, {
        competition_name: newCompetitionName
      });
      
      toast.success('Logro actualizado exitosamente');
      await loadPostulations();
      
    } catch (error) {
      console.error('Error al actualizar logro:', error);
      toast.error('Error al actualizar logro');
    } finally {
      setUpdating(null);
    }
  }, [loadPostulations]);

  // Subir certificado para un logro
  const handleUploadCertificate = useCallback(async (file: File, achievementId: string) => {
    if (!selectedPostulation) return;

    try {
      setUploading(achievementId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data', JSON.stringify({
        postulation_sport_id: 'temp',
        sport_achievement_id: 'temp',
        competition_name: 'Certificado'
      }));

      // Actualizar el logro con el archivo
      await api.patch(`/postulation-sport-achievements/${achievementId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Certificado subido exitosamente');
      await loadPostulations();
      
    } catch (error: any) {
      console.error('Error al subir certificado:', error);
      toast.error(error.message || 'Error al subir certificado');
    } finally {
      setUploading(null);
    }
  }, [selectedPostulation, loadPostulations]);

  // Descargar certificado
  const handleDownloadCertificate = useCallback((certificateUrl: string) => {
    const apiHost = 'https://api.tracksport.socratesunicordoba.co';
    if (/^https?:\/\//.test(certificateUrl)) {
      window.open(certificateUrl, '_blank');
      return;
    }
    const normalizedPath = certificateUrl.startsWith('/') ? certificateUrl : `/${certificateUrl}`;
    const fileUrl = `${apiHost}${normalizedPath}`;
    window.open(fileUrl, '_blank');
  }, []);

  // Memoizar datos calculados para la postulación seleccionada
  const sportsData = useMemo(() => {
    if (!selectedPostulation?.postulation_sports) return [];
    
    return selectedPostulation.postulation_sports.map(sport => {
      const achievements = sport.postulation_sport_achievements || [];
      const completedAchievements = achievements.filter(a => a.status === 'Completado').length;
      const totalAchievements = achievements.length;
      
      return {
        ...sport,
        completionRate: totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0,
        completedCount: completedAchievements,
        totalCount: totalAchievements
      };
    });
  }, [selectedPostulation?.postulation_sports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Cancelado':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Pendiente':
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completado':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Cancelado':
        return <XCircle className="w-4 h-4" />;
      case 'Pendiente':
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
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
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#006837]">Historial Deportivo</h2>
              <p className="text-gray-600 mt-2">
                Selecciona una postulación para ver y gestionar tu historial deportivo
              </p>
            </div>
            <Button
              onClick={loadPostulations}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-none shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="w-48 h-6 bg-gray-200 rounded"></div>
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="flex gap-4">
                        <div className="w-24 h-8 bg-gray-200 rounded"></div>
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : postulations.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Sin Postulaciones
                </h3>
                <p className="text-gray-600 mb-6">
                  No tienes postulaciones registradas
                </p>
                <Button 
                  onClick={() => navigate('/user-dashboard/postulations')}
                  className="bg-[#006837] hover:bg-[#005229]"
                >
                  Crear Postulación
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {postulations.map((postulation, index) => (
                <motion.div
                  key={postulation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                        onClick={() => setSelectedPostulation(postulation)}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                              <Trophy className="w-5 h-5 text-[#006837]" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {postulation.semester?.name || 'Postulación'}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(postulation.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              postulation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              postulation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {postulation.status === 'completed' ? 'Completada' :
                               postulation.status === 'active' ? 'Activa' : 'Pendiente'}
                            </span>
                            
                            {postulation.postulation_sports && (
                              <span className="text-sm text-gray-600">
                                {postulation.postulation_sports.length} deporte(s) registrado(s)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button variant="outline" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Ver Historial
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

  // Vista de historial deportivo de la postulación seleccionada
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setSelectedPostulation(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight text-[#006837]">
              Historial Deportivo - {selectedPostulation.semester?.name}
            </h2>
            <p className="text-gray-600 mt-2">
              Gestiona tus logros deportivos y certificaciones para esta postulación
            </p>
          </div>
          <Button
            onClick={() => navigate('/user-dashboard/add-sports-achievements', { 
              state: { postulationId: selectedPostulation.id } 
            })}
            className="bg-[#006837] hover:bg-[#005229] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Logros
          </Button>
        </div>

        {sportsData.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Medal className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Sin historial deportivo
              </h3>
              <p className="text-gray-600 mb-6">
                Aún no has registrado logros deportivos para esta postulación
              </p>
              <Button 
                onClick={() => navigate('/user-dashboard/add-sports-achievements', { 
                  state: { postulationId: selectedPostulation.id } 
                })}
                className="bg-[#006837] hover:bg-[#005229] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Registrar Logros Deportivos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sportsData.map((sport, index) => (
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-[#006837] bg-opacity-10">
                          <Trophy className="w-6 h-6 text-[#006837]" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">
                            {sport.sport?.name || 'Deporte'}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {sport.experience_years} años de experiencia
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Progreso</div>
                        <div className="text-lg font-bold text-[#006837]">
                          {sport.completedCount}/{sport.totalCount} logros
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-[#006837] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${sport.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {sport.postulation_sport_achievements.map((achievement) => (
                        <div 
                          key={achievement.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="mb-3">
                                <Input
                                  defaultValue={achievement.competition_name}
                                  onBlur={(e) => {
                                    if (e.target.value !== achievement.competition_name && e.target.value.trim()) {
                                      handleUpdateAchievement(achievement.id, e.target.value.trim());
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  placeholder="Nombre de la competición"
                                  className="font-semibold text-gray-900 border-0 px-0 focus:border-b-2 focus:border-[#006837] focus:ring-0 bg-transparent"
                                  disabled={updating === achievement.id}
                                />
                                {updating === achievement.id && (
                                  <div className="flex items-center gap-2 mt-1 text-xs text-blue-600">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Actualizando...
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                {achievement.sports_achievement && (
                                  <>
                                    <span>
                                      Categoría: {achievement.sports_achievement.sports_competition_category?.name || 'N/A'}
                                    </span>
                                    <span>
                                      Nivel: {achievement.sports_achievement.competition_hierarchy?.name || 'N/A'}
                                    </span>
                                  </>
                                )}
                                {achievement.created_at && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(achievement.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 ml-4">
                              {/* Estado (solo lectura para deportistas) */}
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(achievement.status)}`}>
                                {getStatusIcon(achievement.status)}
                                <span>{achievement.status}</span>
                              </div>

                              {/* Certificado */}
                              {achievement.certificate_url ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCertificate(achievement.certificate_url!)}
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  Ver Certificado
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadCertificate(file, achievement.id);
                                      }
                                    }}
                                    className="hidden"
                                    id={`cert-upload-${achievement.id}`}
                                    disabled={uploading === achievement.id}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`cert-upload-${achievement.id}`)?.click()}
                                    disabled={uploading === achievement.id}
                                    className="flex items-center gap-1"
                                  >
                                    {uploading === achievement.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Upload className="w-3 h-3" />
                                    )}
                                    Subir Certificado
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
                <h4 className="font-semibold text-blue-900 mb-2">Información</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Puedes editar el nombre de la competición haciendo clic en el campo</li>
                  <li>• Sube certificados que respalden tus logros deportivos</li>
                  <li>• El estado de los logros es actualizado por los administradores</li>
                  <li>• Los logros completados con certificados tienen mayor puntaje</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};