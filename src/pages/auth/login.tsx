import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [error, setError] = useState('');

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call to check role
    setTimeout(() => {
      const isAdminUser = documentNumber.endsWith('123');
      setIsAdmin(isAdminUser);
      setShowTokenInput(!isAdminUser);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isAdmin) {
        // Validar contraseña para admin
        if (password === 'admin123') {
          const success = await login('admin@spostu.com', 'admin123');
          if (success) {
            navigate('/dashboard/home');
          }
        } else {
          setError('Contraseña incorrecta');
        }
      } else {
        // Validar token para usuario
        if (token === 'user123') {
          navigate('/register');
        } else {
          setError('Token incorrecto');
        }
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/9/9e/Escudo_Universidad_de_C%C3%B3rdoba.png"
              alt="Universidad de Córdoba"
              className="h-24 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-[#006837]">SPOSTU</h2>
            <p className="text-gray-600">Sistema de gestión deportiva universitaria</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <form onSubmit={isAdmin || showTokenInput ? handleLogin : handleDocumentSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de documento
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                >
                  <option value="">Seleccionar...</option>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                  placeholder="Ingrese su número de documento"
                  required
                  disabled={isLoading}
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    placeholder="Ingrese su contraseña"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {showTokenInput && !isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token de Acceso
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    placeholder="Ingrese su token de acceso"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-[#006837] text-white py-3 px-4 rounded-xl hover:bg-[#005828] transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isAdmin ? (
                  'Iniciar Sesión'
                ) : showTokenInput ? (
                  'Validar Token'
                ) : (
                  'Continuar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};