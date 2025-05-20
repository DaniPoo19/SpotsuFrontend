import { api } from '../lib/axios';
import API_ENDPOINTS from '../api/endpoints';

export interface SportHistoryDTO {
  id: string;
  athlete_id: string;
  sport_id: string;
  start_date: string;
  end_date: string | null;
  institution: string;
  achievements: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSportHistoryDTO {
  athlete_id: string;
  sport_id: string;
  start_date: string;
  end_date?: string;
  institution: string;
  achievements: string;
}

export const sportHistoriesService = {
  // Obtener todos los historiales deportivos
  getHistories: async (): Promise<SportHistoryDTO[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.SPORT_HISTORIES.BASE);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener historiales deportivos:', error);
      throw error;
    }
  },

  // Obtener un historial deportivo por ID
  getHistoryById: async (id: string): Promise<SportHistoryDTO> => {
    try {
      const response = await api.get(API_ENDPOINTS.SPORT_HISTORIES.BY_ID(id));
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener historial deportivo ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo historial deportivo
  createHistory: async (dto: CreateSportHistoryDTO): Promise<SportHistoryDTO> => {
    try {
      const response = await api.post(API_ENDPOINTS.SPORT_HISTORIES.BASE, dto);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear historial deportivo:', error);
      throw error;
    }
  },

  // Actualizar un historial deportivo existente
  updateHistory: async (id: string, dto: Partial<CreateSportHistoryDTO>): Promise<SportHistoryDTO> => {
    try {
      const response = await api.put(API_ENDPOINTS.SPORT_HISTORIES.BY_ID(id), dto);
      return response.data.data;
    } catch (error) {
      console.error(`Error al actualizar historial deportivo ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un historial deportivo
  deleteHistory: async (id: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.SPORT_HISTORIES.BY_ID(id));
    } catch (error) {
      console.error(`Error al eliminar historial deportivo ${id}:`, error);
      throw error;
    }
  }
}; 