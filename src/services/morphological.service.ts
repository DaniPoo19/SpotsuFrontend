import { api } from '@/lib/axios';
import { ApiResponse, AspirantDTO } from '@/types/dtos';

export interface MorphologicalVariable {
  id: string;
  name: string;
  unit: string;
}

export interface MorphologicalVariablesWeight {
  id: string;
  morphological_variable: MorphologicalVariable;
  gender: {
    id: string;
    name: string;
  };
  sport: {
    id: string;
    name: string;
  };
  min_value: number;
  max_value: number;
  score: number;
}

export interface VariableResultPayload {
  morphological_variable_id: string;
  result: number;
}

export interface ExistingVariableResult {
  id: string;
  result: number;
  morphological_variable_id?: string;
  morphological_variable?: { id: string };
}

export const morphologicalService = {
  async getVariables(): Promise<MorphologicalVariable[]> {
    const resp = await api.get('/morphological-variables');
    return resp.data.data;
  },

  async getVariableResults(postulationId: string): Promise<ExistingVariableResult[]> {
    const { data } = await api.get(`/morphological-variable-results`, {
      params: { postulation_id: postulationId },
    });
    return data.data;
  },

  async getVariablesWeights(): Promise<MorphologicalVariablesWeight[]> {
    const resp = await api.get('/morphological-variables-weight');
    return resp.data.data;
  },

  async createVariableResults(postulationId: string, variables: VariableResultPayload[]) {
    return api.post('/morphological-variable-results', {
      postulation_id: postulationId,
      variables,
    });
  },

  async createVariableResult(postulationId: string, variable: VariableResultPayload) {
    const resp = await api.post('/morphological-variable-results', {
      postulation_id: postulationId,
      variables: [variable],
    });
    return resp.data.data;
  },

  async updateVariableResult(id: string, result: number) {
    const resp = await api.patch(`/morphological-variable-results/${id}`, { result });
    return resp.data?.data ?? resp.data;
  },

  /**
   * Actualizar todas las variables morfológicas de una postulación
   * Este método usa el endpoint correcto del backend que actualiza/crea en batch
   * @param postulationId ID de la postulación
   * @param variables Array de variables con morphological_variable_id y result
   */
  async updateVariableResults(postulationId: string, variables: VariableResultPayload[]) {
    const resp = await api.patch('/morphological-variable-results', {
      postulation_id: postulationId,
      variables,
    });
    return resp.data?.data ?? resp.data;
  },

  /**
   * Obtener el puntaje morfofuncional total calculado por el backend para una postulación
   * @param postulationId ID de la postulación
   * @returns Puntaje numérico
   */
  async getPostulationScore(postulationId: string): Promise<number> {
    if (!postulationId) throw new Error('Se requiere postulationId');
    const resp = await api.get(`/morphological-variable-results/score/${postulationId}`);
    // El backend envuelve respuesta con helper => { data: { score: number } }
    return resp.data?.data?.score ?? resp.data?.score ?? 0;
  },
}; 