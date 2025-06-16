import React from 'react';

interface DocumentsStatus {
  sportsCertificate: boolean;
  medicalCertificate: boolean;
  consentForm: boolean;
}

interface AspirantStatusProps {
  documents: DocumentsStatus;
  status?: string;
}

export const AspirantStatus = ({ documents, status = 'Pendiente' }: AspirantStatusProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'en revisión':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};