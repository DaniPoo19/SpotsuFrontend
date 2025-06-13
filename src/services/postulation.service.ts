import { api } from '../lib/axios';
import { PostulationDTO } from '../types/dtos';
import { athletesService } from './athletes.service';

// 1) DECLARAR TIPO INTERNO PARA CREAR POSTULACIÓN
type CreatePostulationDto = {
  athlete_id: string;
  semester_id: string;
  status: string;
};

class PostulationService {
  private validateId(id: string | null, entity: string): string {
    if (!id || typeof id !== 'string') {
      throw new Error(`ID de ${entity} inválido`);
    }
    return id;
  }

  private getAuthHeader() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  async createPostulation(): Promise<PostulationDTO> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener el token y decodificarlo
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar que el usuario tiene rol de atleta
      if (!decodedToken.role || decodedToken.role.name !== 'ATHLETE') {
        throw new Error('El usuario no tiene rol de atleta');
      }

      // Obtener el atleta usando el servicio de frontend (filtrado por documento)
      const athlete = await athletesService.getAthleteByDocument(decodedToken.document_number);

      if (!athlete) {
        throw new Error('No se encontró el atleta asociado al usuario');
      }

      // Obtener el semestre activo
      const semesterResponse = await api.get('/semesters/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!semesterResponse.data.data) {
        throw new Error('No hay un semestre activo');
      }

      const activeSemester = semesterResponse.data.data;

      // Verificar si ya existe una postulación del mismo atleta para este semestre
      try {
        const existing = await this.getPostulationsByAthlete(athlete.id);
        const sameSemesterPostulation = existing.find(p => p.semester?.id === activeSemester.id);
        if (sameSemesterPostulation) {
          console.log('Ya existe postulación para este semestre, la reutilizamos:', sameSemesterPostulation.id);
          return sameSemesterPostulation;
        }
      } catch (e) {
        console.warn('No se pudo verificar postulaciones existentes:', e);
      }

      // Preparar los datos de la postulación según el DTO
      const postulationData: CreatePostulationDto = {
        athlete_id: athlete.id,
        semester_id: activeSemester.id,
        status: 'active'
      };

      console.log('Creando postulación con datos:', postulationData);

