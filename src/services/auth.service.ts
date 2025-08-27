import axios from 'axios';
import { LoginCredentials, AuthResponse, User, Athlete } from '@/types/auth.types';
import API_ENDPOINTS from '../api/endpoints';
import { LoginDTO, LoginResponseDTO, RegisterDTO, UserDTO, PersonDTO, UserRole } from '../types/dtos';

// Configuración de axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || '/api'}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('Iniciando login con credenciales:', { ...credentials, password: '***' });
      
      const response = await api.post('/auth/login', {
        document_type_id: credentials.document_type_id,
        document_number: credentials.document_number,
        password: credentials.password
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.status === 'success' && response.data.data.access_token) {
        console.log('Token recibido, decodificando...');
        const token = response.data.data.access_token;
        this.setToken(token);
        
        // Decodificar el token para obtener la información del usuario
        const userData = this.decodeToken(token);
        console.log('Usuario decodificado:', userData);
        
        // Añadir el token y el document_type_id (si no viene en el token) al objeto de usuario
        const userWithToken = {
          ...userData,
          token: token,
          document_type: userData.document_type || credentials.document_type_id
        };
        
        this.setUserData(userWithToken);
        this.setupAxiosInterceptors();
        return userWithToken;
      }
      
      console.error('No se recibió el token de acceso en la respuesta:', response.data);
      throw new Error('No se recibió el token de acceso');
    } catch (error) {
      console.error('Error detallado en login:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error Axios:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 401) {
          throw new Error('Credenciales inválidas');
        }
      }
      throw error;
    }
  }

  async register(userData: RegisterDTO): Promise<UserDTO> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        if (error.response.data.message.includes('document_number')) {
          throw new Error('El número de documento ya está registrado');
        }
        throw new Error('Datos de registro inválidos');
      }
      throw new Error('Error al registrar usuario');
    }
  }

  async getProfile(): Promise<UserDTO> {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearToken();
        throw new Error('Sesión expirada');
      }
      throw new Error('Error al obtener perfil');
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    api.interceptors.request.eject(this.setupAxiosInterceptors());
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserData(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  async getCurrentUser(): Promise<User> {
    const userData = this.getUserData();
    if (!userData) {
      throw new Error('No hay usuario autenticado');
    }
    return userData;
  }

  async getAthleteById(athleteId: string): Promise<Athlete> {
    try {
      const response = await api.get(`/athletes/${athleteId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener atleta:', error);
      throw error;
    }
  }

  async getAthleteByDocument(documentTypeId: string, documentNumber: string): Promise<Athlete | null> {
    try {
      const response = await api.get('/athletes', {
        params: { document_type_id: documentTypeId, document_number: documentNumber }
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return payload.exp ? payload.exp * 1000 > Date.now() : false;
    } catch {
      return false;
    }
  }

  // Verificar el rol del usuario
  async checkUserRole(userId: string): Promise<UserRole> {
    return {
      id: '1',
      role: 'ATHLETE',
      user_id: userId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Obtener la ruta de redirección según el estado del usuario
  getRedirectPath(): string {
    return window.location.pathname;
  }

  // Métodos para marcar el progreso del usuario
  markParQCompleted(): void {
    // No hacer nada para permitir navegación libre
    return;
  }

  markPersonalDataCompleted(): void {
    // No hacer nada para permitir navegación libre
    return;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private setUserData(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private decodeToken(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const user: User = {
        id: payload.id,
        document_number: payload.document_number,
        document_type: payload.document_type || payload.document_type_id,
        name: payload.name || '',
        last_name: payload.last_name || payload.lastname || '',
        role: {
          id: payload.role.id,
          name: payload.role.name,
          description: payload.role.description || ''
        },
        exp: payload.exp
      } as any;
      
      return user;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      throw new Error('Token inválido');
    }
  }

  private setupAxiosInterceptors(): number {
    return api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      // En lugar de hacer una petición al servidor, validamos el token localmente
      const userDataFromToken = this.decodeToken(token);
      if (userDataFromToken.exp && userDataFromToken.exp * 1000 > Date.now()) {
        // Intentar obtener datos adicionales (como document_type) de localStorage
        const stored = localStorage.getItem(this.USER_KEY);
        let storedData: Partial<User> = {};
        if (stored) {
          try {
            storedData = JSON.parse(stored);
          } catch (err) {
            console.warn('No se pudo parsear user_data de localStorage:', err);
          }
        }
        return {
          ...userDataFromToken,
          ...storedData,
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error al validar token:', error);
      return null;
    }
  }
}

export const authService = new AuthService(); 