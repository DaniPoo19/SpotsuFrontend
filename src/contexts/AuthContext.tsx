import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LoginDTO } from '@/types/dtos';

interface User {
  id: string;
  document_number: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: ({document_type_id, document_number, password}: LoginDTO) => Promise<any>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async ({document_type_id, document_number, password}: LoginDTO) => {
    try {

      const response = await axiosInstance.post('/auth/login', {
        document_number,
        password,
        document_type_id
      });

      if (response.data?.data?.access_token) {
        const token = response.data.data.access_token;
        localStorage.setItem('token', token);

        // Decodificar el token para obtener la información del usuario
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log({tokenPayload});  
        const userData = {
          id: tokenPayload.id,
          document_number: tokenPayload.document_number,
          role: tokenPayload.role
        };

        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        toast.success('¡Inicio de sesión exitoso!');
        navigate('/dashboard');
        return userData;
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      if (error.response?.status === 401) {
        toast.error('Credenciales inválidas');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('No se pudo conectar con el servidor');
      } else {
        toast.error(error.response?.data?.message || 'Error al iniciar sesión');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const register = async (userData: any) => {
    try {
      const response = await axiosInstance.post('/people', userData);
      if (response.data) {
        toast.success('¡Registro exitoso!');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Error en los datos de registro');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('No se pudo conectar con el servidor');
      } else {
        toast.error('Error al registrar usuario');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 