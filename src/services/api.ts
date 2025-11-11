import axios from 'axios';

// Obtener la URL base de la API desde las variables de entorno
// Soporta dos formatos:
// 1. VITE_API_URL completo: http://localhost:3000/tracksport/api/v1
// 2. VITE_API_URL + VITE_API_PREFIX: http://localhost:3000 + /tracksport/api/v1
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/tracksport/api/v1';

// Si BASE_URL ya incluye el prefijo, usarlo tal cual; sino, concatenar
const API_BASE_URL = BASE_URL.includes('/api/v1') ? BASE_URL : `${BASE_URL}${API_PREFIX}`;

console.log('[Services API] Base URL:', BASE_URL);
console.log('[Services API] API Prefix:', API_PREFIX);
console.log('[Services API] Using API Base URL:', API_BASE_URL);

// Configuración base de la API
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    // Log detallado del error
    console.error('[API] Error de respuesta:', {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      data: response?.data
    });

    // Manejo de error de red
    if (error.code === 'ERR_NETWORK') {
      console.error('[API] Error de conexión');
      throw new Error('No se pudo conectar con el servidor. Por favor, verifique su conexión.');
    }

    // Manejo específico para 401 (token inválido o expirado)
    if (response?.status === 401) {
      console.warn('[API] 401 no autorizado en:', config?.url);
      // Solo redirigimos automáticamente si la solicitud era de verificación de sesión
      const authEndpoints = ['/auth/verify', '/auth/me', '/login'];
      const shouldRedirect = authEndpoints.some((ep) => config?.url?.includes(ep));

      if (shouldRedirect) {
        console.warn('[API] Token inválido o expirado. Limpiando sesión y redirigiendo al login');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
); 