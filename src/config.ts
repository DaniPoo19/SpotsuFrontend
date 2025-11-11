// URL base de la API desde variables de entorno
// Soporta dos formatos:
// 1. VITE_API_URL completo: http://localhost:3000/tracksport/api/v1
// 2. VITE_API_URL + VITE_API_PREFIX: http://localhost:3000 + /tracksport/api/v1
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/tracksport/api/v1';

// Si BASE_URL ya incluye el prefijo, usarlo tal cual; sino, concatenar
export const API_URL = BASE_URL.includes('/api/v1') ? BASE_URL : `${BASE_URL}${API_PREFIX}`;

console.log('[Config] Base URL:', BASE_URL);
console.log('[Config] API Prefix:', API_PREFIX);
console.log('[Config] API URL configured as:', API_URL);

// Configuración de axios
export const axiosConfig = {
  baseURL: API_URL,
  timeout: 30000, // 30 segundos
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