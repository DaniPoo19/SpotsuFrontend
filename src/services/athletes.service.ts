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

export const athletesService = {
  async registerPersonalData(formData: any): Promise<AthleteDTO> {
    try {
      console.log('Enviando datos del deportista al backend...');
      
      // Transformar los datos al formato esperado por el backend
      const athleteData: CreateAthleteDTO = {
        name: formData.name.trim(),
        last_name: formData.lastName.trim(),
        birth_date: new Date(formData.birthDate + 'T00:00:00.000Z'), // Convertir a Date con hora 00:00:00
        document_type_id: formData.documentType,
        document_number: formData.documentNumber.trim(),
        gender_id: formData.sex,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.department.trim(), // Usar department como state
        country: formData.country.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      };

      console.log('Datos formateados:', athleteData);
      
      // Crear una copia del objeto para enviar al backend
      const dataToSend = {
        ...athleteData,
        birth_date: athleteData.birth_date.toISOString().split('T')[0] // Formato YYYY-MM-DD
      };

      console.log('Datos a enviar:', dataToSend);
      const response = await axiosInstance.post<ApiResponse<AthleteDTO>>(API_ENDPOINTS.ATHLETES.BASE, dataToSend);
      console.log('Respuesta del servidor:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error al registrar deportista:', error);
      if (isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.message || 'Error al registrar datos del deportista';
        console.error('Error detallado:', error.response.data);
        throw new Error(errorMessage);
      }
      throw new Error('Error al conectar con el servidor');
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