import axios from 'axios';

const baseURL = 'http://localhost:3000/spotsu/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Error de respuesta del servidor
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado o inválido
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // No autorizado
          console.error('No tienes permisos para realizar esta acción');
          break;
        case 404:
          // Recurso no encontrado
          console.error('El recurso solicitado no existe');
          break;
        case 500:
          // Error del servidor
          console.error('Error interno del servidor');
          break;
        default:
          console.error('Error en la petición:', data.message || 'Error desconocido');
      }
    } else if (error.request) {
      // Error de red
      console.error('Error de conexión:', error.message);
    } else {
      // Error en la configuración de la petición
      console.error('Error en la configuración:', error.message);
    }
    
    return Promise.reject(error);
  }
); 