      // Crear la postulación
      const response = await api.post('/postulations', postulationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.data) {
        throw new Error('Error al crear la postulación');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error al crear postulación:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data
        });
        // Si el error viene del backend, usar su mensaje
        if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      throw new Error('No se pudo crear la postulación');
    }
  }

  async getCurrentPostulation(): Promise<PostulationDTO | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Obtener el token y decodificarlo
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      
      // Obtener el atleta usando el servicio de frontend
      const athlete = await athletesService.getAthleteByDocument(decodedToken.document_number);
      if (!athlete) {
        throw new Error('No se encontró el atleta asociado al usuario');
      }

      // Obtener las postulaciones del atleta
      const postulations = await this.getPostulationsByAthlete(athlete.id);
      
      // Filtrar por postulaciones activas
      const activePostulation = postulations.find(p => p.status === 'active');
      return activePostulation || null;
    } catch (error: any) {
      console.error('Error al obtener la postulación activa:', error);
      return null;
    }
  }

  async getOrCreateActivePostulation(): Promise<{ postulation: PostulationDTO; existed: boolean }> {
    try {
      // Intentar obtener la postulación activa
      const activePostulation = await this.getCurrentPostulation();
      
      if (activePostulation) {
        console.log('Postulación activa encontrada:', activePostulation.id);
        return { postulation: activePostulation, existed: true };
      }

      console.log('No se encontró postulación activa, creando nueva...');
      // Si no existe, crear una nueva
      const newPost = await this.createPostulation();
      return { postulation: newPost, existed: false };
    } catch (error: any) {
      console.error('Error al obtener o crear postulación:', error);
      throw new Error(error.message || 'No se pudo obtener o crear una postulación activa');
    }
  }

  async updatePostulationStatus(postulationId: string, status: PostulationDTO['status']): Promise<void> {
    try {
      console.log('Actualizando estado de postulación:', {
        postulationId,
        status
      });

      // Primero obtenemos la postulación actual
      const currentPostulation = await this.getPostulationById(postulationId);
      console.log('Postulación actual:', currentPostulation);

      // Actualizamos la postulación con el nuevo estado
      const response = await api.patch(`/postulations/${postulationId}`, {
        status,
        athlete_id: currentPostulation.athlete?.id,
        semester_id: currentPostulation.semester?.id
      }, this.getAuthHeader());

      console.log('Estado de postulación actualizado:', response.data);
    } catch (error: any) {
      console.error('Error al actualizar estado de postulación:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw new Error('No se pudo actualizar el estado de la postulación');
    }
  }

  async updatePersonalInfo(postulationId: string, personalInfo: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    birth_date: string;
    gender: string;
    address: string;
    academic_info: {
      university: string;
      faculty: string;
      career: string;
      semester: number;
      student_id: string;
    };
  }): Promise<PostulationDTO> {
    this.validateId(postulationId, 'postulación');
    try {
      const response = await api.patch(`/postulations/${postulationId}/personal-info`, personalInfo);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar información personal:', error.message);
      throw new Error('No se pudo actualizar la información personal');
    }
  }

  async getPostulationById(id: string): Promise<PostulationDTO> {
    this.validateId(id, 'postulación');
    try {
      console.log('Obteniendo postulación:', id);
      const response = await api.get(`/postulations/${id}`, this.getAuthHeader());
      console.log('Respuesta del servidor:', response.data);
      
      if (!response.data.data) {
        throw new Error('No se encontró la postulación');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener postulación:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw new Error('No se pudo obtener la postulación');
    }
  }

  async getPostulationsByUser(userId: string): Promise<PostulationDTO[]> {
    this.validateId(userId, 'usuario');
    const response = await api.get(`/postulations/user/${userId}`);
    return response.data.data || [];
  }

  async getPostulationsByAthlete(athleteId: string): Promise<PostulationDTO[]> {
    try {
      const response = await api.get(`/postulations/athlete/${athleteId}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error al obtener postulaciones del atleta:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw new Error(error.response?.data?.message || 'No se pudieron obtener las postulaciones');
    }
  }

  async hasActivePostulation(userId: string): Promise<boolean> {
    try {
      this.validateId(userId, 'usuario');
      const postulations = await this.getPostulationsByUser(userId);
      return postulations.some(p => p.status === 'active');
    } catch (error) {
      console.error('Error al verificar postulación activa:', error);
      return false;
    }
  }

  async getPostulationProgress(postulationId: string): Promise<{
    personal_info_completed: boolean;
    parq_completed: boolean;
    sports_history_completed: boolean;
    documents_completed: boolean;
  }> {
    this.validateId(postulationId, 'postulación');
    try {
      const postulation = await this.getPostulationById(postulationId);
      return {
        personal_info_completed: postulation.personal_info_completed || false,
        parq_completed: postulation.par_q_completed || false,
        sports_history_completed: postulation.sports_history_completed || false,
        documents_completed: postulation.documents_completed || false
      };
    } catch (error: any) {
      console.error('Error al obtener progreso de postulación:', error.message);
      throw new Error('No se pudo obtener el progreso de la postulación');
    }
  }

  async updatePostulation(id: string, data: Partial<PostulationDTO>): Promise<PostulationDTO> {
    this.validateId(id, 'postulación');
    try {
      const response = await api.patch(`/postulations/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar postulación:', error.message);
      throw new Error('No se pudo actualizar la postulación');
    }
  }

  async updateParQCompletion(postulationId: string): Promise<void> {
    try {
      console.log('[Postulation Service] Actualizando estado PAR-Q:', postulationId);
      
      // Primero obtenemos la postulación actual para mantener los valores existentes
      const currentPostulation = await this.getPostulationById(postulationId);
      
      // Actualizamos el estado a "parq_completed" para indicar que se completó el PAR-Q
      const response = await api.patch(`/postulations/${postulationId}`, {
        status: 'parq_completed',
        athlete_id: currentPostulation.athlete?.id,
        semester_id: currentPostulation.semester?.id
      }, this.getAuthHeader());

      console.log('[Postulation Service] Estado PAR-Q actualizado:', response.data);
    } catch (error: any) {
      console.error('[Postulation Service] Error al actualizar estado PAR-Q:', error);
      throw new Error('No se pudo actualizar el estado del PAR-Q');
    }
  }
}

export const postulationService = new PostulationService(); 