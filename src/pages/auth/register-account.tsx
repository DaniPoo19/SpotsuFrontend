import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentTypeDTO } from '../../types/dtos';
import { mastersService } from '../../services/masters.service';
import axiosInstance from '../../api/axios';
import icono2 from '@/assets/2.png';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterDTO {
  name: string;
  lastname: string;
  document_number: string;
  password: string;
  role_id: string;
  document_type_id: string;
}

export const RegisterAccountPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterDTO>({
    name: '',
    lastname: '',
    document_number: '',
    password: '',
    role_id: '',
    document_type_id: ''
  });
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar tipos de documento
        const types = await mastersService.getDocumentTypes();
        setDocumentTypes(types);

        // Obtener el rol de ATHLETE
        const rolesResponse = await axiosInstance.get('/auth/roles');
        if (rolesResponse.data?.data) {
          const athleteRole = rolesResponse.data.data.find((role: any) => 
            role.name.toUpperCase() === 'ATHLETE'
          );
          if (athleteRole) {
            setFormData(prev => ({ ...prev, role_id: athleteRole.id }));
          } else {
            toast.error('No se pudo encontrar el rol de atleta. Por favor, contacte al administrador.');
          }
        }
      } catch (error: any) {
        console.error('Error al cargar datos iniciales:', error);
        if (error.response?.status === 404) {
          toast.error('El servicio no está disponible');
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('No se pudo conectar con el servidor. Por favor, verifique que el servidor esté en ejecución.');
        } else {
          toast.error('Error al cargar datos iniciales');
        }
      }
    };
    loadInitialData();
  }, []);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Por favor ingrese su nombre');
      return false;
    }

    if (!formData.lastname.trim()) {
      setError('Por favor ingrese su apellido');
      return false;
    }

    if (!formData.document_type_id) {
      setError('Por favor seleccione un tipo de documento');
      return false;
    }

    if (!formData.document_number.trim()) {
      setError('Por favor ingrese su número de documento');
      return false;
    }

    if (!/^\d+$/.test(formData.document_number)) {
      setError('El número de documento debe contener solo números');
      return false;
    }

    if (!formData.role_id) {
      setError('No se pudo asignar el rol de atleta. Por favor, intente más tarde.');
      return false;
    }

    if (!formData.password) {
      setError('Por favor ingrese una contraseña');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, verifique e intente nuevamente.');
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Limpiar error al cambiar el campo
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Crear la persona y el usuario en una sola llamada
      const response = await axiosInstance.post('/people', {
        name: formData.name,
        lastname: formData.lastname,
        document_number: formData.document_number,
        document_type_id: formData.document_type_id,
        password: formData.password,
        role_id: formData.role_id
      });

      if (response.data) {
        toast.success('¡Cuenta creada exitosamente!');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('No se pudo conectar con el servidor. Por favor, verifique que el servidor esté en ejecución.');
      } else if (error.response?.status === 404) {
        toast.error('El servicio de registro no está disponible. Por favor, intente más tarde.');
      } else if (error.response?.data?.message?.includes('ya existe') || 
                error.response?.data?.message?.includes('ya registrado')) {
        toast.error('Esta cédula ya está registrada. Por favor, inicie sesión.');
        navigate('/login');
      } else if (error.response?.data?.message?.includes('tipo de documento')) {
        toast.error('El tipo de documento seleccionado no es válido');
      } else if (error.response?.data?.message?.includes('rol')) {
        toast.error('El rol seleccionado no es válido');
      } else {
        setError(error.response?.data?.message || 'Error al registrar usuario');
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
              Crear Cuenta
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600"
            >
              Complete sus datos para crear su cuenta
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
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                  placeholder="Ingrese su nombre"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                  placeholder="Ingrese su apellido"
                  required
                  disabled={loading}
                />
              </div>

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
                  <option value="">Seleccione un tipo</option>
                  {documentTypes.map((type) => (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all pr-10"
                    placeholder="Confirme su contraseña"
                    required
                    disabled={loading}
                  />
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
                  'Crear Cuenta'
                )}
              </motion.button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-[#006837] hover:text-[#005828] font-medium"
                  >
                    Inicia sesión aquí
                  </motion.button>
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}; 