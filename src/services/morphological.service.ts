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

export const morphologicalService = {
  async getVariables(): Promise<MorphologicalVariable[]> {
    const resp = await api.get('/morphological-variables');
    return resp.data.data;
  },

  async getVariablesWeights(): Promise<MorphologicalVariablesWeight[]> {
    const resp = await api.get('/morphological-variables-weight');
    return resp.data.data;
  },

  async createVariableResults(postulationId: string, variables: VariableResultPayload[]) {
    const resp = await api.post('/morphological-variable-results', {
      postulation_id: postulationId,
      variables,
    });
    return resp.data.data;
  },

  async createVariableResult(postulationId: string, variable: VariableResultPayload) {
    const resp = await api.post('/morphological-variable-results', {
      postulation_id: postulationId,
      variables: [variable],
    });
    return resp.data.data;
  },
}; 