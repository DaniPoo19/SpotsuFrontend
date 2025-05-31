import axiosInstance from '../api/axios';
import { AthleteDTO, ApiResponse } from '../types/dtos';
import { isAxiosError } from 'axios';
import API_ENDPOINTS from '../api/endpoints';

export interface CreateAthleteDTO {
  name: string;
  last_name: string;
  birth_date: Date;
  document_type_id: string;
  document_number: string;
  gender_id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
}

const ENDPOINTS = {
  ATHLETES: '/athletes'
} as const;

export const athletesService = {
  async registerPersonalData(data: any): Promise<any> {
    try {
      // Asegurarse de que birthDate sea un objeto Date válido
      let birthDate: string;
      try {
        if (data.birthDate instanceof Date) {
          birthDate = data.birthDate.toISOString().split('T')[0];
        } else if (typeof data.birthDate === 'string') {
          birthDate = new Date(data.birthDate).toISOString().split('T')[0];
        } else {
          throw new Error('Formato de fecha inválido');
        }
      } catch (error) {
        console.error('Error al procesar la fecha:', error);
        throw new Error('La fecha de nacimiento es inválida');
      }

      // Formatear los datos según el DTO del backend
      const formattedData = {
        name: data.name?.trim() || '',
        last_name: data.lastName?.trim() || '',
        birth_date: birthDate,
        document_type_id: data.documentType,
        document_number: data.documentNumber?.trim() || '',
        gender_id: data.sex,
        city: data.city?.trim() || '',
        state: data.department?.trim() || '',
        country: data.country?.trim() || '',
        address: data.address?.trim() || '',
        email: data.email?.trim().toLowerCase() || '',
        phone: data.phone?.trim() || ''
      };

      console.log('Datos formateados para el backend:', formattedData);
      
      const response = await axiosInstance.post<ApiResponse<any>>(ENDPOINTS.ATHLETES, formattedData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al registrar deportista:', error);
      if (error.response?.data) {
        console.error('Error detallado:', error.response.data);
        // Si hay mensajes de error específicos del backend, mostrarlos
        if (Array.isArray(error.response.data.message)) {
          throw new Error(error.response.data.message.join(', '));
        }
        throw new Error(error.response.data.message || 'Error al registrar deportista');
      }
      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  },

  async getAthletes(): Promise<AthleteDTO[]> {
    const response = await axiosInstance.get<ApiResponse<AthleteDTO[]>>(API_ENDPOINTS.ATHLETES.BASE);
    return response.data.data;
  },

  async getAthlete(id: string): Promise<AthleteDTO> {
    const response = await axiosInstance.get<ApiResponse<AthleteDTO>>(API_ENDPOINTS.ATHLETES.BY_ID(id));
    return response.data.data;
  },

  async updateAthlete(id: string, dto: Partial<CreateAthleteDTO>): Promise<AthleteDTO> {
    // Si hay una fecha en el DTO, asegurarse de que se envíe en el formato correcto
    if (dto.birth_date) {
      const formattedDto = {
        ...dto,
        birth_date: dto.birth_date.toISOString().split('T')[0]
      };
      const response = await axiosInstance.patch<ApiResponse<AthleteDTO>>(API_ENDPOINTS.ATHLETES.BY_ID(id), formattedDto);
      return response.data.data;
    }
    
    const response = await axiosInstance.patch<ApiResponse<AthleteDTO>>(API_ENDPOINTS.ATHLETES.BY_ID(id), dto);
    return response.data.data;
  },

  async deleteAthlete(id: string): Promise<void> {
    await axiosInstance.delete<ApiResponse<void>>(API_ENDPOINTS.ATHLETES.BY_ID(id));
  }
}; 