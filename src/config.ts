// URL base de la API
export const API_URL = 'http://localhost:3000/api';

// Configuración de axios
export const axiosConfig = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Configuración de autenticación
export const authConfig = {
  tokenKey: 'token',
  refreshTokenKey: 'refresh_token',
};

// Configuración de rutas
export const routes = {
  login: '/login',
  register: '/register',
  dashboard: '/user-dashboard',
  postulations: '/user-dashboard/postulations',
  profile: '/user-dashboard/profile',
  parq: '/parq',
  sportsHistory: '/sports-history',
}; 