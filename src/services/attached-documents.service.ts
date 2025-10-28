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

      console.log('[Upload] Subiendo documento:', {
        postulation_id: data.postulation_id,
        attached_document_type_id: data.attached_document_type_id,
        fileName: data.file.name
      });

      const response = await axiosInstance.post<ApiResponse<any>>(
        ENDPOINTS.ATTACHED_DOCUMENTS,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('[Upload] Documento subido exitosamente:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[Upload] Error al subir documento:', error);
      if (error.response?.data) {
        console.error('[Upload] Error detallado:', error.response.data);
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
      const response = await axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.ATTACHED_DOCUMENTS);
      const documents = response.data.data || [];
      
      // El backend retorna la estructura correcta con las relaciones cargadas
      return documents.map((doc: any) => ({
        id: doc.id,
        postulation_id: doc.postulation?.id,
        attached_document_type_id: doc.attachedDocumentType?.id,
        file_name: 'documento.pdf',
        file_path: doc.path,
        file_size: 0,
        mime_type: 'application/pdf',
        status: doc.status,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        attachedDocumentType: doc.attachedDocumentType,
        postulation: doc.postulation
      }));
    } catch (error: any) {
      console.error('[AttachedDocuments] Error al obtener documentos:', error);
      if (error.response?.status === 400) {
        console.error('[AttachedDocuments] Error 400 - Bad Request:', error.response.data);
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