export interface PostulationDTO {
  id: string;
  athlete?: any;
  semester?: any;

  // Estados de avance
  par_q_completed?: boolean;
  sports_history_completed?: boolean;
  documents_completed?: boolean;

  // Estado general
  status: 'active' | 'completed' | 'cancelled' | string;

  created_at: string;
  updated_at: string;
} 