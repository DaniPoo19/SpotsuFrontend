import axiosInstance from '../api/axios';
import { AspirantDTO, ApiResponse } from '../types/dtos';

interface FileStatus {
  status: 'Pendiente' | 'Completo' | 'Incompleto';
  documents: {
    sportsCertificate: boolean;
    medicalCertificate: boolean;
    consentForm: boolean;
  };
}

interface EvaluationStatus {
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  qualification: number | null;
}

// Rutas relativas (sin el prefijo /spotsu/api/v1)
const ENDPOINTS = {
  PEOPLE: '/people',
  FILES: '/files',
  EVALUATIONS: '/evaluations'
} as const;

export const aspirantsService = {
  async getAll(): Promise<AspirantDTO[]> {
    try {
      // Obtener lista de usuarios
      const usersResponse = await axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.PEOPLE);
      const users = usersResponse.data.data;

      // Obtener estados de archivos y evaluaciones para cada usuario
      const usersWithDetails = await Promise.all(
        users.map(async (user) => {
          const [filesResponse, evaluationResponse] = await Promise.all([
            axiosInstance.get<ApiResponse<FileStatus>>(`${ENDPOINTS.FILES}/${user.id}`),
            axiosInstance.get<ApiResponse<EvaluationStatus>>(`${ENDPOINTS.EVALUATIONS}/${user.id}`)
          ]);

          return {
            id: user.id,
            name: `${user.nombre} ${user.apellido}`,
            email: user.email || '',
            documentType: 'CC',
            documentNumber: user.cedula,
            discipline: null,
            status: evaluationResponse.data.data.status,
            qualification: evaluationResponse.data.data.qualification,
            fileStatus: filesResponse.data.data.status,
            documents: filesResponse.data.data.documents,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        })
      );

      return usersWithDetails;
    } catch (error) {
      console.error('Error al obtener aspirantes:', error);
      return [];
    }
  },

  async getById(id: string): Promise<AspirantDTO | null> {
    try {
      const [userResponse, filesResponse, evaluationResponse] = await Promise.all([
        axiosInstance.get<ApiResponse<any>>(`${ENDPOINTS.PEOPLE}/${id}`),
        axiosInstance.get<ApiResponse<FileStatus>>(`${ENDPOINTS.FILES}/${id}`),
        axiosInstance.get<ApiResponse<EvaluationStatus>>(`${ENDPOINTS.EVALUATIONS}/${id}`)
      ]);

      const user = userResponse.data.data;

      return {
        id: user.id,
        name: `${user.nombre} ${user.apellido}`,
        email: user.email || '',
        documentType: 'CC',
        documentNumber: user.cedula,
        discipline: null,
        status: evaluationResponse.data.data.status,
        qualification: evaluationResponse.data.data.qualification,
        fileStatus: filesResponse.data.data.status,
        documents: filesResponse.data.data.documents,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error al obtener aspirante:', error);
      return null;
    }
  },

  async create(aspirant: Partial<AspirantDTO>): Promise<AspirantDTO | null> {
    try {
      const response = await axiosInstance.post<ApiResponse<AspirantDTO>>(ENDPOINTS.PEOPLE, aspirant);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear aspirante:', error);
      return null;
    }
  },

  async update(id: string, aspirant: Partial<AspirantDTO>): Promise<AspirantDTO | null> {
    try {
      const response = await axiosInstance.put<ApiResponse<AspirantDTO>>(`${ENDPOINTS.PEOPLE}/${id}`, aspirant);
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar aspirante:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await axiosInstance.delete<ApiResponse<void>>(`${ENDPOINTS.PEOPLE}/${id}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar aspirante:', error);
      return false;
    }
  }
}; 