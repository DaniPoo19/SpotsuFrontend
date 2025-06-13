import { api } from '../lib/axios';
import API_ENDPOINTS from '../api/endpoints';

export interface SportDTO {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SportsCompetitionCategoryDTO {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitionHierarchyDTO {
  id: string;
  name: string;
  category_id: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttachedDocumentType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface CreateSportsAchievementData {
  sport_history_id: string;
  achievement_type_id: string;
  competition_category_id: string;
  competition_hierarchy_id: string;
  name: string;
  description: string;
  date: string;
  position: string;
  score: string;
  postulation_id: string;
}

interface UploadAttachedDocumentData {
  sports_achievement_id: string;
  attached_document_type_id: string;
  file: File;
}

interface CompetitionType {
  id: string;
  name: string;
  points?: number;
}

type CategoryName = 'Juegos intercolegiados' | 'Deporte asociado' | 'Deporte federado';

// Definición de tipos de competencia por categoría con su jerarquía
const COMPETITION_TYPES_BY_CATEGORY: Record<CategoryName, CompetitionType[]> = {
  'Juegos intercolegiados': [
    { id: 'intercolegiados-municipal', name: 'Fase municipal', points: 1 },
    { id: 'intercolegiados-departamental', name: 'Fase departamental', points: 2 },
    { id: 'intercolegiados-nacional', name: 'Fase nacional', points: 3 },
    { id: 'intercolegiados-internacional', name: 'Fase internacional', points: 4 }
  ],
  'Deporte asociado': [
    { id: 'asociado-interclubes', name: 'Interclubes', points: 1 },
    { id: 'asociado-departamental', name: 'Campeonatos departamentales', points: 2 },
    { id: 'asociado-interligas', name: 'Interligas', points: 3 },
    { id: 'asociado-zonal', name: 'Campeonatos zonales o regionales', points: 4 },
    { id: 'asociado-nacional', name: 'Campeonato nacional', points: 5 }
  ],
  'Deporte federado': [
    { id: 'federado-seleccion', name: 'Selección nacional', points: 1 },
    { id: 'federado-internacional', name: 'Participaciones internacionales', points: 2 },
    { id: 'federado-reconocimiento', name: 'Reconocimientos al mérito deportivo', points: 3 }
  ]
};

export const sportsService = {
  // Obtener todos los deportes
  getSports: async (): Promise<SportDTO[]> => {
    try {
      const response = await api.get('/sports');
      return response.data.data.filter((sport: SportDTO) => sport.is_active);
    } catch (error) {
      console.error('Error fetching sports:', error);
      throw error;
    }
  },

  // Obtener un deporte por ID
  getSportById: async (id: string): Promise<SportDTO> => {
    try {
      const response = await api.get(`/sports/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener deporte ${id}:`, error);
      throw error;
    }
  },

  // Obtener categorías de competencia
  getCompetitionCategories: async (): Promise<SportsCompetitionCategoryDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.COMPETITION_CATEGORIES.BASE);
      if (!response.data || !response.data.data) {
        throw new Error('No se recibieron datos de categorías');
      }
      return response.data.data.filter((category: SportsCompetitionCategoryDTO) => category.is_active);
    } catch (error) {
      console.error('Error al obtener categorías de competencia:', error);
      throw error;
    }
  },

