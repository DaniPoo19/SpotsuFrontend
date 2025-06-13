export interface ParQQuestion {
  id: string;
  question: string;
  description?: string;
  order: number;
}

export interface ParQResponse {
  question_id: string;
  response: boolean;
} 