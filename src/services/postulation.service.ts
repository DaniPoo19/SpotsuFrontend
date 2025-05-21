import { api } from '../lib/axios';
import API_ENDPOINTS from '../api/endpoints';

export interface PostulationDTO {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const postulationService = {
  getCurrentPostulation: async (): Promise<PostulationDTO> => {
    try {
      const response = await api.get(API_ENDPOINTS.POSTULATIONS.CURRENT);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener la postulación actual:', error);
      throw error;
    }
  },

  createPostulation: async (): Promise<PostulationDTO> => {
    try {
      const response = await api.post(API_ENDPOINTS.POSTULATIONS.BASE);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear una nueva postulación:', error);
      throw error;
    }
  }
}; 