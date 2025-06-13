import axios from 'axios';

// Configuración base de la API
export const api = axios.create({
  baseURL: 'http://localhost:3000/spotsu/api/v1',
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