import axiosInstance from '../api/axios';
import API_ENDPOINTS from '../api/endpoints';
import { ParQQuestion, ParQResponseDto, ParQResponseResult } from '../types/dtos';

class ParQService {
  async getQuestions(): Promise<ParQQuestion[]> {
    try {
      const response = await axiosInstance.get<{ data: ParQQuestion[] }>(API_ENDPOINTS.PARQ.QUESTIONS);
      return response.data.data || [];
    } catch (error: any) {
      if (error.response) {
        throw new Error('Error al obtener las preguntas del PAR-Q');
      }
      throw new Error('Error de conexión');
    }
  }

  async submitAnswers(postulationId: string, answers: Record<string, boolean>): Promise<ParQResponseResult> {
    try {
      // Validar que todos los campos requeridos estén presentes
      const responses: ParQResponseDto[] = Object.entries(answers).map(([questionId, response]) => {
        if (!questionId || typeof response !== 'boolean') {
          throw new Error('Datos de respuesta inválidos');
        }
        return {
          postulation_id: postulationId,
          question_id: questionId,
          response
        };
      });

      const response = await axiosInstance.post<{ data: ParQResponseResult }>(
        API_ENDPOINTS.PARQ.RESPONSES,
        { responses }
      );

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Por favor responda todas las preguntas correctamente');
      }
      throw new Error('Error al enviar las respuestas');
    }
  }
}

export const parqService = new ParQService(); 