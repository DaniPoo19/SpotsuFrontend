import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInYears, parse } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Plus, X, Upload, Trophy, Calendar, Medal, 
  FileCheck, ChevronDown, ChevronUp, Clipboard, GraduationCap,
  AlertCircle, CheckCircle2, Loader2, Edit2, Trash2, Save, FileText, User, Mail
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
  Sport, 
  CompetitionCategory, 
  CompetitionHierarchy, 
  CreateAttachedDocumentDTO, 
  PersonDTO, 
  Achievement, 
  SportHistory, 
  FormValues, 
  UserRole,
  PostulationDTO,
  AthleteDTO
} from '../../types/dtos';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { postulationService } from '../../services/postulation.service';
import { api } from '../../services/api';
import { authService } from '../../services/auth.service';
import axios from 'axios';
import type { AttachedDocumentType } from '../../services/sports.service';

const sports = [
  'Fútbol', 'Baloncesto', 'Voleibol', 'Natación', 'Atletismo',
  'Tenis', 'Béisbol', 'Gimnasia', 'Ciclismo', 'Boxeo',
  'Karate', 'Taekwondo', 'Judo', 'Rugby', 'Ajedrez'
];

const today = new Date();

// Esquemas de validación
const achievementBase = z.object({
  id: z.string().optional(),
  achievement_type_id: z.string().optional(),
  competition_category_id: z.string().optional(),
  competition_hierarchy_id: z.string().optional(),
  achievement_date: z.string().optional(),
  description: z.string().optional(),
  attached_document: z.any().optional(),
  attached_document_type_id: z.string().optional(),
  competitionCategory: z.string().optional(),
  competitionType: z.string().optional(),
  competitionName: z.string().optional(),
  date: z.string().optional(),
  position: z.string().optional(),
  score: z.union([z.string(), z.number()]).optional()
});

const achievementSchema = achievementBase.superRefine((val, ctx) => {
  // Solo validar campos obligatorios si es un nuevo logro (sin id)
  if (!val.id) {
    if (!val.achievement_type_id || val.achievement_type_id.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['achievement_type_id'], message: 'El tipo de logro es requerido' });
    }
    if (!val.competition_category_id || val.competition_category_id.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['competition_category_id'], message: 'La categoría es requerida' });
    }
    if (!val.competition_hierarchy_id || val.competition_hierarchy_id.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['competition_hierarchy_id'], message: 'El tipo de competencia es requerido' });
    }
    if (!val.achievement_date || val.achievement_date.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['achievement_date'], message: 'La fecha es requerida' });
    }
    if (!val.description || val.description.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['description'], message: 'La descripción es requerida' });
    }
  }
});

const sportHistorySchema = z.object({
  sport_id: z.string().min(1, "El deporte es requerido"),
  achievements: z.array(achievementSchema),
  sport: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  institution: z.string().optional()
});

const formSchema = z.object({
  sportsHistory: z.array(sportHistorySchema),
  documents: z.object({
    consentForm: z.any({ required_error: 'Debe adjuntar el consentimiento informado' })
      .refine((v) => !!v, { message: 'Debe adjuntar el consentimiento informado' }),
    MedicCertificate: z.any({ required_error: 'Debe adjuntar el certificado médico' })
      .refine((v) => !!v, { message: 'Debe adjuntar el certificado médico' })
  })
});

// Caché global para tipos de competencia por categoría (evita peticiones repetidas)
const competitionTypesCache: Record<string, CompetitionHierarchy[]> = {};

