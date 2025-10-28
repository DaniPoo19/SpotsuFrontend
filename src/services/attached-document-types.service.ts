import { api } from '@/lib/axios';
import { ApiResponse } from '@/types/dtos';

export interface AttachedDocumentType {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export const attachedDocumentTypesService = {
  async getAttachedDocumentTypes(): Promise<AttachedDocumentType[]> {
    try {
      const response = await api.get<ApiResponse<AttachedDocumentType[]>>('/attached-document-types');
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener tipos de documentos adjuntos:', error);
      return [];
    }
  },

  async getAttachedDocumentType(id: string): Promise<AttachedDocumentType> {
    try {
      const response = await api.get<ApiResponse<AttachedDocumentType>>(`/attached-document-types/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener tipo de documento adjunto:', error);
      throw new Error('Error al obtener tipo de documento adjunto');
    }
  }
};

