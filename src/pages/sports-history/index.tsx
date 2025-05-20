import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInYears, parse } from 'date-fns';
import { 
  Search, Plus, X, Upload, Trophy, Calendar, Medal, 
  FileCheck, ChevronDown, ChevronUp, Clipboard, GraduationCap,
  AlertCircle, CheckCircle2, Loader2, Edit2, Trash2, Save, FileText
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import bloqueNuevo from '@/assets/bloquenuevo.png';
import { sportsService } from '../../services/sports.service';
import { attachedDocumentsService } from '../../services/attached-documents.service';
import { sportHistoriesService } from '../../services/sport-histories.service';
import { sportsAchievementsService } from '../../services/sports-achievements.service';
import { 
  SportDTO, 
  SportsCompetitionCategoryDTO, 
  CompetitionHierarchyDTO,
  AttachedDocumentDTO 
} from '../../types/dtos';
import { Eye, EyeOff } from 'lucide-react';

const sports = [
  'Fútbol', 'Baloncesto', 'Voleibol', 'Natación', 'Atletismo',
  'Tenis', 'Béisbol', 'Gimnasia', 'Ciclismo', 'Boxeo',
  'Karate', 'Taekwondo', 'Judo', 'Rugby', 'Ajedrez'
];

const COMPETITION_TYPES = {
  'Juegos intercolegiados': [
    'Fase municipal',
    'Fase departamental',
    'Fase nacional',
    'Fase internacional'
  ],
  'Deporte asociado': [
    'Interclubes',
    'Campeonatos departamentales',
    'Interligas',
    'Campeonatos zonales o regionales',
    'Campeonato nacional'
  ],
  'Deporte federado': [
    'Selección nacional',
    'Participaciones internacionales',
    'Reconocimientos al mérito deportivo'
  ]
} as const;

const achievementSchema = z.object({
  competitionName: z.string().min(1, 'El nombre de la competencia es requerido'),
  competitionCategory: z.string().min(1, 'La categoría es requerida'),
  competitionType: z.string().min(1, 'El tipo de competencia es requerido'),
  certificate: z.any().optional(),
});

const sportHistorySchema = z.object({
  sport: z.string().min(1, 'El deporte es requerido'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  institution: z.string().optional(),
  achievements: z.array(z.object({
    id: z.string().optional(),
    sportHistoryId: z.string().optional(),
    competitionName: z.string().min(1, 'El nombre de la competencia es requerido'),
    competitionCategory: z.string().min(1, 'La categoría es requerida'),
    competitionType: z.string().min(1, 'El tipo de competencia es requerido'),
    description: z.string().optional(),
    date: z.string().min(1, 'La fecha es requerida'),
    position: z.string().optional(),
    score: z.string().optional(),
    certificate: z.any().optional()
  }))
});

const documentsSchema = z.object({
  consentForm: z.any().optional(),
  MedicCertificate: z.any().optional(),
});

const formSchema = z.object({
  sportsHistory: z.array(sportHistorySchema),
  documents: documentsSchema,
});

const today = new Date();

export const SportsHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [filteredSports, setFilteredSports] = useState<SportDTO[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [showSportSearch, setShowSportSearch] = useState(false);
  const [expandedSports, setExpandedSports] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [achievementInProgress, setAchievementInProgress] = useState<{sportIndex: number, achievementIndex: number} | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<{sportIndex: number, achievementIndex: number} | null>(null);
  const [categories, setCategories] = useState<SportsCompetitionCategoryDTO[]>([]);
  const [competitionTypes, setCompetitionTypes] = useState<CompetitionHierarchyDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<AttachedDocumentDTO[]>([]);
  const [showAddSport, setShowAddSport] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para manejo de carga y errores
  const [isLoadingSports, setIsLoadingSports] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingCompetitionTypes, setIsLoadingCompetitionTypes] = useState(false);
  const [isSubmittingAchievement, setIsSubmittingAchievement] = useState(false);
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sportsHistory: [],
      documents: {
        consentForm: null,
        MedicCertificate: null,
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sportsHistory"
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingSports(true);
      setIsLoadingCategories(true);
      try {
        const [sportsData, categoriesData] = await Promise.all([
          sportsService.getSports(),
          sportsService.getCompetitionCategories()
        ]);
        setSports(sportsData.filter(sport => sport.is_active));
        setCategories(categoriesData.filter(category => category.is_active));
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        toast.error('Error al cargar datos iniciales');
      } finally {
        setIsLoadingSports(false);
        setIsLoadingCategories(false);
      }
    };
    loadInitialData();
  }, []);

  // Cargar tipos de competencia cuando cambia la categoría
  useEffect(() => {
    const loadCompetitionTypes = async () => {
      if (!selectedCategory) {
        setCompetitionTypes([]);
        return;
      }

      setIsLoadingCompetitionTypes(true);
      try {
        const types = await sportsService.getCompetitionHierarchyByCategory(selectedCategory);
        setCompetitionTypes(types);
      } catch (error) {
        console.error('Error al cargar tipos de competencia:', error);
        toast.error('Error al cargar tipos de competencia');
      } finally {
        setIsLoadingCompetitionTypes(false);
      }
    };
    loadCompetitionTypes();
  }, [selectedCategory]);

  useEffect(() => {
    const filtered = sports.filter(
      sport => sport.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedSports.includes(sport.id)
    );
    setFilteredSports(filtered);
  }, [searchTerm, selectedSports, sports]);

  const calculateExperience = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    return differenceInYears(end, start);
  };

  const handleSportSelect = (sport: SportDTO) => {
    if (!selectedSports.includes(sport.id)) {
      setSelectedSports([sport.id, ...selectedSports]);
      append({
        sport: sport.name,
        startDate: '',
        endDate: '',
        institution: '',
        achievements: []
      });
      setSearchTerm('');
      setShowSportSearch(false);
      setExpandedSports([sport.id, ...expandedSports]);
    }
  };

  const toggleSportExpansion = (sport: string) => {
    setExpandedSports(prev => 
      prev.includes(sport) 
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const handleAddAchievement = (sportIndex: number) => {
    const newAchievement = {
      id: undefined,
      sportHistoryId: undefined,
      competitionName: '',
      competitionCategory: '',
      competitionType: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      position: '',
      score: '',
      certificate: null
    };

    const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`) || [];
    form.setValue(`sportsHistory.${sportIndex}.achievements`, [...currentAchievements, newAchievement]);
    setAchievementInProgress({ sportIndex, achievementIndex: currentAchievements.length });
  };

  const handleAchievementComplete = async (sportIndex: number, achievementIndex: number) => {
    const achievement = form.watch(`sportsHistory.${sportIndex}.achievements.${achievementIndex}`);
    
    if (!achievement.competitionName || !achievement.competitionCategory || !achievement.competitionType || !achievement.date) {
      toast.error('Por favor, completa todos los campos requeridos del logro');
      return;
    }

    if (!achievement.certificate) {
      toast.error('Es obligatorio subir un certificado para el logro');
      return;
    }

    setIsSubmittingAchievement(true);
    try {
      // Primero subir el documento
      const documentResponse = await attachedDocumentsService.uploadDocument({
        file: achievement.certificate,
        document_type_id: '1', // Ajustar según el tipo de documento
        reference_id: achievement.id || 'temp',
        reference_type: 'achievement'
      });

      // Luego crear el logro
      const achievementResponse = await sportsAchievementsService.createAchievement({
        sport_history_id: achievement.sportHistoryId || '',
        competition_category_id: achievement.competitionCategory,
        competition_hierarchy_id: achievement.competitionType,
        name: achievement.competitionName,
        description: achievement.description || '',
        date: achievement.date,
        position: achievement.position || '',
        score: achievement.score || ''
      });

      setAchievementInProgress(null);
      toast.success('Logro añadido exitosamente');
    } catch (error) {
      console.error('Error al crear el logro:', error);
      toast.error('Error al crear el logro');
    } finally {
      setIsSubmittingAchievement(false);
    }
  };

  const handleCancelAchievement = (sportIndex: number, achievementIndex: number) => {
    const achievements = form.watch(`sportsHistory.${sportIndex}.achievements`);
    form.setValue(
      `sportsHistory.${sportIndex}.achievements`,
      achievements.filter((_, i) => i !== achievementIndex)
    );
    setAchievementInProgress(null);
    toast.info('Logro cancelado');
  };

  const handleEditAchievement = (sportIndex: number, achievementIndex: number) => {
    setEditingAchievement({ sportIndex, achievementIndex });
  };

  const handleSaveEdit = (sportIndex: number, achievementIndex: number) => {
    const achievement = form.watch(`sportsHistory.${sportIndex}.achievements.${achievementIndex}`);
    
    if (!achievement.competitionName || !achievement.competitionCategory || !achievement.competitionType) {
      toast.error('Por favor, completa todos los campos del logro');
      return;
    }

    setEditingAchievement(null);
    toast.success('Logro actualizado exitosamente');
  };

  const canSaveHistory = () => {
    const hasDocuments = form.watch('documents.consentForm') && form.watch('documents.MedicCertificate');
    const hasSports = form.watch('sportsHistory').length > 0;
    const allSportsHaveAchievements = form.watch('sportsHistory').every(sport => 
      sport.achievements && sport.achievements.length > 0
    );
    
    return hasDocuments && hasSports && allSportsHaveAchievements;
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmittingHistory(true);
    try {
      // Crear el historial deportivo
      const historyResponse = await sportHistoriesService.createHistory({
        athlete_id: 'current-athlete-id', // Obtener del contexto de autenticación
        sport_id: data.sportsHistory[0].sport,
        start_date: data.sportsHistory[0].startDate,
        end_date: data.sportsHistory[0].endDate,
        institution: data.sportsHistory[0].institution || '',
        achievements: JSON.stringify(data.sportsHistory[0].achievements)
      });

      // Subir documentos adjuntos
      if (data.documents.consentForm) {
        await attachedDocumentsService.uploadDocument({
          file: data.documents.consentForm,
          document_type_id: '2', // Ajustar según el tipo de documento
          reference_id: historyResponse.id,
          reference_type: 'sport_history'
        });
      }

      if (data.documents.MedicCertificate) {
        await attachedDocumentsService.uploadDocument({
          file: data.documents.MedicCertificate,
          document_type_id: '3', // Ajustar según el tipo de documento
          reference_id: historyResponse.id,
          reference_type: 'sport_history'
        });
      }

      toast.success('Historial deportivo guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar el historial:', error);
      toast.error('Error al guardar el historial deportivo');
    } finally {
      setIsSubmittingHistory(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (referenceId: string, referenceType: 'sport_history' | 'achievement') => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    try {
      const uploadPromises = selectedFiles.map(file => 
        attachedDocumentsService.uploadDocument({
          file,
          document_type_id: '1', // Ajustar según el tipo de documento
          reference_id: referenceId,
          reference_type: referenceType
        })
      );

      const uploadedDocs = await Promise.all(uploadPromises);
      setUploadedDocuments(prev => [...prev, ...uploadedDocs]);
      setSelectedFiles([]);
      toast.success('Archivos subidos exitosamente');
    } catch (error) {
      console.error('Error al subir archivos:', error);
      toast.error('Error al subir archivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await attachedDocumentsService.deleteDocument(documentId);
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Documento eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative">
      <img
        src={bloqueNuevo}
        alt="Fondo decorativo"
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
        style={{objectPosition: 'center', opacity: 0.32}}
      />
      <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-10 mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
              <Trophy size={24} className="text-[#006837]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Historial Deportivo</h2>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 relative">
              <div className="relative">
                <div className="relative">
                  {!showSportSearch ? (
                    <button
                      type="button"
                      onClick={() => setShowSportSearch(true)}
                      className="w-full px-6 py-3 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors flex items-center justify-center gap-2 mb-6"
                    >
                      <Plus size={20} />
                      Agregar Deporte
                    </button>
                  ) : (
                    <div className="bg-white rounded-xl border p-4 shadow-lg">
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Buscar deporte..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredSports.map((sport) => (
                          <button
                            key={sport.id}
                            type="button"
                            onClick={() => handleSportSelect(sport)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Medal size={18} className="text-[#006837]" />
                            {sport.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 mt-4">
                  {fields.map((field, sportIndex) => {
                    const sport = form.watch(`sportsHistory.${sportIndex}.sport`);
                    const isExpanded = expandedSports.includes(sport);
                    const achievements = form.watch(`sportsHistory.${sportIndex}.achievements`) || [];
                    const hasAchievements = achievements.length > 0;

                    return (
                      <motion.div 
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                          hasAchievements ? 'ring-2 ring-[#006837] ring-opacity-50' : 'ring-2 ring-yellow-200'
                        }`}
                      >
                        <div 
                          className="flex justify-between items-center p-6 cursor-pointer"
                          onClick={() => toggleSportExpansion(sport)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              hasAchievements ? 'bg-[#006837] bg-opacity-10' : 'bg-yellow-100'
                            }`}>
                              <Trophy size={24} className={hasAchievements ? 'text-[#006837]' : 'text-yellow-600'} />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{sport}</h3>
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                {hasAchievements ? (
                                  <>
                                    <CheckCircle2 size={16} className="text-green-500" />
                                    {achievements.length} logro{achievements.length !== 1 ? 's' : ''} registrado{achievements.length !== 1 ? 's' : ''}
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle size={16} className="text-yellow-500" />
                                    Sin logros registrados
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(sportIndex);
                                setSelectedSports(selectedSports.filter(s => s !== sport));
                                setExpandedSports(expandedSports.filter(s => s !== sport));
                              }}
                              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X size={20} />
                            </button>
                            {isExpanded ? (
                              <ChevronUp size={24} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={24} className="text-gray-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t p-6 space-y-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <FormField
                                control={form.control}
                                name={`sportsHistory.${sportIndex}.startDate`}
                                render={({ field }) => {
                                  const endDate = form.watch(`sportsHistory.${sportIndex}.endDate`);
                                  let errorMsg = '';
                                  if (field.value && endDate) {
                                    const start = parse(field.value, 'yyyy-MM-dd', new Date());
                                    const end = parse(endDate, 'yyyy-MM-dd', new Date());
                                    if (end < start) {
                                      errorMsg = 'La fecha de fin no puede ser menor a la fecha de inicio';
                                    } else if (end > today) {
                                      errorMsg = 'La fecha de fin no puede ser mayor a la fecha actual';
                                    }
                                  }
                                  return (
                                    <FormItem>
                                      <FormLabel className="flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-500" />
                                        Fecha de Inicio
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} className="focus-visible:ring-[#006837]" />
                                      </FormControl>
                                      {(errorMsg || form.formState.errors?.sportsHistory?.[sportIndex]?.startDate) && (
                                        <div className="text-red-500 text-xs mt-1">
                                          {errorMsg || form.formState.errors?.sportsHistory?.[sportIndex]?.startDate?.message}
                                        </div>
                                      )}
                                    </FormItem>
                                  );
                                }}
                              />

                              <FormField
                                control={form.control}
                                name={`sportsHistory.${sportIndex}.endDate`}
                                render={({ field }) => {
                                  const startDate = form.watch(`sportsHistory.${sportIndex}.startDate`);
                                  let errorMsg = '';
                                  if (field.value && startDate) {
                                    const start = parse(startDate, 'yyyy-MM-dd', new Date());
                                    const end = parse(field.value, 'yyyy-MM-dd', new Date());
                                    if (end < start) {
                                      errorMsg = 'La fecha de fin no puede ser menor a la fecha de inicio';
                                    } else if (end > today) {
                                      errorMsg = 'La fecha de fin no puede ser mayor a la fecha actual';
                                    }
                                  }
                                  return (
                                    <FormItem>
                                      <FormLabel className="flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-500" />
                                        Fecha de Fin
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} className="focus-visible:ring-[#006837]" />
                                      </FormControl>
                                      {(errorMsg || form.formState.errors?.sportsHistory?.[sportIndex]?.endDate) && (
                                        <div className="text-red-500 text-xs mt-1">
                                          {errorMsg || form.formState.errors?.sportsHistory?.[sportIndex]?.endDate?.message}
                                        </div>
                                      )}
                                    </FormItem>
                                  );
                                }}
                              />

                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Medal size={16} className="text-gray-500" />
                                  Años de Experiencia
                                </FormLabel>
                                <Input
                                  type="number"
                                  value={calculateExperience(
                                    form.watch(`sportsHistory.${sportIndex}.startDate`),
                                    form.watch(`sportsHistory.${sportIndex}.endDate`)
                                  )}
                                  disabled
                                  className="bg-gray-50"
                                />
                              </FormItem>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Trophy size={18} className="text-[#006837]" />
                                  Logros Deportivos
                                </h4>
                                <motion.button
                                  type="button"
                                  onClick={() => handleAddAchievement(sportIndex)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="bg-[#006837] text-white px-6 py-2.5 rounded-lg hover:bg-[#005828] transition-colors flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
                                >
                                  <Plus size={18} />
                                  Añadir Logro
                                </motion.button>
                              </div>

                              {/* Indicador de Estado */}
                              {achievements.length === 0 && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3"
                                >
                                  <AlertCircle size={20} className="text-yellow-600" />
                                  <p className="text-yellow-700">
                                    Este deporte requiere al menos un logro para continuar con el registro
                                  </p>
                                </motion.div>
                              )}

                              {/* Tabla de Logros */}
                              {achievements.length > 0 && !achievementInProgress && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                  className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"
                                >
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 border-b">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Competencia</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Categoría</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tipo</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Certificado</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {achievements.map((achievement, achievementIndex) => {
                                        const isEditing = editingAchievement?.sportIndex === sportIndex && 
                                                        editingAchievement?.achievementIndex === achievementIndex;

                                        return (
                                          <motion.tr 
                                            key={achievementIndex}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: achievementIndex * 0.1 }}
                                            className="border-b last:border-b-0 hover:bg-gray-50"
                                          >
                                            <td className="px-6 py-4">
                                              {isEditing ? (
                                                <FormField
                                                  control={form.control}
                                                  name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionName`}
                                                  render={({ field }) => (
                                                    <Input {...field} className="w-full" />
                                                  )}
                                                />
                                              ) : (
                                                <span className="font-medium text-gray-900">{achievement.competitionName}</span>
                                              )}
                                            </td>
                                            <td className="px-6 py-4">
                                              {isEditing ? (
                                                <FormField
                                                  control={form.control}
                                                  name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionCategory`}
                                                  render={({ field }) => (
                                                    <select {...field} className="w-full px-3 py-2 border rounded-lg">
                                                      <option value="">Seleccionar categoría</option>
                                                      {Object.keys(COMPETITION_TYPES).map((category) => (
                                                        <option key={category} value={category}>
                                                          {category}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  )}
                                                />
                                              ) : (
                                                <span className="text-gray-600">{achievement.competitionCategory}</span>
                                              )}
                                            </td>
                                            <td className="px-6 py-4">
                                              {isEditing ? (
                                                <FormField
                                                  control={form.control}
                                                  name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`}
                                                  render={({ field }) => (
                                                    <select {...field} className="w-full px-3 py-2 border rounded-lg">
                                                      <option value="">Seleccionar tipo</option>
                                                      {COMPETITION_TYPES[achievement.competitionCategory as keyof typeof COMPETITION_TYPES]?.map((type) => (
                                                        <option key={type} value={type}>
                                                          {type}
                                                        </option>
                                                      ))}
                                                    </select>
                                                  )}
                                                />
                                              ) : (
                                                <span className="text-gray-600">{achievement.competitionType}</span>
                                              )}
                                            </td>
                                            <td className="px-6 py-4">
                                              {isEditing ? (
                                                <FormField
                                                  control={form.control}
                                                  name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.certificate`}
                                                  render={({ field }) => (
                                                    <div className="flex items-center gap-2">
                                                      <Input
                                                        type="file"
                                                        onChange={(e) => field.onChange(e.target.files?.[0])}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        className="hidden"
                                                        id={`certificate-${sportIndex}-${achievementIndex}`}
                                                      />
                                                      <label
                                                        htmlFor={`certificate-${sportIndex}-${achievementIndex}`}
                                                        className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-gray-50"
                                                      >
                                                        <Upload size={16} className="text-[#006837]" />
                                                        Cambiar
                                                      </label>
                                                    </div>
                                                  )}
                                                />
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  {achievement.certificate ? (
                                                    <span className="flex items-center gap-1 text-sm text-gray-600">
                                                      <FileText size={16} className="text-green-600" />
                                                      {typeof achievement.certificate === 'object' ? achievement.certificate.name : achievement.certificate}
                                                    </span>
                                                  ) : (
                                                    <span className="text-sm text-red-500 flex items-center gap-1">
                                                      <AlertCircle size={16} />
                                                      Sin certificado
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-6 py-4">
                                              <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                  <>
                                                    <motion.button
                                                      type="button"
                                                      onClick={() => handleSaveEdit(sportIndex, achievementIndex)}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="p-2 text-[#006837] hover:bg-[#006837] hover:bg-opacity-10 rounded-lg transition-colors"
                                                    >
                                                      <Save size={18} />
                                                    </motion.button>
                                                    <motion.button
                                                      type="button"
                                                      onClick={() => setEditingAchievement(null)}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                      <X size={18} />
                                                    </motion.button>
                                                  </>
                                                ) : (
                                                  <>
                                                    <motion.button
                                                      type="button"
                                                      onClick={() => handleEditAchievement(sportIndex, achievementIndex)}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="p-2 text-[#006837] hover:bg-[#006837] hover:bg-opacity-10 rounded-lg transition-colors"
                                                    >
                                                      <Edit2 size={18} />
                                                    </motion.button>
                                                    <motion.button
                                                      type="button"
                                                      onClick={() => {
                                                        const achievements = form.watch(`sportsHistory.${sportIndex}.achievements`);
                                                        form.setValue(
                                                          `sportsHistory.${sportIndex}.achievements`,
                                                          achievements.filter((_, i) => i !== achievementIndex)
                                                        );
                                                        toast.success('Logro eliminado');
                                                      }}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                      <Trash2 size={18} />
                                                    </motion.button>
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                          </motion.tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </motion.div>
                              )}

                              {/* Formulario de nuevo logro */}
                              {achievementInProgress && achievementInProgress.sportIndex === sportIndex && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                  className="bg-gray-50 rounded-xl p-6 ring-2 ring-[#006837]"
                                >
                                  <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-medium text-lg flex items-center gap-2">
                                      <Trophy size={20} className="text-[#006837]" />
                                      Nuevo Logro
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelAchievement(sportIndex, achievementInProgress.achievementIndex)}
                                      className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      <X size={20} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                      control={form.control}
                                      name={`sportsHistory.${sportIndex}.achievements.${achievementInProgress.achievementIndex}.competitionName`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700">Nombre de la Competencia</FormLabel>
                                          <FormControl>
                                            <Input {...field} placeholder="Ej: Campeonato Regional" className="focus-visible:ring-[#006837]" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`sportsHistory.${sportIndex}.achievements.${achievementInProgress.achievementIndex}.competitionCategory`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700">Categoría</FormLabel>
                                          <FormControl>
                                            <select
                                              {...field}
                                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                                            >
                                              <option value="">Seleccionar categoría</option>
                                              {Object.keys(COMPETITION_TYPES).map((category) => (
                                                <option key={category} value={category}>
                                                  {category}
                                                </option>
                                              ))}
                                            </select>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`sportsHistory.${sportIndex}.achievements.${achievementInProgress.achievementIndex}.competitionType`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700">Tipo de Competencia</FormLabel>
                                          <FormControl>
                                            <select
                                              {...field}
                                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                                            >
                                              <option value="">Seleccionar tipo</option>
                                              {COMPETITION_TYPES[form.watch(`sportsHistory.${sportIndex}.achievements.${achievementInProgress.achievementIndex}.competitionCategory`) as keyof typeof COMPETITION_TYPES]?.map((type) => (
                                                <option key={type} value={type}>
                                                  {type}
                                                </option>
                                              ))}
                                            </select>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`sportsHistory.${sportIndex}.achievements.${achievementInProgress.achievementIndex}.certificate`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-gray-700">Certificado <span className="text-red-500">*</span></FormLabel>
                                          <FormControl>
                                            <div className="space-y-2">
                                              <Input
                                                type="file"
                                                onChange={(e) => field.onChange(e.target.files?.[0])}
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                id={`certificate-${sportIndex}-${achievementInProgress.achievementIndex}`}
                                              />
                                              <label
                                                htmlFor={`certificate-${sportIndex}-${achievementInProgress.achievementIndex}`}
                                                className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                              >
                                                <Upload size={18} className="text-[#006837]" />
                                                Subir Certificado
                                              </label>
                                              {field.value && (
                                                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                                                  <FileText size={16} className="text-green-600" />
                                                  <span className="text-sm text-gray-600">
                                                    {typeof field.value === 'object' ? field.value.name : field.value}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="mt-8 flex justify-end gap-3">
                                    <motion.button
                                      type="button"
                                      onClick={() => handleCancelAchievement(sportIndex, achievementInProgress.achievementIndex)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    >
                                      Cancelar
                                    </motion.button>
                                    <motion.button
                                      type="button"
                                      onClick={() => handleAchievementComplete(sportIndex, achievementInProgress.achievementIndex)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-6 py-2.5 bg-[#006837] text-white rounded-lg hover:bg-[#005828] transition-colors font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                      <CheckCircle2 size={18} />
                                      Confirmar Logro
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </form>
            {/* Botón de guardar flotante */}
            <div className="fixed bottom-8 right-8 z-20">
              <motion.button
                type="submit"
                disabled={isSubmitting || !canSaveHistory()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-3 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors font-medium flex items-center gap-2 shadow-lg hover:shadow-xl ${
                  !canSaveHistory() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar Historial
                  </>
                )}
              </motion.button>
            </div>
          </Form>
        </motion.div>
        <div className="bg-white bg-opacity-100 rounded-2xl shadow-lg p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
              <Clipboard size={24} className="text-[#006837]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Documentos Requeridos</h2>
          </div>
          <Form {...form}>
            <form className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="documents.consentForm"
                render={({ field }) => (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <FileCheck size={20} className="text-[#006837]" />
                        Consentimiento Informado
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id="consent-form"
                          />
                          <label
                            htmlFor="consent-form"
                            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#006837] transition-colors"
                          >
                            <Upload size={24} className="text-[#006837]" />
                            <div className="text-center">
                              <p className="font-medium text-gray-700">Subir Consentimiento</p>
                              <p className="text-sm text-gray-500">PDF, JPG o PNG</p>
                            </div>
                          </label>
                          {field.value && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <span className="text-sm text-gray-600 flex items-center gap-2">
                                <FileCheck size={18} className="text-green-600" />
                                {typeof field.value === 'object' ? field.value.name : field.value}
                              </span>
                              <button
                                type="button"
                                onClick={() => field.onChange(null)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="documents.MedicCertificate"
                render={({ field }) => (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <Medal size={20} className="text-[#006837]" />
                        Certificado Médico
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id="Medic-certificate"
                          />
                          <label
                            htmlFor="Medic-certificate"
                            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#006837] transition-colors"
                          >
                            <Upload size={24} className="text-[#006837]" />
                            <div className="text-center">
                              <p className="font-medium text-gray-700">Subir Certificado</p>
                              <p className="text-sm text-gray-500">PDF, JPG o PNG</p>
                            </div>
                          </label>
                          {field.value && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <span className="text-sm text-gray-600 flex items-center gap-2">
                                <FileCheck size={18} className="text-green-600" />
                                {typeof field.value === 'object' ? field.value.name : field.value}
                              </span>
                              <button
                                type="button"
                                onClick={() => field.onChange(null)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                )}
              />
            </form>
          </Form>
        </div>
      </div>
      {isLoadingSports && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#006837]" />
          <span className="ml-2">Cargando deportes...</span>
        </div>
      )}

      {isLoadingCategories && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#006837]" />
          <span className="ml-2">Cargando categorías...</span>
        </div>
      )}

      {isLoadingCompetitionTypes && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#006837]" />
          <span className="ml-2">Cargando tipos de competencia...</span>
        </div>
      )}

      {isSubmittingAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-[#006837] mx-auto" />
            <p className="mt-4 text-center">Guardando logro...</p>
          </div>
        </div>
      )}

      {isSubmittingHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-[#006837] mx-auto" />
            <p className="mt-4 text-center">Guardando historial deportivo...</p>
          </div>
        </div>
      )}
    </div>
  );
};