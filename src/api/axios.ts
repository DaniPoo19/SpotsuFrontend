import axios from 'axios';
import { toast } from 'react-hot-toast';

// Obtener la URL base de la API desde las variables de entorno
// Desarrollo: VITE_API_URL=http://localhost:3000 + VITE_API_PREFIX=/tracksport/api/v1
// Producción: VITE_API_URL=https://api.tracksport.socratesunicordoba.co (sin prefijo)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''; // Vacío por defecto (producción)

// Solo agregar prefijo si está definido y BASE_URL no lo incluye ya
const API_BASE_URL = API_PREFIX && !BASE_URL.includes('/api/v1') 
  ? `${BASE_URL}${API_PREFIX}` 
  : BASE_URL;

console.log('[Axios Instance] Base URL:', BASE_URL);
console.log('[Axios Instance] API Prefix:', API_PREFIX || '(ninguno)');
console.log('[Axios Instance] Using API Base URL:', API_BASE_URL);

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },





});

// Interceptor para logs de peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    // No añadir token para login o registro
    const urlPath = config.url || '';
    if (
      !urlPath.includes('/auth/login') &&
      !urlPath.includes('/auth/register')
    ) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.log('[Axios Request]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
    });

    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de red
    if (error.code === 'ERR_NETWORK') {
      toast.error('No se pudo conectar con el servidor. Verifique que el servidor esté en ejecución.');
      return Promise.reject(error);
    }

    // Manejar timeout
    if (error.code === 'ECONNABORTED') {
      toast.error('La conexión con el servidor tardó demasiado. Por favor, intente nuevamente.');
      return Promise.reject(error);
    }
    
    if (error.response) {
      // El servidor respondió con un error
      const { status, data } = error.response;
      let errorMessage = data?.message || 'Error en la solicitud al servidor';
      
      if (Array.isArray(data?.message)) {
        errorMessage = data.message.join(', ');
      }

      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      
      toast.error(errorMessage);
    } else if (error.request) {
      toast.error('No se pudo establecer conexión con el servidor. Verifique su conexión a internet.');
    } else {
      toast.error(`Error en la solicitud: ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

// Función para verificar la conexión con el servidor
export const checkServerConnection = async () => {
  try {
    const response = await axiosInstance.get('/genders');
    return response.status === 200;
  } catch (error: any) {
    if (error.response) {
      // Si recibimos una respuesta del servidor, consideramos que está conectado
      return true;
    }
    return false;
  }
};

export default axiosInstance; 