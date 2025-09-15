import axiosInstance from '../api/axios';
import { ApiResponse } from '../types/dtos';

const ENDPOINTS = {
  ATTACHED_DOCUMENTS: '/attached-documents'
} as const;

export interface AttachedDocumentDTO {
  id: string;
  document_type_id: string;
  reference_id: string;
  reference_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachedDocumentDTO {
  postulation_id: string;
  attached_document_type_id: string;
  file: File;
}

export const attachedDocumentsService = {
  async uploadDocument(data: CreateAttachedDocumentDTO): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('postulation_id', data.postulation_id);
      formData.append('attached_document_type_id', data.attached_document_type_id);

      const response = await axiosInstance.post<ApiResponse<any>>(
        ENDPOINTS.ATTACHED_DOCUMENTS,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      if (error.response?.data) {
        console.error('Error detallado:', error.response.data);
        if (Array.isArray(error.response.data.message)) {
          throw new Error(error.response.data.message.join(', '));
        }
        throw new Error(error.response.data.message || 'Error al subir documento');
      }
      throw new Error('Error al conectar con el servidor');
    }
  },

  async getDocuments(): Promise<any[]> {
    try {
      console.log('[AttachedDocuments] Obteniendo documentos desde:', ENDPOINTS.ATTACHED_DOCUMENTS);
      const response = await axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.ATTACHED_DOCUMENTS);
      console.log('[AttachedDocuments] Respuesta recibida:', response.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('[AttachedDocuments] Error al obtener documentos:', error);
      if (error.response?.status === 400) {
        console.error('[AttachedDocuments] Error 400 - Bad Request:', error.response.data);
        // Retornar array vacío en lugar de lanzar error para evitar romper la UI
        return [];
      }
      throw new Error('Error al obtener documentos');
    }
  },

  async getDocument(id: string): Promise<any> {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(`${ENDPOINTS.ATTACHED_DOCUMENTS}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener documento:', error);
      throw new Error('Error al obtener documento');
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await axiosInstance.delete<ApiResponse<void>>(`${ENDPOINTS.ATTACHED_DOCUMENTS}/${id}`);
    } catch (error: any) {
      console.error('Error al eliminar documento:', error);
      throw new Error('Error al eliminar documento');
    }
  },

  async updateDocument(id: string, data: { status: string }): Promise<AttachedDocumentDTO> {
    try {
      const response = await axiosInstance.patch<ApiResponse<AttachedDocumentDTO>>(
        `${ENDPOINTS.ATTACHED_DOCUMENTS}/${id}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar documento:', error);
      if (error.response?.data) {
        console.error('Error detallado:', error.response.data);
        if (Array.isArray(error.response.data.message)) {
          throw new Error(error.response.data.message.join(', '));
        }
        throw new Error(error.response.data.message || 'Error al actualizar documento');
      }
      throw new Error('Error al conectar con el servidor');
    }
  }
}; 