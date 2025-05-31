import axios from 'axios';
import { toast } from 'react-hot-toast';

// Configuración de la API
const API_CONFIG = {
  // URL base sin el prefijo /spotsu/api/v1
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // Prefijo de la API
  API_PREFIX: '/spotsu/api/v1'
} as const;

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logs de peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    // Asegurarse de que la URL comience con el prefijo de la API
    if (!config.url?.startsWith(API_CONFIG.API_PREFIX)) {
      config.url = `${API_CONFIG.API_PREFIX}${config.url}`;
    }

    // No añadir token para login o registro
    if (
      !config.url.includes('/auth/login') &&
      !config.url.includes('/auth/register')
    ) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

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
    const url = `${response.config.baseURL}${response.config.url}`;
    console.log(`[API Response Success] ${response.status} ${response.config.method?.toUpperCase()} ${url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]:', error);

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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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