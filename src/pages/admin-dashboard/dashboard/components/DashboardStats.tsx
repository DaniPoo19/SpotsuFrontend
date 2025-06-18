import React from 'react';
import { Users, FileCheck, FileWarning, Medal } from 'lucide-react';
import { mockAspirants } from '../../data';
import { StatCard } from '../../components/common/StatCard';
import { Aspirant } from '@/types';

export const DashboardStats = () => {
  const totalAspirants = mockAspirants.length;
  const completeDocuments = mockAspirants.filter(
    (a: Aspirant) => a.documents.sportsCertificate && a.documents.medicalCertificate && a.documents.consentForm
  ).length;

  return (
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
  );
};