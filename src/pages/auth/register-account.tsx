import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterDTO, CreatePersonDTO } from '../../types/dtos';
import { DocumentTypeDTO } from '../../types/dtos';
import { mastersService } from '../../services/masters.service';
import { api } from '../../lib/axios';
import icono2 from '@/assets/2.png';
import { Eye, EyeOff } from 'lucide-react';

export const RegisterAccountPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterDTO>({
    document_number: '',
    password: '',
    role_id: '2', // ID del rol "usuario"
    document_type_id: ''
  });
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const types = await mastersService.getDocumentTypes();
        setDocumentTypes(types);
      } catch (error) {
        console.error('Error al cargar tipos de documento:', error);
        toast.error('Error al cargar tipos de documento');
      }
    };
    loadDocumentTypes();
  }, []);

  const validateForm = () => {
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
      // Primero registramos la persona
      const personData: CreatePersonDTO = {
        document_number: formData.document_number,
        document_type_id: formData.document_type_id,
        name: '', // Estos campos se actualizarán después
        full_name: '',
        birth_date: '',
        gender_id: '',
        address: '',
        city: '',
        department: '',
        country: '',
        email: '',
        phone: '',
        family_phone: ''
      };

      const personResponse = await api.post('/people', personData);
      
      // Luego registramos el usuario
      await register(formData);
      
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/login');
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      if (error.message?.includes('ya existe') || error.message?.includes('ya registrado')) {
        toast.error('Esta cédula ya está registrada. Por favor, inicie sesión.');
        navigate('/login');
      } else {
        setError(error.message || 'Error al registrar usuario');
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