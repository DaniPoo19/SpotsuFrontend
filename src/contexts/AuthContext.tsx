import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { athletesService } from '../services/athletes.service';
import { User, LoginCredentials, Athlete } from '../types/auth.types';

interface AuthContextType {
  user: User | null;
  athlete: Athlete | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  checkAthleteStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAthleteStatus = useCallback(async (userData: User) => {
    if (!userData?.document_number) {
      setAthlete(null);
      return;
    }

    try {
      const athleteData = await athletesService.getAthleteByDocument(userData.document_number);
      setAthlete(athleteData);
    } catch (error) {
      console.error('Error al verificar estado del atleta:', error);
      setAthlete(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const publicPaths = ['/login', '/register'];
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const validatedUser = await authService.validateToken(token);
          
          if (validatedUser) {
            setUser(validatedUser);
            await checkAthleteStatus(validatedUser);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setUser(null);
            setAthlete(null);

            if (!publicPaths.includes(location.pathname)) {
            navigate('/login');
            }
          }
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          setUser(null);
          setAthlete(null);

          if (!publicPaths.includes(location.pathname)) {
          navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setAthlete(null);

        if (!publicPaths.includes(location.pathname)) {
        navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [navigate, checkAthleteStatus, location.pathname]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authService.login(credentials);
      
      if (response) {
        localStorage.setItem('auth_token', response.token || '');
        localStorage.setItem('user_data', JSON.stringify(response));
        
        setUser(response);
        await checkAthleteStatus(response);
        
        if (!athlete) {
          navigate('/user-dashboard/postulations/new/personal-info');
        } else {
          navigate('/user-dashboard');
        }
      }
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Cerrando sesión');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    authService.logout();
    setUser(null);
    setAthlete(null);
    navigate('/login');
  };

  const value = {
    user,
    athlete,
    isAuthenticated: !!user && !!localStorage.getItem('auth_token'),
    isLoading,
    login,
    logout,
    checkAthleteStatus: () => user ? checkAthleteStatus(user) : Promise.resolve(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 