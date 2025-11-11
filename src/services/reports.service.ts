import { api } from '@/lib/axios';

export interface ReportRow {
  postulation_id: string;
  athlete_name: string;
  semester_name: string;
  semester_id: string;
  sports_score: number;
  morpho_score: number;
  total_score: number;
}

export interface ReportData {
  data: ReportRow[];
  pdfDefinition: any;
}

class ReportsService {
  async getReportData(semesterId: string): Promise<ReportData> {
    const response = await api.get(`/postulations/report/${semesterId}`);
    return response.data;
  }

  async downloadReportPDF(semesterId: string, semesterName: string = 'Semestre'): Promise<void> {
    try {
      const response = await api.get(`/postulations/report/${semesterId}/pdf`, {
        responseType: 'blob', // Importante para recibir el PDF como blob
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Crear URL para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Crear elemento de descarga temporal
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo con fecha actual
      const today = new Date().toISOString().split('T')[0];
      const fileName = `reporte-postulaciones-${semesterName.toLowerCase().replace(/\s+/g, '-')}-${today}.pdf`;
      link.download = fileName;
      
      // Simular click para iniciar descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar reporte PDF:', error);
      throw new Error('No se pudo descargar el reporte. Inténtalo de nuevo.');
    }
  }

  async downloadCombinedReportPDF(_semesterIds: string[], _semesterNames: string[] = []): Promise<void> {
    try {
      console.log('[Reports] Descargando reporte combinado PDF...');
      const response = await api.get('/postulations/report/combined/pdf', {
        responseType: 'blob', // Importante para recibir el PDF como blob
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Crear URL para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Crear elemento de descarga temporal
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo con fecha actual
      const today = new Date().toISOString().split('T')[0];
      const fileName = `reporte-combinado-todos-los-semestres-${today}.pdf`;
      link.download = fileName;
      
      // Simular click para iniciar descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('[Reports] Error al descargar reporte combinado:', error);
      if (error.response?.status === 400) {
        console.error('[Reports] Error 400 - Bad Request:', error.response.data);
        throw new Error('Error en el servidor al generar el reporte. Verifique que hay datos disponibles.');
      }
      throw new Error('No se pudo descargar el reporte combinado. Inténtalo de nuevo.');
    }
  }

  /**
   * Descarga el reporte individual de una postulación específica
   * @param postulationId ID de la postulación
   * @param athleteName Nombre del atleta (opcional, para el nombre del archivo)
   */
  async downloadIndividualReportPDF(postulationId: string, athleteName?: string): Promise<void> {
    try {
      console.log('[Reports] Descargando reporte individual PDF para postulación:', postulationId);
      const response = await api.get(`/postulations/individual-report/${postulationId}/pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Crear URL para el blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Crear elemento de descarga temporal
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo con fecha actual
      const today = new Date().toISOString().split('T')[0];
      const sanitizedName = athleteName 
        ? athleteName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : postulationId;
      const fileName = `reporte-individual-${sanitizedName}-${today}.pdf`;
      link.download = fileName;
      
      // Simular click para iniciar descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('[Reports] Reporte individual descargado exitosamente');
    } catch (error: any) {
      console.error('[Reports] Error al descargar reporte individual:', error);
      if (error.response?.status === 404) {
        throw new Error('No se encontró el reporte. Verifica que la postulación tenga todos los datos necesarios.');
      }
      if (error.response?.status === 400) {
        throw new Error('Error al generar el reporte. Verifica que el deportista tenga evaluaciones completas.');
      }
      throw new Error('No se pudo descargar el reporte individual. Inténtalo de nuevo.');
    }
  }
}

export const reportsService = new ReportsService();
