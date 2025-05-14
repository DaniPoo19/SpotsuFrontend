import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Download, Check, X } from 'lucide-react';
import { mockAspirants } from '../data';
import type { Aspirant } from '../types';
import { useNavigate } from 'react-router-dom';

export const AspirantDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [aspirant, setAspirant] = useState<Aspirant | undefined>(
    mockAspirants.find(a => a.id === id)
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);
  const [selectedSportIndex, setSelectedSportIndex] = useState<number | null>(null);
  const [downloadedCertificates, setDownloadedCertificates] = useState<Set<number>>(new Set());

  if (!aspirant) {
    return (
      <div className="p-8">
        <p>Aspirante no encontrado</p>
        <button
          onClick={() => navigate('/dashboard/aspirants')}
          className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
      </div>
    );
  }

  const handleDownloadCertificate = (sportIndex: number) => {
    console.log('Descargar certificado', aspirant.sportsHistory[sportIndex].certificate);
    setDownloadedCertificates(prev => new Set([...prev, sportIndex]));
  };

  const handleApproveCertificate = (sportIndex: number) => {
    if (!downloadedCertificates.has(sportIndex)) {
      alert('Debe descargar el certificado antes de aprobarlo');
      return;
    }
    setSelectedAction('approve');
    setSelectedSportIndex(sportIndex);
    setShowConfirmModal(true);
  };

  const handleRejectCertificate = (sportIndex: number) => {
    if (!downloadedCertificates.has(sportIndex)) {
      alert('Debe descargar el certificado antes de rechazarlo');
      return;
    }
    setSelectedAction('reject');
    setSelectedSportIndex(sportIndex);
    setShowConfirmModal(true);
  };

  const confirmAction = () => {
    if (selectedSportIndex === null || !selectedAction) return;

    setAspirant(prev => {
      if (!prev) return prev;
      const updatedHistory = [...prev.sportsHistory];
      updatedHistory[selectedSportIndex] = {
        ...updatedHistory[selectedSportIndex],
        approved: selectedAction === 'approve'
      };
      return {
        ...prev,
        sportsHistory: updatedHistory
      };
    });

    setShowConfirmModal(false);
    setSelectedAction(null);
    setSelectedSportIndex(null);
  };

  // Agrupar deportes por nombre para asegurar que no haya duplicados
  const uniqueSports = aspirant.sportsHistory.reduce((acc, sport) => {
    if (!acc[sport.sport]) {
      acc[sport.sport] = sport;
    }
    return acc;
  }, {} as Record<string, typeof aspirant.sportsHistory[0]>);

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/dashboard/aspirants')}
        className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a la lista
      </button>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {selectedAction === 'approve' ? 'Aprobar Certificado' : 'Rechazar Certificado'}
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea {selectedAction === 'approve' ? 'aprobar' : 'rechazar'} este certificado?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedAction === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {selectedAction === 'approve' ? 'Aprobar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-sm text-gray-500">Disciplinas</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.values(uniqueSports).map((sport, index) => (
                      <span key={index} className="px-2 py-1 text-sm bg-[#006837]/10 text-[#006837] rounded-full">
                        {sport.sport}
                      </span>
                    ))}
                  </div>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.values(uniqueSports).map((sport, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{sport.sport}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{sport.years}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{sport.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{sport.competition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sport.certificate && (
                          <button 
                            className={`text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1 ${
                              downloadedCertificates.has(index) ? 'opacity-50 cursor-default' : ''
                            }`}
                            onClick={() => handleDownloadCertificate(index)}
                            disabled={downloadedCertificates.has(index)}
                          >
                            <Download size={16} />
                            {downloadedCertificates.has(index) ? 'Descargado' : 'Descargar'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sport.approved === undefined ? (
                          <span className="px-2 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                            Pendiente
                          </span>
                        ) : sport.approved ? (
                          <span className="px-2 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                            Aprobado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                            Rechazado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveCertificate(index)}
                            className={`p-1 text-green-600 hover:text-green-700 transition-colors ${
                              !downloadedCertificates.has(index) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Aprobar certificado"
                            disabled={!downloadedCertificates.has(index)}
                          >
                            <Check size={20} />
                          </button>
                          <button
                            onClick={() => handleRejectCertificate(index)}
                            className={`p-1 text-red-600 hover:text-red-700 transition-colors ${
                              !downloadedCertificates.has(index) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Rechazar certificado"
                            disabled={!downloadedCertificates.has(index)}
                          >
                            <X size={20} />
                          </button>
                        </div>
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