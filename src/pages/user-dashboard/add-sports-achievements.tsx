import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Medal, 
  Plus, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Upload,
  X,
  Zap,
  Target,
  Calendar,
  User,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';

interface Sport {
  id: string;
  name: string;
}

interface CompetitionCategory {
  id: string;
  name: string;
}

interface CompetitionHierarchy {
  id: string;
  name: string;
}

interface SportsAchievement {
  id: string;
  name: string;
  description: string;
  sports_competition_category: CompetitionCategory;
  competition_hierarchy: CompetitionHierarchy;
}

interface PostulationSport {
  id: string;
  sport: Sport;
  experience_years: number;
}

interface NewAchievement {
  postulation_sport_id: string;
  sport_achievement_id: string;
  competition_name: string;
  file?: File;
}

interface NewSport {
  sport_id: string;
  experience_years: number;
}

export const AddSportsAchievementsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { athlete } = useAuth();
  
  const postulationId = location.state?.postulationId;
  
  const [postulationSports, setPostulationSports] = useState<PostulationSport[]>([]);
  const [availableSports, setAvailableSports] = useState<Sport[]>([]);
  const [sportsAchievements, setSportsAchievements] = useState<SportsAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAddSport, setShowAddSport] = useState(false);
  
  const [newAchievement, setNewAchievement] = useState<NewAchievement>({
    postulation_sport_id: '',
    sport_achievement_id: '',
    competition_name: ''
  });
  
  const [newSport, setNewSport] = useState<NewSport>({
    sport_id: '',
    experience_years: 1
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Cargar datos necesarios
  const loadData = useCallback(async () => {
    if (!postulationId) {
      toast.error('No se especificó la postulación');
      navigate('/user-dashboard/sports-history-management');
      return;
    }

    try {
      setLoading(true);
      
      // Cargar detalles de la postulación, logros disponibles y deportes
      const [postulationResult, achievementsResult, sportsResult] = await Promise.allSettled([
        api.get(`/postulations/${postulationId}`),
        api.get('/sports-achievements'),
        api.get('/sports')
      ]);
      
      if (postulationResult.status === 'fulfilled') {
        const postulation = postulationResult.value.data.data;
        setPostulationSports(postulation.postulation_sports || []);
      }
      
      if (achievementsResult.status === 'fulfilled') {
        setSportsAchievements(achievementsResult.value.data.data || []);
      }
      
      if (sportsResult.status === 'fulfilled') {
        setAvailableSports(sportsResult.value.data.data || []);
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar información');
    } finally {
      setLoading(false);
    }
  }, [postulationId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSport = useCallback(async () => {
    if (!newSport.sport_id || newSport.experience_years < 1) {
      toast.error('Por favor completa todos los campos del deporte');
      return;
    }

    try {
      setSaving(true);
      
      const sportData = {
        postulation_id: postulationId,
        sport_id: newSport.sport_id,
        experience_years: newSport.experience_years
      };

      const response = await api.post('/postulation-sports', sportData);
      
      toast.success('Deporte agregado exitosamente');
      
      // Actualizar la lista de deportes de la postulación
      setPostulationSports(prev => [...prev, response.data.data]);
      
      // Resetear formulario
      setNewSport({ sport_id: '', experience_years: 1 });
      setShowAddSport(false);
      
    } catch (error: any) {
      console.error('Error al agregar deporte:', error);
      toast.error(error.response?.data?.message || 'Error al agregar deporte');
    } finally {
      setSaving(false);
    }
  }, [newSport, postulationId]);

  const handleSaveAchievement = useCallback(async () => {
    if (!newAchievement.postulation_sport_id || !newAchievement.sport_achievement_id || !newAchievement.competition_name.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        postulation_sport_id: newAchievement.postulation_sport_id,
        sport_achievement_id: newAchievement.sport_achievement_id,
        competition_name: newAchievement.competition_name.trim()
      }));
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/postulation-sport-achievements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Logro deportivo agregado exitosamente');
      
      // Regresar a la página de historial deportivo
      navigate('/user-dashboard/sports-history-management', {
        state: { postulationId }
      });
      
    } catch (error: any) {
      console.error('Error al guardar logro:', error);
      toast.error(error.response?.data?.message || 'Error al guardar logro deportivo');
    } finally {
      setSaving(false);
    }
  }, [newAchievement, selectedFile, navigate, postulationId]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de archivo no permitido. Solo PDF, Word o imágenes.');
        return;
      }
      
      setSelectedFile(file);
    }
  }, []);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getUnusedSports = () => {
    const usedSportIds = postulationSports.map(ps => ps.sport.id);
    return availableSports.filter(sport => !usedSportIds.includes(sport.id));
  };

  if (!athlete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Restringido</h2>
            <p className="text-gray-600 mb-6">Debes registrar tus datos personales primero</p>
            <Button 
              onClick={() => navigate('/user-dashboard/postulations/new/personal-info')}
              className="bg-[#006837] hover:bg-[#005229]"
            >
              Registrar Datos Personales
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con navegación mejorada */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/user-dashboard/sports-history-management', {
              state: { postulationId }
            })}
            className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#006837] to-[#00a65a] bg-clip-text text-transparent">
              Agregar Logro Deportivo
            </h1>
            <p className="text-gray-600 mt-2">
              Registra un nuevo logro deportivo para tu postulación
            </p>
          </div>
        </motion.div>

        {/* Indicador de progreso */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div 
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#006837] to-[#00a65a] transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            ></div>
            
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-gradient-to-r from-[#006837] to-[#00a65a] text-white shadow-lg' 
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 whitespace-nowrap">
                  {step === 1 && 'Seleccionar Deporte'}
                  {step === 2 && 'Detalles del Logro'}
                  {step === 3 && 'Certificado'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#006837] mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#006837]/20 to-[#00a65a]/20 animate-pulse"></div>
              </div>
              <p className="text-gray-600 font-medium">Cargando formulario...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Paso 1: Seleccionar Deporte */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-[#006837]/5 to-[#00a65a]/5 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-[#006837] to-[#00a65a]">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        Selecciona el Deporte
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      {/* Deportes existentes */}
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold text-gray-800">Deportes Registrados</Label>
                        {postulationSports.length > 0 ? (
                          <div className="grid gap-3">
                            {postulationSports.map((sport) => (
                              <motion.div
                                key={sport.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                  newAchievement.postulation_sport_id === sport.id
                                    ? 'border-[#006837] bg-[#006837]/5 shadow-md'
                                    : 'border-gray-200 hover:border-[#006837]/50 hover:shadow-sm'
                                }`}
                                onClick={() => setNewAchievement(prev => ({ ...prev, postulation_sport_id: sport.id }))}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Medal className="w-5 h-5 text-[#006837]" />
                                    <div>
                                      <p className="font-semibold text-gray-800">{sport.sport.name}</p>
                                      <p className="text-sm text-gray-600">{sport.experience_years} años de experiencia</p>
                                    </div>
                                  </div>
                                  <ChevronRight className={`w-5 h-5 transition-transform ${
                                    newAchievement.postulation_sport_id === sport.id ? 'rotate-90 text-[#006837]' : 'text-gray-400'
                                  }`} />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay deportes registrados</p>
                          </div>
                        )}
                      </div>

                      {/* Opción para agregar nuevo deporte */}
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-lg font-semibold text-gray-800">¿No encuentras tu deporte?</Label>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddSport(!showAddSport)}
                            className="flex items-center gap-2"
                          >
                            <Plus className={`w-4 h-4 transition-transform ${showAddSport ? 'rotate-45' : ''}`} />
                            {showAddSport ? 'Cancelar' : 'Agregar Deporte'}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {showAddSport && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-gray-50 rounded-xl p-6 space-y-4"
                            >
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Deporte *</Label>
                                  <Select
                                    value={newSport.sport_id}
                                    onValueChange={(value) => setNewSport(prev => ({ ...prev, sport_id: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona un deporte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getUnusedSports().map((sport) => (
                                        <SelectItem key={sport.id} value={sport.id}>
                                          {sport.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Años de Experiencia *</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={newSport.experience_years}
                                    onChange={(e) => setNewSport(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 1 }))}
                                    placeholder="Ej: 5"
                                  />
                                </div>
                              </div>
                              
                              <Button
                                onClick={handleAddSport}
                                disabled={saving}
                                className="bg-[#006837] hover:bg-[#005229] w-full"
                              >
                                {saving ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Agregando...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Deporte
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={nextStep}
                          disabled={!newAchievement.postulation_sport_id}
                          className="bg-[#006837] hover:bg-[#005229] flex items-center gap-2"
                        >
                          Continuar
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Paso 2: Detalles del Logro */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-[#006837]/5 to-[#00a65a]/5 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-[#006837] to-[#00a65a]">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        Detalles del Logro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      {/* Selección de Logro Deportivo */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Tipo de Logro *</Label>
                        <Select
                          value={newAchievement.sport_achievement_id}
                          onValueChange={(value) => setNewAchievement(prev => ({ ...prev, sport_achievement_id: value }))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecciona el tipo de logro" />
                          </SelectTrigger>
                          <SelectContent>
                            {sportsAchievements.map((achievement) => (
                              <SelectItem key={achievement.id} value={achievement.id}>
                                <div className="py-2">
                                  <p className="font-medium">{achievement.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {achievement.sports_competition_category.name} - {achievement.competition_hierarchy.name}
                                  </p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Nombre de la Competición */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Nombre de la Competición *</Label>
                        <Input
                          value={newAchievement.competition_name}
                          onChange={(e) => setNewAchievement(prev => ({ ...prev, competition_name: e.target.value }))}
                          placeholder="Ej: Campeonato Nacional de Fútbol 2024"
                          className="h-12 text-base"
                        />
                        <p className="text-sm text-gray-500">Especifica el nombre exacto de la competición o evento</p>
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button
                          variant="outline"
                          onClick={prevStep}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        <Button
                          onClick={nextStep}
                          disabled={!newAchievement.sport_achievement_id || !newAchievement.competition_name.trim()}
                          className="bg-[#006837] hover:bg-[#005229] flex items-center gap-2"
                        >
                          Continuar
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Paso 3: Certificado */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-[#006837]/5 to-[#00a65a]/5 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-[#006837] to-[#00a65a]">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        Certificado del Logro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      {/* Upload de Certificado */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Certificado (Opcional)</Label>
                        <div 
                          className={`border-2 border-dashed rounded-xl p-8 transition-all ${
                            selectedFile 
                              ? 'border-[#006837] bg-[#006837]/5' 
                              : 'border-gray-300 hover:border-[#006837]/50'
                          }`}
                        >
                          {selectedFile ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center"
                            >
                              <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                                <div className="p-3 rounded-full bg-[#006837]/10">
                                  <Medal className="w-6 h-6 text-[#006837]" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={removeFile}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Sube un certificado
                              </h3>
                              <p className="text-sm text-gray-500 mb-4">
                                Documenta tu logro con un certificado oficial
                              </p>
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                              />
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="flex items-center gap-2 mx-auto"
                              >
                                <Upload className="w-4 h-4" />
                                Seleccionar Archivo
                              </Button>
                              <p className="text-xs text-gray-400 mt-3">
                                PDF, Word o Imágenes (máx. 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button
                          variant="outline"
                          onClick={prevStep}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        <Button
                          onClick={handleSaveAchievement}
                          disabled={saving}
                          className="bg-gradient-to-r from-[#006837] to-[#00a65a] hover:from-[#005229] hover:to-[#008347] text-white flex items-center gap-2 px-8"
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Guardar Logro
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Información adicional */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">💡 Consejos Importantes</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Todos los campos marcados con (*) son obligatorios</li>
                        <li>• El certificado es opcional pero recomendado para validar tu logro</li>
                        <li>• Puedes agregar un nuevo deporte si no aparece en tu lista</li>
                        <li>• Una vez guardado, podrás editar el nombre de la competición</li>
                        <li>• El estado del logro será evaluado por los administradores</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};