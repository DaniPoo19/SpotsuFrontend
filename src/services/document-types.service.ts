import { api } from '@/lib/axios';
import { ApiResponse } from '@/types/dtos';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  created_at: string;
  updated_at: string;
}

export const documentTypesService = {
  async getDocumentTypes(): Promise<DocumentType[]> {
    try {
      const response = await api.get<ApiResponse<DocumentType[]>>('/document-types');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener tipos de documentos:', error);
      throw new Error('Error al obtener tipos de documentos');
    }
  },

  async getDocumentType(id: string): Promise<DocumentType> {
    try {
      const response = await api.get<ApiResponse<DocumentType>>(`/document-types/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener tipo de documento:', error);
      throw new Error('Error al obtener tipo de documento');
    }
  }
};

