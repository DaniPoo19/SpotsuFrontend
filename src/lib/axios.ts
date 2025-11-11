import axios from 'axios';

// Obtener la URL base de la API desde las variables de entorno
// Soporta dos formatos:
// 1. VITE_API_URL completo: http://localhost:3000/tracksport/api/v1
// 2. VITE_API_URL + VITE_API_PREFIX: http://localhost:3000 + /tracksport/api/v1
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/tracksport/api/v1';

// Si BASE_URL ya incluye el prefijo, usarlo tal cual; sino, concatenar
const API_BASE_URL = BASE_URL.includes('/api/v1') ? BASE_URL : `${BASE_URL}${API_PREFIX}`;

console.log('[Axios Config] Base URL:', BASE_URL);
console.log('[Axios Config] API Prefix:', API_PREFIX);
console.log('[Axios Config] Using API Base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  // 1) Token de autenticación
  const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2) Gestión de Content-Type
  if (config.headers) {
    // Cuando enviamos FormData dejamos que el navegador genere la cabecera con el boundary
    if (config.data instanceof FormData) {
      // Distintas implementaciones de Axios pueden guardar la cabecera en minúsculas o mayúsculas
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    } else if (!('Content-Type' in config.headers) && !('content-type' in config.headers)) {
      // Para el resto de peticiones enviamos JSON por defecto si aún no se ha definido
      config.headers['Content-Type'] = 'application/json';
    }
  }

  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('[API Response Error]:', error);
      
      if (error.response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      if (error.response.status === 404) {
        console.error('El recurso solicitado no existe');
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('[API Request Error]:', error);
    } else {
      // Algo sucedió al configurar la petición
      console.error('[API Error]:', error);
    }
    return Promise.reject(error);
  }
); 