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
      if (semesterIds.length === 0) {
        throw new Error('No hay semestres disponibles para generar el reporte');
      }

      // Obtener datos de todos los semestres
      const allReportData = await Promise.all(
        semesterIds.map(async (semesterId, index) => {
          try {
            const response = await api.get(`/postulations/report/${semesterId}`);
            const reportData = response.data.data || response.data;
            let data: ReportRow[] = [];
            
            if (Array.isArray(reportData)) {
              data = reportData;
            } else if (reportData && Array.isArray(reportData.data)) {
              data = reportData.data;
            }
            
            // Agregar información del semestre a cada fila
            return data.map(row => ({
              ...row,
              semester_name: semesterNames[index] || `Semestre ${semesterId}`
            }));
          } catch (error) {
            console.error(`Error obteniendo datos del semestre ${semesterId}:`, error);
            return [];
          }
        })
      );

      // Combinar todos los datos
      const combinedData = allReportData.flat();
      
      if (combinedData.length === 0) {
        throw new Error('No hay datos disponibles para generar el reporte combinado');
      }

      // Crear un blob con los datos combinados como JSON
      const blob = new Blob([JSON.stringify(combinedData, null, 2)], { 
        type: 'application/json' 
      });
      
      // Por ahora, descargaremos los datos como JSON
      // En una implementación futura, se podría generar un PDF combinado
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const today = new Date().toISOString().split('T')[0];
      const fileName = `reporte-combinado-todos-los-semestres-${today}.json`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar reporte combinado:', error);
      throw new Error('No se pudo descargar el reporte combinado. Inténtalo de nuevo.');
    }
  }
}

export const reportsService = new ReportsService();
