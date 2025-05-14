import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle } from 'lucide-react';
import { mockAspirants } from '../../data';
import { AspirantStatus } from '../../components/common/AspirantStatus';

export const AspirantDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const aspirant = mockAspirants.find(a => a.id === id);

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

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/dashboard/aspirants')}
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
                  <p className="text-sm text-gray-500">Estado de Documentos</p>
                  <div className="mt-1">
                    <AspirantStatus documents={aspirant.documents} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disciplinas</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {aspirant.sportsHistory.map((sport, index) => (
                      <span key={index} className="px-2 py-1 text-sm bg-[#006837]/10 text-[#006837] rounded-full">
                        {sport.sport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Historial Deportivo y Certificados</h3>
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
                  {aspirant.sportsHistory.map((history, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{history.sport}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.years}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{history.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.competition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {history.certificate && (
                          <button 
                            className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1"
                            onClick={() => console.log('Descargar certificado', history.certificate)}
                          >
                            <Download size={16} />
                            Descargar
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                          history.approved === true
                            ? 'bg-green-100 text-green-800'
                            : history.approved === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {history.approved === true
                            ? 'Aprobado'
                            : history.approved === false
                            ? 'Rechazado'
                            : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => console.log('Aprobar certificado', index)}
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800"
                            onClick={() => console.log('Desaprobar certificado', index)}
                          >
                            <XCircle size={20} />
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