import React from 'react';
import { Users, FileCheck, FileWarning, Medal } from 'lucide-react';
import { mockAspirants } from '../data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
  <Card className="border-none shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-[#006837]">{value}</h3>
          <p className="text-gray-600">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#006837]">Panel de Control</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#006837]">Distribución por Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disciplineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="name" 
                  className="text-sm text-gray-600"
                  tick={{ fill: '#4B5563' }}
                />
                <YAxis 
                  className="text-sm text-gray-600"
                  tick={{ fill: '#4B5563' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: '#006837', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#006837"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};