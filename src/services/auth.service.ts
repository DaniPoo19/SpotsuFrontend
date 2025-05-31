import axiosInstance from '../api/axios';
import API_ENDPOINTS from '../api/endpoints';
import { LoginDTO, LoginResponseDTO, RegisterDTO, UserDTO, PersonDTO, UserRole } from '../types/dtos';
import { api } from '../lib/axios';

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_DATA_KEY = 'user_data';

  async login(credentials: LoginDTO): Promise<LoginResponseDTO> {
    try {
      const response = await axiosInstance.post<{ data: LoginResponseDTO }>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          document_number: credentials.document_number,
          password: credentials.password,
          document_type_id: credentials.document_type_id
        }
      );
      
      const { access_token, user } = response.data.data;
      this.setToken(access_token);
      
      // Obtener datos del usuario después del login
      const userData = await this.getProfile();
      this.setUserData(userData);
      
      return { access_token, user };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas');
      }
      throw new Error('Error al iniciar sesión');
    }
  }

  async register(userData: RegisterDTO): Promise<UserDTO> {
    try {
      const response = await axiosInstance.post<{ data: UserDTO }>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData
      );
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
      const response = await axiosInstance.get<{ data: UserDTO }>(
        API_ENDPOINTS.AUTH.PROFILE
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearToken();
        throw new Error('Sesión expirada');
      }
      throw new Error('Error al obtener perfil');
    }
  }

  async logout(): Promise<void> {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      this.clearToken();
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem('completed_par_q');
      localStorage.removeItem('completed_personal_data');
    }

  }

  getToken(): string | null {
    return 'test-token';
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return true;
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

  private setUserData(userData: UserDTO): void {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  getUserData(): UserDTO | null {
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    if (!userData) return null;
    return JSON.parse(userData);
  }
}

export const authService = new AuthService(); 