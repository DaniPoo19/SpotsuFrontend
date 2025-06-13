import React from 'react';

interface DocumentsStatus {
  sportsCertificate: boolean;
  medicalCertificate: boolean;
  consentForm: boolean;
}

export const AspirantStatus = ({ documents }: { documents: DocumentsStatus }) => {
  const isComplete = documents.sportsCertificate && 
                    documents.medicalCertificate && 
                    documents.consentForm;

  return (
    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
      isComplete
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}>
      {isComplete ? 'Completo' : 'Pendiente'}
    </span>
  );
};