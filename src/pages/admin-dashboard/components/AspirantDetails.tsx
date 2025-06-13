import React from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { mockAspirants } from '../data';
import type { Aspirant } from '../types';

export const AspirantDetails = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const aspirant = mockAspirants.find(a => a.id === id);

  if (!aspirant) {
    return (
      <div className="p-8">
        <p>Aspirante no encontrado</p>
        <button
          onClick={onBack}
          className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a la lista
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">{aspirant.name}</h2>
          <p className="text-gray-500">{aspirant.personalInfo.email}</p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Identificación</p>
                  <p className="font-medium">{aspirant.personalInfo.idType} {aspirant.personalInfo.idNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                  <p className="font-medium">{aspirant.personalInfo.birthDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{aspirant.personalInfo.address}</p>
                  <p className="font-medium">{aspirant.personalInfo.city}, {aspirant.personalInfo.state}</p>
                  <p className="font-medium">{aspirant.personalInfo.country}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contacto</p>
                  <p className="font-medium">Tel: {aspirant.personalInfo.phone}</p>
                  <p className="font-medium">Emergencia: {aspirant.personalInfo.emergencyPhone}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-4">Información Deportiva</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Disciplina Principal</p>
                  <p className="font-medium">{aspirant.discipline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nivel</p>
                  <p className="font-medium capitalize">{aspirant.level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de Documentos</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      aspirant.documents.sportsCertificate 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Certificado Deportivo
                    </span>
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      aspirant.documents.medicalCertificate
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Certificado Médico
                    </span>
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      aspirant.documents.consentForm
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Consentimiento
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Historial Deportivo</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Deporte</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Años</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Nivel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Competencia</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Certificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aspirant.sportsHistory.map((history, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{history.sport}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.years}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.competition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {history.certificate && (
                          <button className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1">
                            <Download size={16} />
                            Descargar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};