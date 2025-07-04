import axios from 'axios';
import { toast } from 'react-hot-toast';

// Configuración de la API
const API_CONFIG = {
  // Nueva URL base del backend desplegado
  BASE_URL: import.meta.env.VITE_API_URL || 'https://backend.spotsu.site/api',
  // Ya no necesitamos prefijo porque la base incluye /api
  API_PREFIX: ''
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
    // Añadir el prefijo solo si está definido y aún no está en la URL
    if (API_CONFIG.API_PREFIX && !config.url?.startsWith(API_CONFIG.API_PREFIX)) {
      config.url = `${API_CONFIG.API_PREFIX}${config.url}`;
    }

    // No añadir token para login o registro
    if (
      !config.url.includes('/auth/login') &&
      !config.url.includes('/auth/register')
    ) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

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