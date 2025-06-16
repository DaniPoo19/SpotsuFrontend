import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/spotsu/api/v1',
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