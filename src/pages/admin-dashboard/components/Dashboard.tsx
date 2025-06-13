import React from 'react';
import { Users, FileCheck, FileWarning, Medal } from 'lucide-react';
import { mockAspirants } from '../data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="text-3xl font-bold">{value}</h3>
        <p className="text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

const disciplineData = [
  { name: 'Natación', value: 12 },
  { name: 'Atletismo', value: 8 },
  { name: 'Fútbol', value: 15 },
  { name: 'Baloncesto', value: 10 },
];

export const Dashboard = () => {
  const totalAspirants = mockAspirants.length;
  const completeDocuments = mockAspirants.filter(
    a => a.documents.sportsCertificate && a.documents.medicalCertificate && a.documents.consentForm
  ).length;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Panel de Control</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Aspirantes"
          value={totalAspirants}
          color="bg-[#006837]"
        />
        <StatCard
          icon={FileCheck}
          label="Documentos Completos"
          value={completeDocuments}
          color="bg-[#A8D08D]"
        />
        <StatCard
          icon={FileWarning}
          label="Documentos Pendientes"
          value={totalAspirants - completeDocuments}
          color="bg-[#E52421]"
        />
        <StatCard
          icon={Medal}
          label="Disciplinas Activas"
          value={4}
          color="bg-[#006837]"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">Distribución por Disciplina</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={disciplineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#006837" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};