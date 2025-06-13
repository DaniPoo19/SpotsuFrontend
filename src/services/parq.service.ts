import axios from 'axios';
import { api } from './api';
import { ParQQuestion, ParQResponse } from '../types/dtos';
import { postulationService } from './postulation.service';

export class ParQService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getParQQuestions(): Promise<ParQQuestion[]> {
    try {
      const response = await api.get('/par-q');
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener preguntas PAR-Q:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar las preguntas');
    }
  }

  async submitParQResponses(postulationId: string, responses: Record<string, boolean>): Promise<void> {
    try {
      console.log('[PAR-Q Submit] Enviando respuestas:', {
        postulationId,
        totalResponses: Object.keys(responses).length,
        responses
      });

      const formattedResponses = Object.entries(responses).map(([questionId, response]) => ({
        postulation_id: postulationId,
        question_id: questionId,
        response: response
      }));

      // Enviar respuestas y actualizar estado inmediatamente si encontramos una positiva
      for (const response of formattedResponses) {
        console.log('[PAR-Q Submit] Enviando respuesta individual:', response);
        const result = await api.post('/par-qresponses', response);
        console.log('[PAR-Q Submit] Respuesta guardada:', result.data);

        // Si es una respuesta positiva, actualizar el estado inmediatamente
        if (response.response === true) {
          await postulationService.updatePostulationStatus(postulationId, 'cancelled');
          console.log('[PAR-Q Submit] Postulación cancelada debido a respuesta positiva');
          return; // Terminar aquí, no necesitamos continuar
        }
      }

      // Si llegamos aquí, todas las respuestas fueron negativas
      await postulationService.updateParQCompletion(postulationId);
      console.log('[PAR-Q Submit] Estado de postulación actualizado (todas las respuestas negativas)');
    } catch (error: any) {
      console.error('[PAR-Q Submit Error]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al enviar las respuestas');
    }
  }

  async checkParQCompletion(postulationId: string): Promise<boolean> {
    try {
      console.log('[PAR-Q Check] Verificando completitud para postulación:', postulationId);

      // Obtener la postulación para verificar su estado
      const postulationResponse = await api.get(`/postulations/${postulationId}`);
      const postulation = postulationResponse.data.data;

      // Regla 1: Si la postulación está "cancelled" (respuesta positiva) => PAR-Q completo (aunque no apto)
      if (postulation.status === 'cancelled') {
        console.log('[PAR-Q Check] Postulación cancelada por respuesta positiva');
        return true;
      }

      // Regla 2: Si la postulación está "completed" (todas negativas y pasos siguientes completos) => PAR-Q completo
      if (postulation.status === 'completed') {
        console.log('[PAR-Q Check] Postulación con respuesta positiva (completed)');
        return true;
      }

      // Regla 3: Si la postulación está "parq_completed" (todas negativas) => PAR-Q completo
      if (postulation.status === 'parq_completed') {
        console.log('[PAR-Q Check] Postulación con PAR-Q completado (todas negativas)');
        return true;
      }

      // En cualquier otro caso, el PAR-Q aún no se ha completado
      console.log('[PAR-Q Check] PAR-Q aún no completado. Estado actual:', postulation.status);
      return false;
    } catch (error: any) {
      console.error('[PAR-Q Check Error]:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al verificar el estado del PAR-Q');
    }
  }
}

export const parqService = new ParQService(); 