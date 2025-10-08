import axiosInstance from '../api/axios';
import { AspirantDTO, ApiResponse } from '../types/dtos';

// Rutas relativas (sin el prefijo /tracksport/api/v1)
const ENDPOINTS = {
  ATHLETES: '/athletes',
  SPORT_HISTORIES: '/sport-histories',
  ATTACHED_DOCUMENTS: '/attached-documents'
} as const;

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface PaginatedApiResponse<T> extends ApiResponse<T> {
  total: number;
}

export const aspirantsService = {
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<AspirantDTO>> {
    try {
      const [athletesResponse, sportHistoriesResponse, documentsResponse] = await Promise.all([
        axiosInstance.get<PaginatedApiResponse<any[]>>(`${ENDPOINTS.ATHLETES}?page=${page}&limit=${limit}`),
        axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.SPORT_HISTORIES),
        axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.ATTACHED_DOCUMENTS)
      ]);

      const athletes = athletesResponse.data.data || [];
      const sportHistories = sportHistoriesResponse.data.data || [];
      const documents = documentsResponse.data.data || [];

      const items = athletes.map(athlete => {
        const athleteSportHistories = sportHistories.filter(
          history => history?.athlete_id === athlete.id
        ) || [];
        const athleteDocuments = documents.filter(
          doc => doc?.reference_id === athlete.id && doc?.reference_type === 'athlete'
        ) || [];

        const hasSportsCertificate = athleteDocuments.some(doc => doc?.document_type_id === '1');
        const hasMedicalCertificate = athleteDocuments.some(doc => doc?.document_type_id === '2');
        const hasConsentForm = athleteDocuments.some(doc => doc?.document_type_id === '3');

        const fileStatus: 'Pendiente' | 'Completo' | 'Incompleto' = hasSportsCertificate && hasMedicalCertificate && hasConsentForm
          ? 'Completo'
          : hasSportsCertificate || hasMedicalCertificate || hasConsentForm
            ? 'Incompleto'
            : 'Pendiente';

        return {
          id: athlete.id,
          name: `${athlete.name || ''} ${athlete.last_name || ''}`,
          email: athlete.email || '',
          documentType: athlete.document_type?.name || 'CC',
          documentNumber: athlete.document_number || '',
          discipline: athleteSportHistories[0]?.sport?.name || null,
          status: athleteSportHistories[0]?.status || 'Pendiente',
          qualification: null,
          fileStatus,
          documents: {
            sportsCertificate: hasSportsCertificate,
            medicalCertificate: hasMedicalCertificate,
            consentForm: hasConsentForm
          },
          createdAt: athlete.created_at || new Date().toISOString(),
          updatedAt: athlete.updated_at || new Date().toISOString(),
          birthDate: athlete.birth_date,
          gender: athlete.gender?.name,
          city: athlete.city,
          state: athlete.state,
          country: athlete.country,
          address: athlete.address,
          phone: athlete.phone,
          sportHistories: athleteSportHistories.map(history => ({
            id: history.id,
            sport: history.sport || { id: '', name: '' },
            startDate: history.start_date || '',
            endDate: history.end_date || null,
            institution: history.institution || '',
            achievements: history.achievements || '',
            status: history.status || 'Pendiente'
          }))
        };
      });

      return {
        items,
        total: athletesResponse.data.total || items.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error al obtener aspirantes:', error);
      return {
        items: [],
        total: 0,
        page,
        limit
      };
    }
  },

  async getById(id: string): Promise<AspirantDTO | null> {
    try {
      const [athleteResponse, sportHistoriesResponse, documentsResponse] = await Promise.all([
        axiosInstance.get<ApiResponse<any>>(`${ENDPOINTS.ATHLETES}/${id}`),
        axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.SPORT_HISTORIES),
        axiosInstance.get<ApiResponse<any[]>>(ENDPOINTS.ATTACHED_DOCUMENTS)
      ]);

      const athlete = athleteResponse.data.data;
      if (!athlete) return null;

      const sportHistories = (sportHistoriesResponse.data.data || []).filter(
        history => history?.athlete_id === id
      );
      const documents = (documentsResponse.data.data || []).filter(
        doc => doc?.reference_id === id && doc?.reference_type === 'athlete'
      );

      const hasSportsCertificate = documents.some(doc => doc?.document_type_id === '1');
      const hasMedicalCertificate = documents.some(doc => doc?.document_type_id === '2');
      const hasConsentForm = documents.some(doc => doc?.document_type_id === '3');

      const fileStatus = hasSportsCertificate && hasMedicalCertificate && hasConsentForm
        ? 'Completo'
        : hasSportsCertificate || hasMedicalCertificate || hasConsentForm
          ? 'Incompleto'
          : 'Pendiente';

      return {
        id: athlete.id,
        name: `${athlete.name || ''} ${athlete.last_name || ''}`,
        email: athlete.email || '',
        documentType: athlete.document_type?.name || 'CC',
        documentNumber: athlete.document_number || '',
        discipline: sportHistories[0]?.sport?.name || null,
        status: sportHistories[0]?.status || 'Pendiente',
        qualification: null,
        fileStatus,
        documents: {
          sportsCertificate: hasSportsCertificate,
          medicalCertificate: hasMedicalCertificate,
          consentForm: hasConsentForm
        },
        createdAt: athlete.created_at || new Date().toISOString(),
        updatedAt: athlete.updated_at || new Date().toISOString(),
        birthDate: athlete.birth_date,
        gender: athlete.gender?.name,
        city: athlete.city,
        state: athlete.state,
        country: athlete.country,
        address: athlete.address,
        phone: athlete.phone,
        sportHistories: sportHistories.map(history => ({
          id: history.id,
          sport: history.sport || { id: '', name: '' },
          startDate: history.start_date || '',
          endDate: history.end_date || null,
          institution: history.institution || '',
          achievements: history.achievements || '',
          status: history.status || 'Pendiente'
        }))
      };
    } catch (error) {
      console.error('Error al obtener aspirante:', error);
      return null;
    }
  },

  async create(aspirant: Partial<AspirantDTO>): Promise<AspirantDTO | null> {
    try {
      const [name, last_name] = aspirant.name?.split(' ') || ['', ''];
      const response = await axiosInstance.post<ApiResponse<AspirantDTO>>(ENDPOINTS.ATHLETES, {
        name,
        last_name,
        email: aspirant.email,
        document_number: aspirant.documentNumber,
        document_type_id: '1', // Por defecto CC
        gender_id: '1', // Por defecto Masculino
        birth_date: new Date().toISOString(),
        city: '',
        state: '',
        country: '',
        address: '',
        phone: ''
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al crear aspirante:', error);
      return null;
    }
  },

  async update(id: string, aspirant: Partial<AspirantDTO>): Promise<AspirantDTO | null> {
    try {
      const [name, last_name] = aspirant.name?.split(' ') || ['', ''];
      const response = await axiosInstance.patch<ApiResponse<AspirantDTO>>(`${ENDPOINTS.ATHLETES}/${id}`, {
        name,
        last_name,
        email: aspirant.email,
        document_number: aspirant.documentNumber
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar aspirante:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await axiosInstance.delete<ApiResponse<void>>(`${ENDPOINTS.ATHLETES}/${id}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar aspirante:', error);
      return false;
    }
  }
};