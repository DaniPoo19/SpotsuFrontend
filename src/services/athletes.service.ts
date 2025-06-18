import axios from 'axios';
import { AxiosError } from 'axios';
import { Athlete } from '../types/auth.types';
import API_ENDPOINTS from '../api/endpoints';
import { authService } from './auth.service';
import { api } from '@/lib/axios';

export interface PostulationDTO {
  id: string;
  athlete_id: string;
  semester_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

class AthletesService {
  private readonly API_URL = `${import.meta.env.VITE_API_URL || 'https://backend.spotsu.site/api'}/athletes`;

  async createAthlete(athleteData: any): Promise<Athlete> {
    try {
      const response = await axios.post(this.API_URL, athleteData);
      
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al crear atleta');
    } catch (error) {
      console.error('Error al crear atleta:', error);
      throw error;
    }
  }

  async getAthletes(): Promise<Athlete[]> {
    const response = await axios.get(this.API_URL);
    return response.data.data;
  }

  async getAthleteByDocument(documentNumber: string): Promise<Athlete | null> {
    try {
      // Obtener el usuario actual del token
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Verificar que el número de documento coincida con el usuario autenticado
      if (currentUser.document_number !== documentNumber) {
        throw new Error('No autorizado para acceder a este atleta');
      }

      // Obtener todos los atletas
      const response = await axios.get(`${this.API_URL}`);
      
      if (response.data.status === 'success' && response.data.data) {
        // Buscar el atleta que coincida con el documento del usuario
        const athletes = response.data.data;
        const userAthlete = athletes.find((athlete: Athlete) => 
          athlete.document_number === documentNumber
        );

        console.log('Atleta encontrado para el usuario:', userAthlete);
        return userAthlete || null;
      }
      return null;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      console.error('Error al buscar atleta:', error);
      return null;
    }
  }

  async getAthleteByPersonId(personId: string): Promise<Athlete | null> {
    try {
      const response = await axios.get(`${this.API_URL}/person/${personId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateAthlete(id: string, data: any): Promise<Athlete> {
    const response = await axios.patch(`${this.API_URL}/${id}`, data);
    return response.data.data;
  }

  async deleteAthlete(id: string): Promise<void> {
    await axios.delete(`${this.API_URL}/${id}`);
  }

  async createPostulation(athleteId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.API_URL}/${athleteId}/postulations`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al crear postulación');
    } catch (error) {
      console.error('Error al crear postulación:', error);
      throw error;
    }
  }

  async getPostulations(athleteId: string): Promise<PostulationDTO[]> {
    if (!athleteId) {
      throw new Error('El ID del atleta es requerido');
    }
    const response = await api.get(`/postulations/athlete/${athleteId}`);
    return response.data.data;
  }

  async getActivePostulation(athleteId: string): Promise<PostulationDTO | null> {
    if (!athleteId) {
      throw new Error('El ID del atleta es requerido');
    }
    try {
      const response = await api.get(`/postulations/athlete/${athleteId}`);
      const postulations: PostulationDTO[] = response.data.data || [];
      return postulations.find(p => p.status === 'active') || null;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

export const athletesService = new AthletesService(); 