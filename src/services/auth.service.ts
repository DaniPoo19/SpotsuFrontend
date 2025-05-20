import axiosInstance from '../api/axios';
import API_ENDPOINTS from '../api/endpoints';
import { LoginDTO, LoginResponseDTO, RegisterDTO, UserDTO } from '../types/dtos';

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  async login(credentials: LoginDTO): Promise<LoginResponseDTO> {
    try {
      const response = await axiosInstance.post<{ data: LoginResponseDTO }>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      const { access_token, user } = response.data.data;
      this.setToken(access_token);
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
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
    return !!this.getToken();
  }
}

export const authService = new AuthService(); 