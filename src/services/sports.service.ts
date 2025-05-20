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
  description: string;
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const sportsService = {
  // Obtener todos los deportes
  getSports: async (): Promise<SportDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.SPORTS.BASE);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener deportes:', error);
      throw error;
    }
  },

  // Obtener un deporte por ID
  getSportById: async (id: string): Promise<SportDTO> => {
    try {
      const response = await api.get(API_ENDPOINTS.SPORTS.BY_ID(id));
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
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener categorías de competencia:', error);
      throw error;
    }
  },

  // Obtener jerarquía de competencia
  getCompetitionHierarchy: async (): Promise<CompetitionHierarchyDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.COMPETITION_HIERARCHY.BASE);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener jerarquía de competencia:', error);
      throw error;
    }
  },

  // Obtener jerarquía de competencia por categoría
  getCompetitionHierarchyByCategory: async (categoryId: string): Promise<CompetitionHierarchyDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.COMPETITION_HIERARCHY.BY_CATEGORY(categoryId));
      return response.data.data.filter((type: CompetitionHierarchyDTO) => type.is_active);
    } catch (error) {
      console.error(`Error al obtener jerarquía de competencia para categoría ${categoryId}:`, error);
      throw error;
    }
  }
}; 