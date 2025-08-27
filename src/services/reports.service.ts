import { api } from '@/lib/axios';

export interface ReportRow {
  athlete_name: string;
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

  async downloadCombinedReportPDF(semesterIds: string[], semesterNames: string[] = []): Promise<void> {
    try {
      // Para reportes combinados, necesitaremos hacer múltiples llamadas
      // Por ahora, descargaremos el primer semestre como ejemplo
      if (semesterIds.length > 0) {
        const firstSemesterId = semesterIds[0];
        const firstSemesterName = semesterNames[0] || 'Todos-los-semestres';
        await this.downloadReportPDF(firstSemesterId, firstSemesterName);
      }
    } catch (error) {
      console.error('Error al descargar reporte combinado:', error);
      throw new Error('No se pudo descargar el reporte combinado. Inténtalo de nuevo.');
    }
  }
}

export const reportsService = new ReportsService();
