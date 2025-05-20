import { api } from '../lib/axios';
import API_ENDPOINTS from '../api/endpoints';

export interface SportsAchievementDTO {
  id: string;
  sport_history_id: string;
  competition_category_id: string;
  competition_hierarchy_id: string;
  name: string;
  description: string;
  date: string;
  position: string;
  score: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSportsAchievementDTO {
  sport_history_id: string;
  competition_category_id: string;
  competition_hierarchy_id: string;
  name: string;
  description: string;
  date: string;
  position: string;
  score: string;
}

export const sportsAchievementsService = {
  // Obtener todos los logros
  getAchievements: async (): Promise<SportsAchievementDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BASE);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener logros:', error);
      throw error;
    }
  },

  // Obtener logros por historial deportivo
  getAchievementsBySportHistory: async (sportHistoryId: string): Promise<SportsAchievementDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BY_SPORT_HISTORY(sportHistoryId));
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener logros para historial ${sportHistoryId}:`, error);
      throw error;
    }
  },

  // Crear un nuevo logro
  createAchievement: async (dto: CreateSportsAchievementDTO): Promise<SportsAchievementDTO> => {
    try {
      const response = await api.post(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BASE, dto);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear logro:', error);
      throw error;
    }
  },

  // Actualizar un logro existente
  updateAchievement: async (id: string, dto: Partial<CreateSportsAchievementDTO>): Promise<SportsAchievementDTO> => {
    try {
      const response = await api.put(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BY_ID(id), dto);
      return response.data.data;
    } catch (error) {
      console.error(`Error al actualizar logro ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un logro
  deleteAchievement: async (id: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.SPORTS_ACHIEVEMENTS.BY_ID(id));
    } catch (error) {
      console.error(`Error al eliminar logro ${id}:`, error);
      throw error;
    }
  }
}; 