  // Obtener jerarquía de competencia
  getCompetitionHierarchy: async (): Promise<CompetitionHierarchyDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.COMPETITION_HIERARCHY.BASE);
      return response.data.data.filter((hierarchy: CompetitionHierarchyDTO) => hierarchy.is_active);
    } catch (error) {
      console.error('Error fetching competition hierarchy:', error);
      throw error;
    }
  },

  // Obtener jerarquía de competencia por categoría
  getCompetitionHierarchyByCategory: async (categoryId: string): Promise<CompetitionHierarchyDTO[]> => {
    if (!categoryId) {
      console.error('ID de categoría no proporcionado');
      return [];
    }

    try {
      // Primero obtenemos la categoría para saber su nombre
      const response = await api.get(`${API_ENDPOINTS.COMPETITION_CATEGORIES.BASE}/${categoryId}`);
      const category = response.data.data;

      if (!category) {
        console.warn('Categoría no encontrada');
        return [];
      }

      // Mapeamos los tipos de competencia según la categoría
      const competitionTypes = COMPETITION_TYPES_BY_CATEGORY[category.name as CategoryName] || [];
      
      // Convertimos los tipos a CompetitionHierarchyDTO
      return competitionTypes.map((type: CompetitionType) => ({
        id: type.id,
        name: type.name,
        category_id: categoryId,
        description: `Nivel ${type.points}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Error al obtener tipos de competencia para categoría ${categoryId}:`, error);
      return [];
    }
  },

  // Obtener tipos de documentos adjuntos
  getAttachedDocumentTypes: async (): Promise<AttachedDocumentType[]> => {
    try {
      const response = await api.get('/attached-document-types');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  },

  // Crear relación postulación-deporte
  createPostulationSport: async (data: { postulation_id: string; sport_id: string; experience_years: number }): Promise<any> => {
    try {
      const response = await api.post(API_ENDPOINTS.POSTULATION_SPORTS.BASE, data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error creating postulation sport:', error);
      throw error;
    }
  },

  // Crear logro deportivo (SportsAchievement) y vincularlo al PostulationSport
  createSportsAchievementWithLink: async (postulationSportId: string, data: CreateSportsAchievementData & { file?: File | null }): Promise<any> => {
    try {
      // 1. Crear el logro deportivo
      // El puntaje lo asignará posteriormente un administrador; enviamos 0 como placeholder
      const achievementPayload = {
        sport_competition_category_id: data.competition_category_id,
        competition_hierarchy_id: data.competition_hierarchy_id,
        score: 0,
      };
      console.log('[SportsService] Payload crear achievement:', achievementPayload);
      const achievementResp = await api.post(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BASE, achievementPayload);
      const achievementId = achievementResp.data?.data?.id || achievementResp.data?.id;
      console.log('[SportsService] Respuesta crear achievement:', achievementResp.data);

      if (!achievementId) throw new Error('No se pudo crear el logro');

      // 2. Vincular al PostulationSport y subir certificado (si existe)
      const formData = new FormData();
      formData.append('postulation_sport_id', postulationSportId);
      formData.append('sport_achievement_id', achievementId);
      if (data.file) {
        formData.append('file', data.file);
      }
      console.log('[SportsService] Vinculando achievement. postulationSportId:', postulationSportId, 'achievementId:', achievementId, 'file?', !!data.file);
      const linkResp = await api.post(API_ENDPOINTS.POSTULATION_SPORT_ACHIEVEMENTS.BASE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('[SportsService] Respuesta vínculo achievement:', linkResp.data);
      return linkResp.data?.data ?? linkResp.data;
    } catch (error: any) {
      if (error.response) {
        console.error('[SportsService] Error 400 detalle:', error.response.data);
      }
      console.error('Error creando/vinculando logro:', error);
      throw error;
    }
  },

  // Actualizar logro deportivo
  updateSportsAchievement: async (id: string, data: {
    achievement_type_id: string;
    competition_category_id: string;
    competition_hierarchy_id: string;
    achievement_date: string;
    description: string;
  }): Promise<any> => {
    try {
      const response = await api.put(`/sports-achievements/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating sports achievement:', error);
      throw error;
    }
  },

  // Eliminar logro deportivo
  deleteSportsAchievement: async (id: string): Promise<void> => {
    try {
      await api.delete(`/sports-achievements/${id}`);
    } catch (error) {
      console.error('Error deleting sports achievement:', error);
      throw error;
    }
  },

  // Crear logro deportivo sin vincular (uso genérico)
  createSportsAchievement: async (data: CreateSportsAchievementData): Promise<any> => {
    try {
      const response = await api.post(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BASE, data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error creating sports achievement:', error);
      throw error;
    }
  },

  // Subir documento adjunto (fallback utilitario)
  uploadAttachedDocument: async (data: UploadAttachedDocumentData): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('sports_achievement_id', data.sports_achievement_id);
      formData.append('attached_document_type_id', data.attached_document_type_id);
      formData.append('file', data.file);

      const response = await api.post(API_ENDPOINTS.ATTACHED_DOCUMENTS.BASE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error uploading attached document:', error);
      throw error;
    }
  },
}; 