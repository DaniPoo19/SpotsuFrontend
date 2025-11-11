import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

// Obtener la URL base de la API desde las variables de entorno
// Desarrollo: VITE_API_URL=http://localhost:3000 + VITE_API_PREFIX=/tracksport/api/v1
// Producción: VITE_API_URL=https://api.tracksport.socratesunicordoba.co (sin prefijo)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''; // Vacío por defecto (producción)

// Solo agregar prefijo si está definido y BASE_URL no lo incluye ya
const baseURL = API_PREFIX && !BASE_URL.includes('/api/v1') 
  ? `${BASE_URL}${API_PREFIX}` 
  : BASE_URL;

console.log('[API Lib] Base URL:', BASE_URL);
console.log('[API Lib] API Prefix:', API_PREFIX || '(ninguno)');
console.log('[API Lib] Using API Base URL:', baseURL);

export const api = axios.create({
  baseURL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  }
); 