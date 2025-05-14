export type SportHistory = {
  sport: string;
  years: number;
  level: 'Municipal' | 'Departamental' | 'Nacional' | 'Internacional';
  competition: string;
  certificate?: string;
  approved?: boolean;
}; 