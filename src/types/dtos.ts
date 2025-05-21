// Auth DTOs
export interface LoginDTO {
  document_number: string;
  password: string;
}

export interface LoginResponseDTO {
  access_token: string;
}

export interface RegisterDTO {
  document_number: string;
  password: string;
  role_id: string;
  document_type_id: string;
}

export interface UserDTO {
  id: string;
  document_number: string;
  role: {
    id: string;
    name: string;
  };
}

// Person DTOs
export interface PersonDTO {
  id: string;
  name: string;
  full_name: string;
  birth_date: string;
  document_type_id: string;
  document_number: string;
  gender_id: string;
  address: string;
  city: string;
  department: string;
  country: string;
  email: string;
  phone: string;
  family_phone: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonDTO {
  name: string;
  full_name: string;
  birth_date: string;
  document_type_id: string;
  document_number: string;
  gender_id: string;
  address: string;
  city: string;
  department: string;
  country: string;
  email: string;
  phone: string;
  family_phone: string;
}

// Athlete DTOs
export interface AthleteDTO extends PersonDTO {
  // Campos adicionales específicos de atletas, si los hay
}

export interface CreateAthleteDTO extends CreatePersonDTO {
  // Campos adicionales específicos para crear atletas, si los hay
}

// Sports DTOs
export interface SportDTO {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSportDTO {
  name: string;
  description: string;
}

// Sport History DTOs
export interface SportHistoryDTO {
  id: string;
  athlete_id: string;
  sport_id: string;
  start_date: string;
  end_date: string | null;
  institution: string;
  achievements: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSportHistoryDTO {
  sport_id: string;
  start_date: string;
  end_date: string;
  institution: string;
  achievements: string;
  postulation_id: string;
  athlete_id: string;
}

// Document Type DTOs
export interface DocumentTypeDTO {
  id: string;
  name: string;
}

// Gender DTOs
export interface GenderDTO {
  id: string;
  name: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface AspirantDTO {
  id: string;
  name: string;
  email: string;
  documentType: string;
  documentNumber: string;
  discipline: string | null;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  qualification: number | null;
  fileStatus: 'Pendiente' | 'Completo' | 'Incompleto';
  documents: {
    sportsCertificate: boolean;
    medicalCertificate: boolean;
    consentForm: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAspirantDTO {
  name: string;
  email: string;
  documentType: string;
  documentNumber: string;
}

export interface UpdateAspirantDTO {
  name?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  discipline?: string;
  status?: 'Pendiente' | 'Aprobado' | 'Rechazado';
  qualification?: number;
}

export interface ParQQuestion {
  id: string;
  question: string;
  description?: string;
}

export interface ParQResponseDto {
  postulation_id: string;
  question_id: string;
  response: boolean;
}

export interface ParQResponse {
  id: string;
  postulation_id: string;
  question_id: string;
  response: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParQResponseResult {
  passed: boolean;
  message: string;
  requiresMedicalClearance: boolean;
}

// Sports Competition Categories DTOs
export interface SportsCompetitionCategoryDTO {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Competition Hierarchy DTOs
export interface CompetitionHierarchyDTO {
  id: string;
  name: string;
  description: string;
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Attached Document DTOs
export interface AttachedDocumentDTO {
  id: string;
  document_type_id: string;
  reference_id: string;
  reference_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachedDocumentDTO {
  file: File;
  document_type_id: string;
  reference_id: string;
  reference_type: string;
}

export interface SportsAchievementDTO {
  id: string;
  sport_history_id: string;
  competition_category_id: string;
  competition_hierarchy_id: string;
  name: string;
  description: string;
  date: string;
  position: string;
  score: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSportsAchievementDTO {
  sport_history_id: string;
  competition_category_id: string;
  competition_hierarchy_id: string;
  name: string;
  description: string;
  date: string;
  position: string;
  score: string;
  postulation_id: string;
  achievement_type_id: string;
}

export interface CreateUserDTO {
  document_number: string;
  password: string;
  role_id: string;
}

export interface UserRole {
  id: string;
  role: 'ADMIN' | 'ATHLETE';
  name: string;
  email: string;
} 