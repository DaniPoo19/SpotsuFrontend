import axiosInstance, { checkServerConnection } from '../api/axios';
import { PersonDTO, ApiResponse, DocumentTypeDTO, GenderDTO } from '../types/dtos';
import API_ENDPOINTS from '../api/endpoints';
import { toast } from 'react-hot-toast';

// Interfaz para la creación inicial del usuario
export interface CreateUserDTO {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role_id: string;
}

// Interfaz para los datos adicionales
export interface UpdatePersonDataDTO {
  birth_date: string;
  document_type_id: string;
  document_number: string;
  gender_id: string;
  address: string;
  city: string;
  department: string;
  country: string;
  phone: string;
  family_phone: string;
}

export const peopleService = {
  async checkConnection(): Promise<boolean> {
    try {
      await checkServerConnection();
      return true;
    } catch (error) {
      console.error('Error de conexión:', error);
      return false;
    }
  },

  async getPeople(): Promise<PersonDTO[]> {
    const response = await axiosInstance.get<ApiResponse<PersonDTO[]>>(API_ENDPOINTS.PEOPLE.BASE);
    return response.data.data;
  },

  async getPerson(id: string): Promise<PersonDTO> {
    const response = await axiosInstance.get<ApiResponse<PersonDTO>>(API_ENDPOINTS.PEOPLE.BY_ID(id));
    return response.data.data;
  },

  async createPerson(formData: any): Promise<PersonDTO> {
    try {
      console.log('Iniciando proceso de creación de persona...');
      
      // Paso 1: Crear el usuario básico
      const userData: CreateUserDTO = {
        name: formData.name.trim(),
        lastname: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: '12345678', // Contraseña por defecto
        role_id: 'c5d9a176-a10c-4a78-9e33-d2a5c62f3a89' // ID del rol de usuario
      };
      
      console.log('Creando usuario básico:', userData);
      const userResponse = await axiosInstance.post<ApiResponse<PersonDTO>>(API_ENDPOINTS.PEOPLE.BASE, userData);
      const createdUser = userResponse.data.data;
      
      // Paso 2: Actualizar con los datos adicionales
      const additionalData: UpdatePersonDataDTO = {
        birth_date: formData.birthDate,
        document_type_id: formData.documentType,
        document_number: formData.documentNumber.trim(),
        gender_id: formData.sex,
        address: formData.address.trim(),
        city: formData.city.trim(),
        department: formData.department.trim(),
        country: formData.country.trim(),
        phone: formData.phone.trim(),
        family_phone: formData.familyPhone.trim()
      };
      
      console.log('Actualizando con datos adicionales:', additionalData);
      const updateResponse = await axiosInstance.patch<ApiResponse<PersonDTO>>(
        API_ENDPOINTS.PEOPLE.BY_ID(createdUser.id),
        additionalData
      );
      
      return updateResponse.data.data;
    } catch (error: any) {
      console.error('Error en createPerson:', error);
      
      let errorMessage = 'Error al crear persona';
      
      if (error.response) {
        const { status, data } = error.response;
        errorMessage = `Error ${status}: ${data.message || 'Error en la respuesta del servidor'}`;
        console.error('Detalles del error de respuesta:', data);
      } else if (error.request) {
        errorMessage = 'No se recibió respuesta del servidor. Verifique que el backend esté en ejecución.';
      } else {
        errorMessage = `Error en la solicitud: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  async updatePerson(id: string, dto: Partial<UpdatePersonDataDTO>): Promise<PersonDTO> {
    const response = await axiosInstance.patch<ApiResponse<PersonDTO>>(API_ENDPOINTS.PEOPLE.BY_ID(id), dto);
    return response.data.data;
  },

  async deletePerson(id: string): Promise<void> {
    await axiosInstance.delete<ApiResponse<void>>(API_ENDPOINTS.PEOPLE.BY_ID(id));
  },

  // Métodos para obtener los datos maestros
  async fetchGenders(): Promise<GenderDTO[]> {
      const response = await axiosInstance.get<ApiResponse<GenderDTO[]>>(API_ENDPOINTS.MASTERS.GENDERS);
      return response.data.data;
  },

  async fetchDocumentTypes(): Promise<DocumentTypeDTO[]> {
      const response = await axiosInstance.get<ApiResponse<DocumentTypeDTO[]>>(API_ENDPOINTS.MASTERS.DOCUMENT_TYPES);
      return response.data.data;
  }
}; 