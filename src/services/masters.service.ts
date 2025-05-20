import axiosInstance from '../api/axios';
import { DocumentTypeDTO, GenderDTO, ApiResponse } from '../types/dtos';
import API_ENDPOINTS from '../api/endpoints';

export interface DocumentType {
  id: string;
  name: string;
}

export interface Gender {
  id: string;
  name: string;
}

export const mastersService = {
  async getDocumentTypes(): Promise<DocumentTypeDTO[]> {
    const response = await axiosInstance.get<ApiResponse<DocumentTypeDTO[]>>(API_ENDPOINTS.MASTERS.DOCUMENT_TYPES);
    return response.data.data;
  },

  async getGenders(): Promise<GenderDTO[]> {
    const response = await axiosInstance.get<ApiResponse<GenderDTO[]>>(API_ENDPOINTS.MASTERS.GENDERS);
    return response.data.data;
  }
}; 