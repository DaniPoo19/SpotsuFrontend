export interface LoginCredentials {
  document_type_id: string;
  document_number: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    access_token: string;
    user: User;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Person {
  id: string;
  name: string;
  lastname: string;
  document_number: string;
  document_type: {
    id: string;
    name: string;
  };
  is_active: boolean;
}

export interface User {
  id: string;
  document_number: string;
  document_type?: string;
  name?: string;
  last_name?: string;
  role: Role;
  token?: string;
  exp?: number;
}

export interface Athlete {
  id: string;
  person_id: string;
  name: string;
  last_name: string;
  birth_date: string;
  sex_id: string;
  document_type_id: string;
  document_number: string;
  address: string;
  city: string;
  department: string;
  country: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  last_name: string;
  email: string;
  role_id: string;
} 