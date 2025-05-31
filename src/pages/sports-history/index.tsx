import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInYears, parse } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, X, Upload, Trophy, Calendar, Medal, 
  FileCheck, ChevronDown, ChevronUp, Clipboard, GraduationCap,
  AlertCircle, CheckCircle2, Loader2, Edit2, Trash2, Save, FileText, User
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
  UserRole
} from '../../types/dtos';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { postulationService } from '../../services/postulation.service';
import { api } from '../../lib/axios';
import { authService } from '../../services/auth.service';

const sports = [
  'Fútbol', 'Baloncesto', 'Voleibol', 'Natación', 'Atletismo',
  'Tenis', 'Béisbol', 'Gimnasia', 'Ciclismo', 'Boxeo',
  'Karate', 'Taekwondo', 'Judo', 'Rugby', 'Ajedrez'
];

const today = new Date();

// Esquemas de validación
const achievementSchema = z.object({
  id: z.string().optional(),
  achievement_type_id: z.string().min(1, "El tipo de logro es requerido"),
  competition_category_id: z.string().min(1, "La categoría es requerida"),
  competition_hierarchy_id: z.string().min(1, "El tipo de competencia es requerido"),
  achievement_date: z.string().min(1, "La fecha es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  attached_document: z.any().optional(),
  attached_document_type_id: z.string().optional(),
  competitionCategory: z.string().optional(),
  competitionType: z.string().optional(),
  competitionName: z.string().optional(),
  date: z.string().optional(),
  position: z.string().optional(),
  score: z.string().optional()
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
    consentForm: z.any().optional(),
    MedicCertificate: z.any().optional()
  }).optional()
});

