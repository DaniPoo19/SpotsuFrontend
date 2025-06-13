import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/spotsu/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
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