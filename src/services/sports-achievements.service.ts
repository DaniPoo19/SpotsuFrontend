import axiosInstance from '../api/axios';
import { ApiResponse } from '../types/dtos';

const ENDPOINTS = {
  SPORTS_ACHIEVEMENTS: '/sports-achievements'
} as const;

export interface CreateSportsAchievementDTO {
  sport_competition_category_id: string;
  competition_hierarchy_id: string;
  score: number;
  postulation_id: string;
}

export interface SportsAchievement {
  id: string;
  sports_competition_category: {
    id: string;
    name: string;
  };
  competition_hierarchy: {
    id: string;
    name: string;
  };
  score: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const sportsAchievementsService = {
  async create(data: CreateSportsAchievementDTO): Promise<SportsAchievement> {
    try {
      const response = await axiosInstance.post<ApiResponse<SportsAchievement>>(
        ENDPOINTS.SPORTS_ACHIEVEMENTS,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error al crear logro deportivo:', error);
      if (error.response?.data) {
        console.error('Error detallado:', error.response.data);
        if (Array.isArray(error.response.data.message)) {
          throw new Error(error.response.data.message.join(', '));
        }
        throw new Error(error.response.data.message || 'Error al crear logro deportivo');
      }
      throw new Error('Error al conectar con el servidor');
    }
  },

  async getAchievements(): Promise<SportsAchievement[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<SportsAchievement[]>>(ENDPOINTS.SPORTS_ACHIEVEMENTS);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener logros deportivos:', error);
      throw new Error('Error al obtener logros deportivos');
    }
  },

  async getAchievement(id: string): Promise<SportsAchievement> {
    try {
      const response = await axiosInstance.get<ApiResponse<SportsAchievement>>(`${ENDPOINTS.SPORTS_ACHIEVEMENTS}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener logro deportivo:', error);
      throw new Error('Error al obtener logro deportivo');
    }
  },

  async updateAchievement(id: string, data: Partial<CreateSportsAchievementDTO>): Promise<SportsAchievement> {
    try {
      const response = await axiosInstance.patch<ApiResponse<SportsAchievement>>(
        `${ENDPOINTS.SPORTS_ACHIEVEMENTS}/${id}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar logro deportivo:', error);
      throw new Error('Error al actualizar logro deportivo');
    }
  },

  async deleteAchievement(id: string): Promise<void> {
    try {
      await axiosInstance.delete<ApiResponse<void>>(`${ENDPOINTS.SPORTS_ACHIEVEMENTS}/${id}`);
    } catch (error: any) {
      console.error('Error al eliminar logro deportivo:', error);
      throw new Error('Error al eliminar logro deportivo');
    }
  }
}; 