export const SportsHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userData, setUserData] = useState<PersonDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [postulationId, setPostulationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [filteredSports, setFilteredSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [showSportSearch, setShowSportSearch] = useState(false);
  const [expandedSports, setExpandedSports] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sportsHistory: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sportsHistory"
  });

  // Cargar deportes y categorías desde el backend
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [sportsData, categoriesData] = await Promise.all([
          sportsService.getSports(),
          api.get('/sports-competition-categories').then(res => res.data.data)
        ]);
        setSports(sportsData);
        setCategories(categoriesData);
        setFilteredSports(sportsData);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        toast.error('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

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
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    return differenceInYears(end, start);
  };

  const handleSportSelect = (sport: Sport) => {
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
    setExpandedSports(prev => 
      prev.includes(sportName) 
        ? prev.filter(s => s !== sportName)
        : [...prev, sportName]
    );
  };

  const handleAddAchievement = (sportIndex: number) => {
    const newAchievement: Achievement = {
      achievement_type_id: '',
      competition_category_id: '',
      competition_hierarchy_id: '',
      achievement_date: new Date().toISOString().split('T')[0],
      description: '',
    };

    const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`) || [];
    form.setValue(`sportsHistory.${sportIndex}.achievements`, [...currentAchievements, newAchievement]);
    setAchievementInProgress({ sportIndex, achievementIndex: currentAchievements.length });
  };

  const handleCategoryChange = (categoryId: string, sportIndex: number, achievementIndex: number) => {
    if (!categoryId) {
      toast.error('Por favor seleccione una categoría válida');
      return;
    }

    // Actualizar los valores del formulario
    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_category_id`, categoryId);
    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionCategory`, categories.find(cat => cat.id === categoryId)?.name || '');
    
    // Limpiar los valores relacionados con el tipo de competencia
    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_hierarchy_id`, '');
    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`, '');
  };

  const handleCompetitionTypeChange = (typeId: string, sportIndex: number, achievementIndex: number) => {
    if (!typeId) {
      toast.error('Por favor seleccione un tipo de competencia válido');
      return;
    }

    // Actualizar los valores del formulario
    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_hierarchy_id`, typeId);
    const selectedType = competitionTypes.find(type => type.id === typeId);
    if (selectedType) {
      form.setValue(
        `sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`,
        selectedType.competition_hierarchy?.name || selectedType.name
      );
    }
  };

  // Componente para el selector de categoría
  const AchievementCategoryAndType = ({ sportIndex, achievementIndex }: { sportIndex: number, achievementIndex: number }) => {
    const categoryId = form.watch(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_category_id`);
    const [competitionTypes, setCompetitionTypes] = useState<CompetitionHierarchy[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);

    useEffect(() => {
      const loadCompetitionTypes = async () => {
        if (!categoryId) {
          setCompetitionTypes([]);
          return;
        }

        setIsLoadingTypes(true);
        try {
          const response = await api.get(`/sports-achievements/by-sport-competition-category/${categoryId}`);
          console.log('Respuesta completa:', response);
          
          if (response.data && Array.isArray(response.data.data)) {
            // Transformar los datos para incluir el nombre del tipo de competencia
            const transformedTypes = response.data.data.map((item: any) => ({
              id: item.id,
              name: item.competition_hierarchy?.name || 'Sin nombre',
              competition_hierarchy: item.competition_hierarchy,
              score: item.score,
              is_active: item.is_active
            }));
            console.log('Tipos transformados:', transformedTypes);
            setCompetitionTypes(transformedTypes);
          } else {
            console.log('No se encontraron tipos de competencia en la respuesta:', response.data);
            setCompetitionTypes([]);
            toast.error('No se encontraron tipos de competencia para esta categoría');
          }
        } catch (error) {
          console.error('Error al cargar tipos de competencia:', error);
          toast.error('Error al cargar tipos de competencia');
          setCompetitionTypes([]);
        } finally {
          setIsLoadingTypes(false);
        }
      };

      loadCompetitionTypes();
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
                    // Limpiar tipo de competencia al cambiar categoría
                    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competition_hierarchy_id`, '');
                    form.setValue(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`, '');
                  }}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
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
                    // Actualizar el nombre del tipo de competencia
                    const selectedType = competitionTypes.find(type => type.id === selectedTypeId);
                    if (selectedType) {
                      form.setValue(
                        `sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`,
                        selectedType.competition_hierarchy?.name || selectedType.name
                      );
                    }
                  }}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                  disabled={!categoryId || isLoadingTypes}
                >
                  <option value="">Seleccione un tipo</option>
                  {isLoadingTypes ? (
                    <option value="" disabled>Cargando tipos...</option>
                  ) : competitionTypes.length === 0 ? (
                    <option value="" disabled>No hay tipos disponibles</option>
                  ) : (
                    competitionTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.competition_hierarchy?.name || type.name}
                      </option>
                    ))
                  )}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  };

  const handleAchievementComplete = async (sportIndex: number, achievementIndex: number) => {
    const sportHistory = form.getValues().sportsHistory[sportIndex];
    const achievement = sportHistory.achievements[achievementIndex];

    if (!sportHistory.sport_id) {
      toast.error('Error: Deporte no seleccionado');
      return;
    }

    if (!postulationId) {
      toast.error('Error: No hay una postulación activa');
      return;
    }

    if (!achievement.competition_category_id || !achievement.competition_hierarchy_id) {
      toast.error('Error: Debe seleccionar una categoría y tipo de competencia');
      return;
    }

    setIsSubmittingAchievement(true);
    try {
      // 1. Crear la postulación deportiva
      const postulationSportResponse = await api.post('/postulation-sports', {
        postulation_id: postulationId,
        sport_id: sportHistory.sport_id,
        start_date: sportHistory.startDate,
        end_date: sportHistory.endDate,
        institution: sportHistory.institution
      });

      if (!postulationSportResponse.data.data || !postulationSportResponse.data.data.id) {
        throw new Error('No se pudo crear la postulación deportiva');
      }

      const postulationSportId = postulationSportResponse.data.data.id;

      // 2. Crear el logro deportivo con el certificado
      const formDataObj = new FormData();
      formDataObj.append('postulation_sport_id', postulationSportId);
      formDataObj.append('achievement_type_id', achievement.achievement_type_id);
      formDataObj.append('competition_category_id', achievement.competition_category_id);
      formDataObj.append('competition_hierarchy_id', achievement.competition_hierarchy_id);
      formDataObj.append('name', achievement.competitionName || '');
      formDataObj.append('description', achievement.description);
      formDataObj.append('date', achievement.achievement_date);
      formDataObj.append('position', achievement.position || '');
      formDataObj.append('score', achievement.score || '');
      formDataObj.append('postulation_id', postulationId);

      // Agregar el certificado si existe
      if (achievement.attached_document) {
        formDataObj.append('file', achievement.attached_document);
      }

      const achievementResponse = await api.post('/postulation-sport-achievements', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!achievementResponse.data.data) {
        throw new Error('No se pudo crear el logro deportivo');
      }

      // Obtener la categoría y tipo de competencia
      const category = categories.find(cat => cat.id === achievement.competition_category_id);
      const competitionType = competitionTypes.find(type => type.id === achievement.competition_hierarchy_id);

      // Actualizar el estado del formulario con el logro guardado
      const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`);
      const updatedAchievement = {
        ...achievement,
        id: achievementResponse.data.data.id,
        competitionCategory: category?.name || '',
        competitionType: competitionType?.name || ''
      };
      
      currentAchievements[achievementIndex] = updatedAchievement;
      form.setValue(`sportsHistory.${sportIndex}.achievements`, currentAchievements);

      // Mostrar mensaje de éxito
      toast.success('Logro deportivo registrado exitosamente');

      // Solo cerrar el formulario de nuevo logro, manteniendo la card expandida
      setAchievementInProgress(null);

      // Asegurarse de que la card permanezca expandida
      const sport = sports.find(s => s.id === sportHistory.sport_id);
      if (sport && !expandedSports.includes(sport.name)) {
        setExpandedSports(prev => [...prev, sport.name]);
      }

    } catch (error: any) {
      console.error('Error al registrar logro deportivo:', error);
      toast.error(error.response?.data?.message || 'Error al registrar logro deportivo');
    } finally {
      setIsSubmittingAchievement(false);
    }
  };

  const handleEditAchievement = (sportIndex: number, achievementIndex: number) => {
    setEditingAchievement({ sportIndex, achievementIndex });
  };

  const handleSaveEdit = async (sportIndex: number, achievementIndex: number) => {
    const achievement = form.getValues(`sportsHistory.${sportIndex}.achievements.${achievementIndex}`);
    const sport = form.getValues(`sportsHistory.${sportIndex}`);

    try {
      if (achievement.id) {
        await sportsService.updateSportsAchievement(achievement.id, {
          achievement_type_id: achievement.achievement_type_id,
          competition_category_id: achievement.competition_category_id,
          competition_hierarchy_id: achievement.competition_hierarchy_id,
          achievement_date: achievement.achievement_date,
          description: achievement.description
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
    const currentAchievements = form.getValues(`sportsHistory.${sportIndex}.achievements`);
    form.setValue(
      `sportsHistory.${sportIndex}.achievements`,
      currentAchievements.filter((_, index) => index !== achievementIndex)
    );
    setAchievementInProgress(null);
  };

  const handleDeleteAchievement = async (sportIndex: number, achievementIndex: number) => {
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
    const hasSports = form.watch('sportsHistory').length > 0;
    const allSportsHaveAchievements = form.watch('sportsHistory').every(sport => 
      sport.achievements && sport.achievements.length > 0
    );
    
    return hasSports && allSportsHaveAchievements;
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!postulationId) {
      try {
        const newPostulation = await postulationService.createPostulation();
        setPostulationId(newPostulation.id);
      } catch (error) {
        console.error('Error al crear una nueva postulación:', error);
        toast.error('No se pudo crear una nueva postulación. Por favor, intente nuevamente.');
        return;
      }
    }

    if (!user?.id) {
      toast.error('No se ha encontrado el ID del usuario');
      return;
    }

    setIsSubmitting(true);
    try {
      // Procesar cada historial deportivo
      for (let i = 0; i < data.sportsHistory.length; i++) {
        const sportHistory = data.sportsHistory[i];
        const sport = sports.find(s => s.id === sportHistory.sport_id);
        
        if (!sport) {
          throw new Error(`Deporte no encontrado: ${sportHistory.sport_id}`);
        }

        // 1. Crear la relación postulación-deporte
        const postulationSportResponse = await sportsService.createPostulationSport({
          postulation_id: postulationId,
          sport_id: sport.id
        });

        if (!postulationSportResponse || !postulationSportResponse.id) {
          throw new Error('No se pudo crear la relación postulación-deporte');
        }

        // 2. Procesar los logros usando el ID de la relación
        for (const achievement of sportHistory.achievements) {
          const achievementData = {
            sport_history_id: postulationSportResponse.id,
            achievement_type_id: achievement.achievement_type_id,
            competition_category_id: achievement.competition_category_id,
            competition_hierarchy_id: achievement.competition_hierarchy_id,
            name: achievement.competitionName || '',
            description: achievement.description,
            date: achievement.date || '',
            position: achievement.position || '',
            score: achievement.score || '',
            postulation_id: postulationId
          };

          const createdAchievement = await sportsService.createSportsAchievement(achievementData);

          // 3. Si hay documentos adjuntos, los subimos
          if (achievement.attached_document) {
            await handleUploadFiles(createdAchievement.id, 'achievement');
          }
        }
      }

      toast.success('Historial deportivo guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar historial deportivo:', error);
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
          document_type_id: '1',
          attached_document_type_id: '1',
          reference_id: referenceId,
          reference_type: referenceType,
          postulation_id: postulationId
        };
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
        const postulation = await postulationService.getCurrentPostulation();
        setPostulationId(postulation.id);
      } catch (error) {
        console.error('Error al obtener el ID de postulación:', error);
        toast.error('Error al obtener el ID de postulación');
      }
    };

    if (user) {
      fetchPostulationId();
    }
  }, [user]);

  // Actualizar el efecto para cargar los datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        // Obtener el token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }

        // Configurar el token en las cabeceras de axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Obtener los datos del usuario autenticado
        const response = await api.get('/auth/me');
        const userData = response.data.data;

        // Obtener los datos de la persona asociada al usuario
        const personResponse = await api.get(`/people/${userData.person.id}`);
        const personData = personResponse.data.data;

        setUserData({
          id: personData.id,
          document_number: personData.document_number,
          full_name: `${personData.name} ${personData.lastname}`,
          name: personData.name,
          birth_date: personData.birth_date,
          document_type_id: personData.document_type_id,
          gender_id: personData.gender_id,
          phone: personData.phone,
          email: personData.email,
          address: personData.address,
          city: personData.city,
          state: personData.state,
          country: personData.country,
          nationality: personData.nationality,
          created_at: personData.created_at,
          updated_at: personData.updated_at
        });

        // Obtener el rol del usuario
        const roleResponse = await api.get(`/auth/roles/${userData.role.id}`);
        setUserRole(roleResponse.data.data);

        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        toast.error('Error al cargar datos del usuario');
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

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
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#006837] bg-opacity-10">
                <User size={24} className="text-[#006837]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{userData?.full_name || 'Usuario'}</h3>
                <p className="text-sm text-gray-600">Documento: {userData?.document_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Activo</span>
            </div>
          </div>
        </motion.div>

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
                    const achievements = field.achievements || [];
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
                                        const category = categories.find(cat => cat.id === achievement.competition_category_id);
                                        const competitionType = competitionTypes.find(type => type.id === achievement.competition_hierarchy_id);

                                        return (
                                          <motion.tr 
                                            key={achievementIndex}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: achievementIndex * 0.1 }}
                                            className="border-b last:border-b-0 hover:bg-gray-50"
                                          >
                                            <td className="px-6 py-4">
                                              <span className="font-medium text-gray-900">{achievement.competitionName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <span className="text-gray-600">{category?.name || achievement.competitionCategory}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <span className="text-gray-600">{competitionType?.name || achievement.competitionType}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <div className="flex items-center gap-2">
                                                {achievement.attached_document ? (
                                                  <span className="flex items-center gap-1 text-sm text-gray-600">
                                                    <FileText size={16} className="text-green-600" />
                                                    {typeof achievement.attached_document === 'object' ? achievement.attached_document.name : achievement.attached_document}
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
                                                  onClick={() => handleCancelAchievement(sportIndex, achievementIndex)}
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                  <X size={18} />
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
                                    <AchievementCategoryAndType sportIndex={sportIndex} achievementIndex={achievementInProgress.achievementIndex} />
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
                                      onClick={() => {
                                        console.log('Botón confirmar logro clickeado');
                                        handleAchievementComplete(sportIndex, achievementInProgress.achievementIndex);
                                      }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="px-6 py-2.5 bg-[#006837] text-white rounded-lg hover:bg-[#005828] transition-colors font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
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