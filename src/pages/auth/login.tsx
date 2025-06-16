import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDTO, DocumentTypeDTO, ApiResponse } from '../../types/dtos';
import icono2 from '@/assets/2.png';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../../api/axios';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginDTO>({
    document_type_id: '',
    document_number: '',
    password: ''
  });
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const response = await axiosInstance.get<ApiResponse<DocumentTypeDTO[]>>('/document-types');
        if (response.data?.data) {
          setDocumentTypes(response.data.data);
        }
      } catch (error) {
        console.error('Error al cargar tipos de documento:', error);
        toast.error('Error al cargar tipos de documento');
      }
    };

    fetchDocumentTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Iniciando proceso de login en la página...');
      const user = await login(formData);
      console.log('Login exitoso, usuario:', user);

      // Guardar el token y los datos del usuario
      if (user.token) {
        console.log('Guardando token y datos del usuario...');
        localStorage.setItem('auth_token', user.token);
        localStorage.setItem('user_data', JSON.stringify(user));
      } else {
        console.error('No se recibió token en la respuesta del login');
        throw new Error('Error en la autenticación');
      }

      // Redirigir según el rol
      switch (user.role.name) {
        case 'ATHLETE':
          console.log('Redirigiendo a dashboard de atleta...');
          navigate('/user-dashboard');
          break;
        case 'PROFESSIONAL':
        case 'ADMIN':
          console.log('Redirigiendo a dashboard de profesional/admin...');
          navigate('/dashboard/home');
          break;
        default:
          console.log('Rol no reconocido:', user.role.name);
          setError('Rol de usuario no válido');
      }
    } catch (error: any) {
      console.error('Error en login de la página:', error);
      if (error.response?.status === 401) {
        setError('Credenciales inválidas');
      } else if (error.response?.status === 404) {
        setError('Usuario no registrado');
        // Redirigir al registro después de 2 segundos
        setTimeout(() => {
          console.log('Redirigiendo a registro...');
          navigate('/register');
        }, 2000);
      } else {
        setError('Error al iniciar sesión. Por favor, intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.img
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              src={icono2}
              alt="Universidad de Córdoba"
              className="h-24 mx-auto mb-4"
            />
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-[#006837]"
            >
              SPOSTU
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600"
            >
              Sistema de gestión deportiva universitaria
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  name="document_type_id"
                  value={formData.document_type_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione un tipo de documento</option>
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento
                </label>
                <input
                  type="text"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                  placeholder="Ingrese su número de documento"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all pr-10"
                    placeholder="Ingrese su contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[#006837] text-white py-3 px-4 rounded-xl hover:bg-[#005828] transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Iniciar Sesión'
                )}
              </motion.button>

              <div className="text-center mt-4">
                <p className="text-gray-600">
                  ¿No tienes una cuenta?{' '}
                  <Link
                    to="/register"
                    className="text-[#006837] hover:text-[#005828] font-medium transition-colors"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};