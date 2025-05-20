import { api } from '../lib/axios';
import API_ENDPOINTS from '../api/endpoints';

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
  file: File;
  document_type_id: string;
  reference_id: string;
  reference_type: string;
}

export const attachedDocumentsService = {
  uploadDocument: async (dto: CreateAttachedDocumentDTO): Promise<AttachedDocumentDTO> => {
    try {
      const formData = new FormData();
      formData.append('file', dto.file);
      formData.append('document_type_id', dto.document_type_id);
      formData.append('reference_id', dto.reference_id);
      formData.append('reference_type', dto.reference_type);

      const response = await api.post(API_ENDPOINTS.ATTACHED_DOCUMENTS.BASE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  },

  getDocumentsByReference: async (referenceId: string, referenceType: string): Promise<AttachedDocumentDTO[]> => {
    try {
      const response = await api.get(
        API_ENDPOINTS.ATTACHED_DOCUMENTS.BY_REFERENCE(referenceId, referenceType)
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener documentos por referencia:', error);
      throw error;
    }
  },

  deleteDocument: async (id: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.ATTACHED_DOCUMENTS.BY_ID(id));
    } catch (error) {
      console.error(`Error al eliminar documento ${id}:`, error);
      throw error;
    }
  }
}; 