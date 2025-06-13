import React from 'react';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Obtiene la abreviatura de un tipo de documento a partir de su nombre completo.
 * Por ejemplo: "Cédula de ciudadanía" -> "CC", "Tarjeta de identidad" -> "TI".
 */
const getDocumentAbbrev = (docName?: string) => {
  if (!docName) return '';
  const lower = docName.toLowerCase();
  if (lower.includes('tarjeta') && lower.includes('identidad')) return 'TI';
  if ((lower.includes('cédula') || lower.includes('cedula')) && lower.includes('ciudad')) return 'CC';
  return docName;
};

export const UserInfoBanner: React.FC = () => {
  const { user, athlete } = useAuth();

  // Primera letra para el avatar
  const avatarLetter =
    athlete?.name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'U';

  // Nombre que se mostrará (prioriza los datos del atleta si existen)
  const fullName = athlete
    ? `${athlete.name || ''} ${athlete.last_name || ''}`.trim()
    : `${user?.name || ''} ${user?.last_name || ''}`.trim() || 'Usuario';

  // Tipo y número de documento
  const documentName = (athlete as any)?.document_type?.name as string | undefined;
  const documentAbbrev = getDocumentAbbrev(documentName);
  const documentNumber = athlete?.document_number || user?.document_number || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 mb-8"
    >
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006837] to-[#00a65a] flex items-center justify-center text-white text-2xl font-bold">
            {avatarLetter}
          </div>
        </div>

        {/* Nombre y documento */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-900">{fullName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Documento:</span>
            <span className="font-medium text-gray-700">
              {documentNumber ? `${documentAbbrev ? `${documentAbbrev} ` : ''}${documentNumber}` : 'No disponible'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 