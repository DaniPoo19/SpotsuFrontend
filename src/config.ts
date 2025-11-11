// URL base de la API desde variables de entorno
// Desarrollo: VITE_API_URL=http://localhost:3000 + VITE_API_PREFIX=/tracksport/api/v1
// Producción: VITE_API_URL=https://api.tracksport.socratesunicordoba.co (sin prefijo)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''; // Vacío por defecto (producción)

// Solo agregar prefijo si está definido y BASE_URL no lo incluye ya
export const API_URL = API_PREFIX && !BASE_URL.includes('/api/v1') 
  ? `${BASE_URL}${API_PREFIX}` 
  : BASE_URL;

console.log('[Config] Base URL:', BASE_URL);
console.log('[Config] API Prefix:', API_PREFIX || '(ninguno)');
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