export const SportsHistoryPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [sportsHistory, setSportsHistory] = useState<SportHistory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHistory, setEditingHistory] = useState<SportHistory | null>(null);
  const [postulation, setPostulation] = useState<PostulationDTO | null>(null);
  const [athlete, setAthlete] = useState<AthleteDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<PersonDTO | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [postulationId, setPostulationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [filteredSports, setFilteredSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [showSportSearch, setShowSportSearch] = useState(false);
  const [expandedSports, setExpandedSports] = useState<string[]>([]);
  const [achievementInProgress, setAchievementInProgress] = useState<{sportIndex: number, achievementIndex: number} | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<{sportIndex: number, achievementIndex: number} | null>(null);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isLoadingSports, setIsLoadingSports] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmittingAchievement, setIsSubmittingAchievement] = useState(false);
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);
  const [competitionTypes, setCompetitionTypes] = useState<CompetitionHierarchy[]>([]);
  const [localCompetitionTypes, setLocalCompetitionTypes] = useState<CompetitionHierarchy[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const prevCategoryRef = useRef<string | null>(null);
  // Mapa para almacenar postulationSportId por sport_id
  const [postulationSportsMap, setPostulationSportsMap] = useState<Record<string, string>>({});
  const [attachedDocTypes, setAttachedDocTypes] = useState<AttachedDocumentType[]>([]);

  // Inicializar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sportsHistory: [],
      documents: {
        consentForm: undefined,
        MedicCertificate: undefined
      }
    }
  });

  // Obtener los campos del formulario
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sportsHistory"
  });

  // Logs de diagnóstico solo en entorno de desarrollo y solo una vez
  const hasLoggedRef = React.useRef(false);
  if (import.meta.env.DEV && !hasLoggedRef.current) {
    console.log('=== SportsHistoryPage (montado) ===');
    console.log('Usuario:', user);
    console.log('Location:', location.pathname);
    console.log('Search:', location.search);
    hasLoggedRef.current = true;
  }

  // Helper: obtener abreviación del tipo de documento
  const getDocumentAbbrev = (docName?: string) => {
    if (!docName) return '';
    const lower = docName.toLowerCase();
    if (lower.includes('tarjeta') && lower.includes('identidad')) return 'TI';
    if (lower.includes('cédula') && lower.includes('ciudad')) return 'CC';
    return docName;
  };

  // Verificación inicial de autenticación (ahora espera a que AuthContext termine de cargar)
  useEffect(() => {
    const initializeAuth = async () => {
      if (authLoading) return; // Esperar a que el contexto termine de cargar

      console.log('=== Verificación inicial de autenticación ===');
      const token = localStorage.getItem('auth_token');
      
      console.log('[SportsHistory][Auth] user:', user);
      console.log('[SportsHistory][Auth] token presente?:', !!token);

      if (!user || !token) {
        console.warn('[SportsHistory][Auth] Falta usuario o token. user?', !!user, 'token?', !!token);
        console.warn('[SportsHistory][Auth] Redirigiendo al login');
        navigate('/login', { state: { from: location } });
        return;
      }

      // Configurar el token en los headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Headers de axios configurados:', api.defaults.headers.common);

      // Verificar que el token se configuró correctamente
      if (!api.defaults.headers.common['Authorization']) {
        console.error('[SportsHistory][Auth] Error: No se pudo configurar el token en los headers');
        toast.error('Error de autenticación');
        navigate('/login', { state: { from: location } });
        return;
      }

      console.log('[SportsHistory][Auth] Autenticación verificada, continuando...');
    };

    initializeAuth();
  }, [authLoading, user, navigate, location]);

  useEffect(() => {
    const initializePage = async () => {
      console.log('=== INICIO initializePage ===');
      try {
        // Obtener el ID de la postulación de la URL
        const searchParams = new URLSearchParams(location.search);
        const postulationId = searchParams.get('postulationId');
        console.log('ID de postulación de la URL:', postulationId);

        if (!postulationId) {
          console.error('No se encontró el ID de la postulación en la URL');
          toast.error('Error: No se encontró la postulación');
          navigate('/user-dashboard');
          return;
        }

        // Cargar datos de la postulación
        const postulationResponse = await api.get(`/postulations/${postulationId}`);
        console.log('Respuesta de postulación:', postulationResponse.data);
        const postulationData = postulationResponse.data?.data ?? postulationResponse.data;
        setPostulation(postulationData);
        setPostulationId(postulationId);

        // Cargar datos del atleta
        const athleteResponse = await api.get(`/athletes/${postulationData.athlete.id}`);
        console.log('Respuesta de atleta:', athleteResponse.data);
        const athleteData = athleteResponse.data?.data ?? athleteResponse.data;
        setAthlete(athleteData);

        // Extraer historial deportivo y logros de la postulación
        const sportsHistoryData = postulationData.postulation_sports || [];
        if (sportsHistoryData.length > 0) {
          
          // Unificar por deporte
          const mapBySport = new Map<string, any>();

          sportsHistoryData.forEach((ps: any) => {
            const sportId = ps.sport.id;
            const baseObj = mapBySport.get(sportId);

            const achievements: any[] = ps.postulation_sport_achievements?.map((psa: any) => {
              const ach = psa.sports_achievement;
              return {
                id: ach.id,
                achievement_type_id: ach.achievement_type_id,
                competition_category_id: ach.sports_competition_category?.id,
                competition_hierarchy_id: ach.competition_hierarchy?.id,
                competitionCategory: ach.sports_competition_category?.name,
                competitionType: ach.competition_hierarchy?.name,
                competitionName: ach.name,
                description: ach.description,
                achievement_date: ach.date,
                position: ach.position,
                score: ach.score,
                certificate_url: psa.certificate_url,
                attached_document: psa.certificate_url
              };
            }) || [];

            if (baseObj) {
              // combinar logros
              baseObj.achievements.push(...achievements);
            } else {
              mapBySport.set(sportId, {
                sport_id: sportId,
                sport: ps.sport,
                startDate: ps.start_date,
                endDate: ps.end_date,
                experience_years: ps.experience_years,
                achievements
              });
            }
          });

          const formattedHistory = Array.from(mapBySport.values());

          // Obtener documentos adjuntos de la postulación para enlazar certificados
          let docsByAchievement: Record<string, any> = {};
          try {
            const allDocs = await attachedDocumentsService.getDocuments();
            docsByAchievement = allDocs
              .filter((d: any) => d.postulation_id === postulationId && d.reference_type === 'achievement')
              .reduce((acc: any, d: any) => {
                acc[d.reference_id] = d.file_path || d.file_name || null;
                return acc;
              }, {});
          } catch (err) {
            console.warn('No se pudieron cargar documentos adjuntos:', err);
          }

          // Vincular certificados: si aún no hay documento en el logro, buscar en el mapeo por ID
          formattedHistory.forEach((history: any) => {
            history.achievements = (history.achievements as any[]).map((ach: any) => ({
              ...ach,
              attached_document: (ach.attached_document || docsByAchievement[ach.id] || null) as any
            }));
          });

          setSportsHistory(formattedHistory as unknown as SportHistory[]);
          
          // Actualizar el estado de deportes seleccionados
          setSelectedSports(formattedHistory.map((history: { sport_id: string }) => history.sport_id));
          
          // Expandir las cards de deportes que tienen logros
          setExpandedSports(formattedHistory.map((history: { sport: { name: string } }) => history.sport.name));

        // Inicializar el formulario con los datos cargados
          form.reset({
            sportsHistory: formattedHistory,
            documents: {
              consentForm: undefined,
              MedicCertificate: undefined
            }
          });
        }
      } catch (error: unknown) {
        console.error('Error al cargar datos:', error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            console.log('Error de autenticación');
            toast.error('Su sesión ha expirado. Por favor, inicie sesión nuevamente');
            navigate('/login', { state: { from: location } });
          } else {
            console.error('Error de API:', error.response?.data);
            setError(error.response?.data?.message || 'Error al cargar los datos');
          }
        } else {
          console.error('Error desconocido:', error);
          setError('Error al cargar los datos');
        }
      } finally {
        setIsLoading(false);
      }
      console.log('=== FIN initializePage ===');
    };

    if (user) {
      initializePage();
    }
  }, [user, navigate, location, form]);

  // Cargar deportes y categorías desde el backend
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('[SportsHistory][loadInitialData] Iniciando carga de datos iniciales');
      try {
        setIsLoading(true);
        setIsLoadingSports(true);
        setIsLoadingCategories(true);

        // Obtener el ID de la postulación
        const urlParams = new URLSearchParams(location.search);
        const postId = urlParams.get('postulationId');
        console.log('[SportsHistory][loadInitialData] ID de postulación desde URL:', postId);

        if (!postId) {
          console.error('[SportsHistory][loadInitialData] No se encontró ID de postulación en la URL');
          toast.error('No se encontró la postulación');
          navigate('/user-dashboard/postulations');
          return;
        }

        setPostulationId(postId);

        // Cargar datos de la postulación
        console.log('[SportsHistory][loadInitialData] Cargando datos de la postulación:', postId);
        const postulationData = await postulationService.getPostulationById(postId);
        console.log('[SportsHistory][loadInitialData] Datos de postulación cargados:', postulationData);
        setPostulation(postulationData);

        // Cargar deportes
        console.log('[SportsHistory][loadInitialData] Cargando lista de deportes');
        const sportsData = await sportsService.getSports();
        console.log('[SportsHistory][loadInitialData] Deportes cargados:', sportsData);
        setSports(sportsData);
        setFilteredSports(sportsData);

        // Cargar historial deportivo existente
        console.log('[SportsHistory][loadInitialData] Cargando historial deportivo para la postulación:', postId);
        const history = await sportHistoriesService.getSportHistoriesByPostulation(postId);
        console.log('[SportsHistory][loadInitialData] Historial deportivo cargado:', history);
        setSportsHistory(history as unknown as SportHistory[]);

        // Cargar categorías
        console.log('[SportsHistory][loadInitialData] Cargando categorías de competencia');
        const categoriesData = await api.get('/sports-competition-categories');
        console.log('[SportsHistory][loadInitialData] Categorías cargadas:', categoriesData.data);
        setCategories(categoriesData.data.data);

        // Cargar tipos de documento adjunto
        console.log('[SportsHistory][loadInitialData] Cargando tipos de documentos adjuntos');
        try {
          const types = await sportsService.getAttachedDocumentTypes();
          console.log('[SportsHistory][loadInitialData] Tipos de documento cargados:', types);
          setAttachedDocTypes(types);
        } catch (err) {
          console.error('[SportsHistory][loadInitialData] Error cargando tipos de documento:', err);
        }

      } catch (error: any) {
        console.error('[SportsHistory][loadInitialData] Error al cargar datos iniciales:', error);
        toast.error(error.message || 'Error al cargar los datos');
      } finally {
        setIsLoading(false);
        setIsLoadingSports(false);
        setIsLoadingCategories(false);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user, navigate, location, form]);

  // Filtrar deportes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSports(sports.filter(sport => !selectedSports.includes(sport.id)));
    } else {
    const filtered = sports.filter(
        sport => 
          sport.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedSports.includes(sport.id)
    );
    setFilteredSports(filtered);
    }
  }, [searchTerm, selectedSports, sports]);

  const calculateExperience = (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return 0;
    try {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
      const end = parse(endDate, 'yyyy-MM-dd', new Date());
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
      const years = differenceInYears(end, start);
      return years < 0 ? 0 : years;
    } catch {
      return 0;
    }
  };

  const handleSportSelect = (sport: Sport) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    if (!selectedSports.includes(sport.id)) {
      setSelectedSports([...selectedSports, sport.id]);
      append({
        sport_id: sport.id,
        sport: sport,
        achievements: []
      });
    }
    setShowSportSearch(false);
    setSearchTerm('');
  };

  const toggleSportExpansion = (sportName: string) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    setExpandedSports(prev => 
      prev.includes(sportName) 
        ? prev.filter(s => s !== sportName)
        : [...prev, sportName]
    );
  };

  const handleAddAchievement = (sportIndex: number) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    const newAchievement: Achievement & { tempId: string } = {
      achievement_type_id: '',
      competition_category_id: '',
      competition_hierarchy_id: '',
      achievement_date: new Date().toISOString().split('T')[0],
      description: '',
      tempId: (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
    };

    const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`) || [];
    form.setValue(`sportsHistory.${sportIndex}.achievements`, [...currentAchievements, newAchievement]);
    setAchievementInProgress({ sportIndex, achievementIndex: currentAchievements.length });
  };

  const handleCategoryChange = async (categoryId: string, sportIndex: number, achievementIndex: number) => {
    console.log('[SportsHistory][handleCategoryChange] Iniciando cambio de categoría:', {
      categoryId,
      sportIndex,
      achievementIndex
    });
    
    try {
      setIsLoadingTypes(true);
      
      // Obtener tipos de competencia para la categoría
      console.log('[SportsHistory][handleCategoryChange] Obteniendo tipos de competencia para categoría:', categoryId);
      const response = await api.get(`/sports-competition-hierarchies/by-category/${categoryId}`);
      const raw = response.data.data.map((item: any) => ({
        id: item.competition_hierarchy?.id || item.id || '',
        name: item.competition_hierarchy?.name || item.name || '',
        competition_hierarchy: item.competition_hierarchy ?? item,
        score: item.score ?? 0,
        is_active: item.is_active ?? true
      }));
      // Filtrar duplicados por id
      const unique: CompetitionHierarchy[] = Array.from(new Map(raw.map((t: any) => [t.id, t])).values()) as CompetitionHierarchy[];
      competitionTypesCache[categoryId as string] = unique;
      setLocalCompetitionTypes(unique);
      setCompetitionTypes(unique);
      
    } catch (error: any) {
      console.error('[SportsHistory][handleCategoryChange] Error al obtener tipos de competencia:', error);
      toast.error('Error al cargar los tipos de competencia');
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleCompetitionTypeChange = (typeId: string, sportIndex: number, achievementIndex: number) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    if (!typeId) {
      toast.error('Por favor seleccione un tipo de competencia válido');
      return;
    }

    // Obtener el tipo seleccionado
    const selectedType = competitionTypes.find(type => type.id === typeId);
                    if (selectedType) {
      // Actualizar los valores del formulario
      form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_hierarchy_id`, typeId);
                      form.setValue(
                        `sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`,
        selectedType.name || selectedType.competition_hierarchy?.name || ''
      );
    }
  };

  const handleAchievementComplete = async (sportIndex: number, achievementIndex: number) => {
    // Evitar doble clic mientras se procesa
    if (isSubmittingAchievement) return;

    console.log('[SportsHistory][handleAchievementComplete] Iniciando guardado de logro:', {
      sportIndex,
      achievementIndex
    });

    try {
      setIsSubmittingAchievement(true);
      
      const achievementData = form.getValues(`sportsHistory.${sportIndex}.achievements.${achievementIndex}`);
      console.log('[SportsHistory][handleAchievementComplete] Datos del logro a guardar:', achievementData);

      // Validar datos del logro
      if (!achievementData.competition_category_id || !achievementData.competition_hierarchy_id) {
        console.error('[SportsHistory][handleAchievementComplete] Faltan datos requeridos:', achievementData);
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      // 1. Asegurar que exista la relación postulation-sport para este deporte
      const sportHistoryData = form.getValues(`sportsHistory.${sportIndex}`);
      const sportId = sportHistoryData?.sport_id || sports[sportIndex]?.id;

      if (!sportId) {
        toast.error('No se encontró el deporte seleccionado');
        return;
      }

      let postulationSportId = postulationSportsMap[sportId];

      if (!postulationSportId) {
        const experienceYears = calculateExperience(sportHistoryData.startDate, sportHistoryData.endDate);
        console.log('[SportsHistory][handleAchievementComplete] Creando PostulationSport para deporte', sportId);
        const postulationSportResp = await sportsService.createPostulationSport({
          postulation_id: postulationId,
          sport_id: sportId,
          experience_years: experienceYears
        });

        postulationSportId = postulationSportResp.id;
        setPostulationSportsMap(prev => ({ ...prev, [sportId]: postulationSportId }));
      }

      // 2. Crear logro y vincularlo en un solo paso
      console.log('[SportsHistory][handleAchievementComplete] Creando y vinculando logro');
      const linkedAchievement = await sportsService.createSportsAchievementWithLink(postulationSportId, {
        competition_category_id: achievementData.competition_category_id as string,
        competition_hierarchy_id: achievementData.competition_hierarchy_id as string,
        name: achievementData.competitionName || '',
        description: achievementData.description || '',
        date: achievementData.achievement_date,
        position: achievementData.position || '',
        score: '0',
        file: achievementData.attached_document || null,
      } as any);
      console.log('[SportsHistory][handleAchievementComplete] Logro vinculado:', linkedAchievement);

      // 3. Actualizar formulario con ID real para evitar duplicados
      form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.id`, linkedAchievement.sport_achievement_id || linkedAchievement.id);

      // Finalizar
      setAchievementInProgress(null);
      
      // Recargar historial deportivo
      console.log('[SportsHistory][handleAchievementComplete] Recargando historial deportivo');
      const updatedHistory = await sportHistoriesService.getSportHistoriesByPostulation(postulationId);
      console.log('[SportsHistory][handleAchievementComplete] Historial actualizado:', updatedHistory);
      setSportsHistory(updatedHistory as unknown as SportHistory[]);

      toast.success('Logro guardado exitosamente');
    } catch (error: any) {
      console.error('[SportsHistory][handleAchievementComplete] Error al guardar logro:', error);
      toast.error(error.message || 'Error al guardar el logro');
    } finally {
      setIsSubmittingAchievement(false);
    }
  };

  const handleEditAchievement = (sportIndex: number, achievementIndex: number) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }
    setEditingAchievement({ sportIndex, achievementIndex });
  };

  const handleSaveEdit = async (sportIndex: number, achievementIndex: number) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    const achievement = form.getValues(`sportsHistory.${sportIndex}.achievements.${achievementIndex}`);
    const sport = form.getValues(`sportsHistory.${sportIndex}`);

    try {
      if (achievement.id) {
        await sportsService.updateSportsAchievement(achievement.id, {
          achievement_type_id: achievement.achievement_type_id as string,
          competition_category_id: achievement.competition_category_id as string,
          competition_hierarchy_id: achievement.competition_hierarchy_id as string,
          achievement_date: achievement.achievement_date as string,
          description: (achievement.description || '') as string
        });

        if (achievement.attached_document && achievement.attached_document_type_id) {
          await sportsService.uploadAttachedDocument({
            sports_achievement_id: achievement.id,
            attached_document_type_id: achievement.attached_document_type_id,
            file: achievement.attached_document
          });
        }
      }

      setEditingAchievement(null);
      toast.success('Logro deportivo actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar logro:', error);
      toast.error('Error al actualizar logro deportivo');
    }
  };

  const handleCancelAchievement = (sportIndex: number, achievementIndex: number) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`);
    form.setValue(
      `sportsHistory.${sportIndex}.achievements`,
      currentAchievements.filter((_, index) => index !== achievementIndex)
    );
    setAchievementInProgress(null);
  };

  const handleDeleteAchievement = async (sportIndex: number, achievementIndex: number) => {
    if (!postulation) {
      toast.error('No se encontró la postulación');
      return;
    }

    const achievement = form.getValues(`sportsHistory.${sportIndex}.achievements.${achievementIndex}`);
    
    if (achievement.id) {
      try {
        await sportsService.deleteSportsAchievement(achievement.id);
        const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`);
        form.setValue(
          `sportsHistory.${sportIndex}.achievements`,
          currentAchievements.filter((_, index) => index !== achievementIndex)
        );
        toast.success('Logro deportivo eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar logro:', error);
        toast.error('Error al eliminar logro deportivo');
      }
    }
  };

  const canSaveHistory = () => {
    const sportsHist = form.getValues('sportsHistory');
    const hasSports = sportsHist.length > 0;
    const allSportsHaveAchievements = sportsHist.every(s => s.achievements && s.achievements.length > 0);
    return hasSports && allSportsHaveAchievements;
  };

  // Función para manejar errores de validación del formulario
  const onFormError = (errors: any) => {
    console.error('[SportsHistory][onFormError] Errores de validación:', JSON.parse(JSON.stringify(errors, null, 2)));
    toast.error('Por favor corrige los errores antes de guardar');
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('[SportsHistory][handleSubmit] Iniciando guardado del historial deportivo');
    console.log('[SportsHistory][handleSubmit] Datos del formulario:', data);

    if (!postulation) {
      console.error('[SportsHistory][handleSubmit] Error: No se encontró la postulación');
      toast.error('No se encontró la postulación');
      return;
    }

    if (!postulationId) {
      console.log('[SportsHistory][handleSubmit] No hay ID de postulación, intentando crear una nueva');
      try {
        const newPostulation = await postulationService.createPostulation();
        console.log('[SportsHistory][handleSubmit] Nueva postulación creada:', newPostulation);
        setPostulationId(newPostulation.id);
      } catch (error) {
        console.error('[SportsHistory][handleSubmit] Error al crear postulación:', error);
        toast.error('No se pudo crear una nueva postulación. Por favor, intente nuevamente.');
        return;
      }
    }

    if (!user?.id) {
      console.error('[SportsHistory][handleSubmit] Error: No se encontró el ID del usuario');
      toast.error('No se ha encontrado el ID del usuario');
      return;
    }

    // Limpiar logros incompletos para evitar fallos de validación/back
    data.sportsHistory = data.sportsHistory.map((history: any) => {
      const completed = (history.achievements || []).filter((ach: any) => {
        return (
          ach.id ||
          (ach.achievement_type_id && ach.competition_category_id && ach.competition_hierarchy_id && ach.achievement_date && (ach.description || ach.competitionName))
        );
      });
      return { ...history, achievements: completed };
    });

    setIsSubmitting(true);
    try {
      // Procesar cada historial deportivo
      for (let i = 0; i < data.sportsHistory.length; i++) {
        const sportHistory = data.sportsHistory[i];
        console.log(`[SportsHistory][handleSubmit] Procesando deporte ${i + 1}/${data.sportsHistory.length}:`, sportHistory);
        
        const sport = sports.find(s => s.id === sportHistory.sport_id);
        
        if (!sport) {
          console.error(`[SportsHistory][handleSubmit] Deporte no encontrado: ${sportHistory.sport_id}`);
          throw new Error(`Deporte no encontrado: ${sportHistory.sport_id}`);
        }

        // 1. Crear la relación postulación-deporte
        const experienceYears = calculateExperience(sportHistory.startDate, sportHistory.endDate);
        console.log('[SportsHistory][handleSubmit] Creando relación postulación-deporte:', {
          postulation_id: postulationId,
          sport_id: sport.id,
          experience_years: experienceYears
        });

        const postulationSportResponse = await sportsService.createPostulationSport({
          postulation_id: postulationId,
          sport_id: sport.id,
          experience_years: experienceYears
        });

        console.log('[SportsHistory][handleSubmit] Respuesta de creación postulación-deporte:', postulationSportResponse);

        if (!postulationSportResponse || !postulationSportResponse.id) {
          console.error('[SportsHistory][handleSubmit] Error: No se pudo crear la relación postulación-deporte');
          throw new Error('No se pudo crear la relación postulación-deporte');
        }

        // 2. Procesar los logros nuevos
        const achievements = sportHistory.achievements.filter(a => !a.id);
        console.log(`[SportsHistory][handleSubmit] Procesando ${achievements.length} logros nuevos`);

        for (const achievement of achievements) {
          console.log('[SportsHistory][handleSubmit] Procesando logro:', achievement);
          
          const achievementPayload = {
            sport_history_id: postulationSportResponse.id,
            achievement_type_id: achievement.achievement_type_id,
            competition_category_id: achievement.competition_category_id as string,
            competition_hierarchy_id: achievement.competition_hierarchy_id as string,
            name: achievement.competitionName || '',
            description: achievement.description,
            date: achievement.achievement_date,
            position: achievement.position || '',
            score: achievement.score || '0',
            postulation_id: postulationId as string,
            file: achievement.attached_document || null
          } as any;

          console.log('[SportsHistory][handleSubmit] Payload del logro:', achievementPayload);

          const linkedAchievement = await sportsService.createSportsAchievementWithLink(
            postulationSportResponse.id, 
            achievementPayload
          );

          console.log('[SportsHistory][handleSubmit] Logro creado:', linkedAchievement);

          if (achievement.attached_document && !linkedAchievement?.attached_document_id) {
            console.log('[SportsHistory][handleSubmit] Subiendo documento adjunto manualmente');
            await handleUploadFiles(linkedAchievement.sport_achievement_id || linkedAchievement.id, 'achievement');
          }
        }
      }

      let documentsUploaded = false;

      // Subir documentos generales
      if (data.documents) {
        console.log('[SportsHistory][handleSubmit] Procesando documentos generales:', data.documents);
        try {
          const existing = await attachedDocumentsService.getDocuments();
          const byPostulation = existing.filter((d: any) => d.postulation?.id === postulationId);
          const existingTypes = new Set(byPostulation.map((d: any) => d.attachedDocumentType?.name));

          const codeToLabel: Record<string, string> = {
            'CONSENT_FORM': 'Consentimiento Informado',
            'MEDICAL_CERTIFICATE': 'Certificado Médico'
          };

          const docsToUpload: Array<{file: File | undefined | null; code: string}> = [
             { file: (data.documents as any).consentForm, code: 'CONSENT_FORM' },
             { file: (data.documents as any).MedicCertificate, code: 'MEDICAL_CERTIFICATE' }
           ];

          const getTypeId = (code: string): string | undefined => {
            const label = codeToLabel[code];
            if (!label) return undefined;
            const type = attachedDocTypes.find(t => t.name === code || t.name === label);
            return type?.id;
          };

          for (const docItem of docsToUpload) {
            if (docItem.file) {
              const realTypeId = getTypeId(docItem.code);
              if (!realTypeId) {
                console.warn('[SportsHistory][handleSubmit] Tipo de documento no encontrado para', docItem.code);
                continue;
              }
              if (existingTypes.has(realTypeId)) {
                console.log('[SportsHistory] Documento ya existente, se omite', docItem.code);
                continue;
              }
              console.log('[SportsHistory][handleSubmit] Subiendo documento:', docItem);
              try {
                const uploadedDoc = await attachedDocumentsService.uploadDocument({
                  postulation_id: postulationId,
                  attached_document_type_id: realTypeId,
                  file: docItem.file as File
                });
                console.log('[SportsHistory][handleSubmit] Documento subido:', uploadedDoc);
                documentsUploaded = true;
              } catch (err) {
                const lbl = codeToLabel[docItem.code] || docItem.code;
                console.error(`[SportsHistory][handleSubmit] Error subiendo documento ${lbl}:`, err);
                toast.error(`Error al subir el documento ${lbl}`);
              }
            }
          }
        } catch (err) {
          console.error('[SportsHistory][handleSubmit] Error verificando documentos existentes:', err);
          toast.error('Error al verificar documentos existentes');
        }
      }

      // Marcar postulación como completada
      console.log('[SportsHistory][handleSubmit] Marcando postulación como completada');
      await postulationService.updatePostulationStatus(postulationId, 'completed');

      console.log('[SportsHistory][handleSubmit] Historial deportivo guardado exitosamente');
      
      // Mostrar mensajes de éxito
      toast.success('Historial deportivo guardado exitosamente');
      if (documentsUploaded) {
        toast.success('Documentos guardados exitosamente');
      }

      // Redireccionar a los detalles de la postulación
      console.log('[SportsHistory][handleSubmit] Redirigiendo a mis postulaciones');
      setTimeout(() => {
        navigate('/user-dashboard/postulations');
      }, 1500);

    } catch (error) {
      console.error('[SportsHistory][handleSubmit] Error al guardar historial deportivo:', error);
      toast.error('Error al guardar el historial deportivo');
    } finally {
      setIsSubmitting(false);
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
    if (!postulationId) {
      toast.error('No se ha encontrado una postulación activa');
      return;
    }

    setLoading(true);
    try {
      const uploadPromises = selectedFiles.map(file => {
        const documentData: CreateAttachedDocumentDTO = {
          file,
          attached_document_type_id: 'GENERIC',
          postulation_id: postulationId
        } as any;
        return attachedDocumentsService.uploadDocument(documentData);
      });

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
    if (!postulationId) {
      toast.error('No se ha encontrado una postulación activa');
      return;
    }

    try {
      await attachedDocumentsService.deleteDocument(documentId);
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Documento eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
    }
  };

  useEffect(() => {
    const fetchPostulationId = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const postulationId = searchParams.get('postulationId');
        
        if (!postulationId) {
          console.error('No se encontró el ID de la postulación en la URL');
          toast.error('Error: No se encontró la postulación');
          navigate('/user-dashboard');
          return;
        }

        const response = await api.get(`/postulations/${postulationId}`);
        if (response.data) {
          setPostulation(response.data);
          setPostulationId(postulationId);
        } else {
          console.error('No se encontraron datos de la postulación');
          toast.error('Error: No se encontraron datos de la postulación');
          navigate('/user-dashboard');
        }
      } catch (error) {
        console.error('Error al cargar la postulación:', error);
        toast.error('Error al cargar la postulación');
        navigate('/user-dashboard');
      }
    };

    if (user) {
      fetchPostulationId();
    }
  }, [user, navigate, location]);

  // Agregar este useEffect para cargar las categorías al inicio
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await api.get('/sports-competition-categories');
        if (response.data && response.data.data) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        toast.error('Error al cargar categorías');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Componente para el selector de categoría y tipo
  const AchievementCategoryAndType = ({ sportIndex, achievementIndex }: { sportIndex: number, achievementIndex: number }) => {
    const categoryId = form.watch(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_category_id`);
    const [localTypes, setLocalTypes] = useState<CompetitionHierarchy[]>(() => {
      if (!categoryId) return [];
      return competitionTypesCache[categoryId] ?? [];
    });
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    useEffect(() => {
      const fetchTypes = async () => {
        if (!categoryId) {
          setLocalTypes([]);
          return;
        }

        // Revisar caché global primero
        if (competitionTypesCache[categoryId]) {
          setLocalTypes(competitionTypesCache[categoryId]);
          return;
        }

        setIsLocalLoading(true);
        try {
          // Obtener logros filtrados por categoría para derivar jerarquías únicas
          const resp = await api.get(`/sports-achievements/by-sport-competition-category/${categoryId}`);
          const achievements = resp.data?.data || [];

          // Extraer jerarquías de competencia únicas
          const map = new Map<string, CompetitionHierarchy>();
          achievements.forEach((ach: any) => {
            const h = ach.competition_hierarchy;
            if (h && h.id && !map.has(h.id)) {
              map.set(h.id, {
                id: h.id,
                name: h.name,
                competition_hierarchy: h,
                score: h.score ?? 0,
                is_active: h.is_active ?? true,
              } as any);
            }
          });

          const unique: CompetitionHierarchy[] = Array.from(map.values());
          competitionTypesCache[categoryId as string] = unique;
            setLocalTypes(unique);
          return; // exit after setting unique
        } catch (err) {
          console.error('Error cargando tipos de competencia:', err);
          toast.error('Error al cargar tipos de competencia');
          setLocalTypes([]);
        } finally {
          setIsLocalLoading(false);
        }
      };

      fetchTypes();
    }, [categoryId]);

    return (
      <>
        <FormField
          control={form.control}
          name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_category_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Categoría</FormLabel>
              <FormControl>
                <select
                  value={field.value || ''}
                  onChange={(e) => {
                    const selectedCategoryId = e.target.value;
                    field.onChange(selectedCategoryId);
                    // Limpiar tipo cada vez que cambia la categoría
                    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_hierarchy_id`, '');
                    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`, '');
                  }}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_hierarchy_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Tipo de Competencia</FormLabel>
              <FormControl>
                <select
                  value={field.value || ''}
                  onChange={(e) => {
                    const selectedTypeId = e.target.value;
                    field.onChange(selectedTypeId);
                    const sel = localTypes.find(t => t.id === selectedTypeId);
                    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`, sel?.name || '');
                  }}
                  disabled={!categoryId || isLocalLoading}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                >
                  <option value="">{isLocalLoading ? 'Cargando...' : 'Seleccione un tipo'}</option>
                  {!isLocalLoading && localTypes.map((type) => (
                    <option key={`${type.id}-${sportIndex}-${achievementIndex}`} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  };

  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#006837]" />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative">
      <img
        src={bloqueNuevo}
        alt="Fondo decorativo"
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
        style={{objectPosition: 'center', opacity: 0.32}}
      />
      <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-10 relative z-10">
        {/* Información del usuario */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar y nombre */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006837] to-[#00a65a] flex items-center justify-center text-white text-2xl font-bold">
                  {athlete?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {athlete ? `${athlete.name || ''} ${((athlete as any)?.last_name) || ''}` : 'Usuario'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>Documento:</span>
                  <span className="font-medium text-gray-700">
                    {athlete ? `${getDocumentAbbrev((athlete as any)?.document_type?.name)} ${(athlete as any)?.document_number}` : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Estado en línea */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>En línea</span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                <Mail className="w-5 h-5 text-[#006837]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium text-gray-900">{athlete?.email || 'No disponible'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                <GraduationCap className="w-5 h-5 text-[#006837]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium text-gray-900">Postulante Activo</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-10 mb-10"
        >
          <div className="flex flex-col gap-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Historial Deportivo</h2>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit, onFormError)} className="space-y-8 relative">
              <div className="relative">
                <div className="relative">
                  {!showSportSearch ? (
                    <motion.button
                      type="button"
                      onClick={() => setShowSportSearch(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-gradient-to-r from-[#006837] to-[#005828] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3 font-medium text-lg"
                    >
                      <Plus size={24} />
                      Agregar Deporte
                    </motion.button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border p-4 shadow-lg"
                    >
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Buscar deporte..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {isLoadingSports ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-[#006837]" />
                            <span className="ml-2">Cargando deportes...</span>
                          </div>
                        ) : filteredSports.length > 0 ? (
                          filteredSports.map((sport) => (
                          <motion.button
                            key={sport.id}
                            type="button"
                            onClick={() => handleSportSelect(sport)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <Medal size={20} className="text-[#006837]" />
                            <span className="font-medium">{sport.name}</span>
                          </motion.button>
                          ))
                        ) : (
                          <div className="text-center p-4 text-gray-500">
                            No se encontraron deportes
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-6 mt-4">
                  {fields.map((field, sportIndex) => {
                    const sport = sports.find(s => s.id === field.sport_id);
                    const sportName = sport?.name || '';
                    const isExpanded = expandedSports.includes(sportName);
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
                          onClick={() => toggleSportExpansion(sportName)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              hasAchievements ? 'bg-[#006837] bg-opacity-10' : 'bg-yellow-100'
                            }`}>
                              <Trophy size={24} className={hasAchievements ? 'text-[#006837]' : 'text-yellow-600'} />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{sportName || 'Deporte no encontrado'}</h3>
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
                                setSelectedSports(selectedSports.filter(s => s !== sport?.id));
                                setExpandedSports(expandedSports.filter(s => s !== sportName));
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
                              {achievements.length > 0 && (achievementInProgress?.sportIndex !== sportIndex) && (
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
                                        const keyId = achievement.id || `temp-${achievementIndex}`;
                                        const category = categories.find(cat => cat.id === achievement.competition_category_id);
                                        const type = competitionTypes.find(type => type.id === achievement.competition_hierarchy_id);

                                        return (
                                          <motion.tr 
                                            key={keyId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: achievementIndex * 0.1 }}
                                            className="border-b last:border-b-0 hover:bg-gray-50"
                                          >
                                            <td className="px-6 py-4">
                                              <span className="font-medium text-gray-900">
                                                {achievement.competitionName || achievement.description || 'Sin nombre'}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <span className="text-gray-600">
                                                {category?.name || achievement.competitionCategory || 'No especificada'}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <span className="text-gray-600">
                                                {type?.name || achievement.competitionType || 'No especificado'}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <div className="flex items-center gap-2">
                                                {achievement.attached_document ? (
                                                  <span className="flex items-center gap-1 text-sm text-gray-600">
                                                    <FileText size={16} className="text-green-600" />
                                                    {typeof achievement.attached_document === 'object' 
                                                      ? achievement.attached_document.name 
                                                      : (typeof achievement.attached_document === 'string' 
                                                        ? achievement.attached_document.split('/').pop() 
                                                        : 'Archivo adjunto')}
                                                  </span>
                                                ) : (
                                                  <span className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle size={16} />
                                                    Sin certificado
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-6 py-4">
                                              <div className="flex items-center gap-2">
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
                                                  onClick={() => handleDeleteAchievement(sportIndex, achievementIndex)}
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                  <Trash2 size={18} />
                                                </motion.button>
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
                                            <Input 
                                              {...field}
                                              placeholder="Ej: Campeonato Regional" 
                                              className="focus-visible:ring-[#006837]"
                                              value={field.value || ''}
                                              onChange={(e) => field.onChange(e.target.value)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <AchievementCategoryAndType 
                                      sportIndex={sportIndex} 
                                      achievementIndex={achievementInProgress.achievementIndex} 
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`sportsHistory.${sportIndex}.achievements.${achievementInProgress.achievementIndex}.attached_document`}
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
                                      disabled={isSubmittingAchievement}
                                      className={`px-6 py-2.5 bg-[#006837] text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm hover:shadow-md ${isSubmittingAchievement ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#005828]'}`}
                                    >
                                      {isSubmittingAchievement ? (
                                        <>
                                          <Loader2 size={18} className="animate-spin" />
                                          Guardando...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 size={18} />
                                          Confirmar Logro
                                        </>
                                      )}
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
              {/* Botón de guardar flotante */}
              <div className="fixed bottom-8 right-8 z-20">
                <motion.button
                  type="submit"
                  onClick={() => { /* Acción explícita, logs eliminados */ }}
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
            </form>
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