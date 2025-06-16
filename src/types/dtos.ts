// Auth DTOs
export interface LoginDTO {
  document_type_id: string;
  document_number: string;
  password: string;
}

export interface LoginResponseDTO {
  access_token: string;
  user: {
    id: string;
    document_number: string;
    role: {
      id: string;
      name: string;
    };
  };
}

export interface RegisterDTO {
  name: string;
  lastname: string;
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
  document_number: string;
  full_name: string;
  name: string;
  birth_date: string;
  document_type_id: string;
  document_type?: string;
  gender_id: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  nationality: string;
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
export interface AthleteDTO {
  id: string;
  name: string;
  last_name?: string;
  email: string;
  document_number?: string;
  document_type?: {
    id: string;
    name: string;
  };
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  phone?: string;
  // otros campos según sea necesario
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
  birthDate?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  phone?: string;
  sportHistories?: Array<{
    id: string;
    sport: {
      id: string;
      name: string;
    };
    startDate: string;
    endDate: string | null;
    institution: string;
    achievements: string;
    status: string;
  }>;
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
  order: number;
}

export interface ParQResponseDto {
  question_id: string;
  response: boolean | null;
}

export interface ParQResponseSubmitDto {
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

export interface UserRole {
  id: string;
  role: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachedDocumentDTO {
  file: File;
  document_type_id: string;
  attached_document_type_id: string;
  reference_id: string;
  reference_type: string;
  postulation_id: string;
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

export interface CompetitionHierarchy {
  id: string;
  name: string;
  category_id: string;
  description?: string;
  competition_hierarchy?: {
    id: string;
    name: string;
  };
}

export interface Sport {
  id: string;
  name: string;
  is_active: boolean;
}

export interface CompetitionCategory {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Achievement {
  id?: string;
  achievement_type_id: string;
  competition_category_id: string;
  competition_hierarchy_id: string;
  achievement_date: string;
  description: string;
  attached_document?: File | null;
  attached_document_type_id?: string;
  competitionCategory?: string;
  competitionType?: string;
  competitionName?: string;
  date?: string;
  position?: string;
  score?: string;
}

export interface SportHistory {
  sport_id: string;
  achievements: Achievement[];
  sport?: any;
  startDate?: string;
  endDate?: string;
  institution?: string;
}

export interface FormValues {
  sportsHistory: SportHistory[];
  documents?: {
    consentForm?: File | null;
    MedicCertificate?: File | null;
  };
}

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  person_id: string | null;
  role_id: string;
}

export interface SemesterDTO {
  id: string;
  name: string;
  // ... otros campos del semestre
}

export interface PostulationDTO {
  id: string;
  athlete_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  par_q_completed: boolean;
  sports_history_completed: boolean;
  created_at: string;
  updated_at: string;
  athlete?: {
    id: string;
    name?: string;
    last_name?: string;
    document_number?: string;
    // otros campos según necesidad
  };
  semester?: {
    id: string;
    name?: string;
  };
  personal_info_completed?: boolean;
  documents_completed?: boolean;
  postulation_sports?: Array<{
    sport?: {
      id: string;
      name: string;
    };
    experience_years?: number;
    postulation_sport_achievements?: Array<{
      sports_achievement?: {
        id: string;
        name?: string;
        competition_hierarchy?: {
          id: string;
          name: string;
        };
      };
      certificate_url?: string;
      status?: string;
    }>;
  }>;
}

export interface ParQResponseDTO {
  id: string;
  postulation_id: string;
  question_id: string;
  response: boolean;
  created_at?: Date;
  updated_at?: Date;
} 