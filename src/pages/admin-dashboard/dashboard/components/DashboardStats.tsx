import React from 'react';
import { Users, FileCheck, FileWarning, Medal } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import type { DashboardMetrics } from '@/services/dashboard.service';

interface DashboardStatsProps {
  metrics: DashboardMetrics;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={Users}
        label="Total Postulaciones"
        value={metrics.totalPostulations}
        color="bg-[#006837]"
      />
      <StatCard
        icon={FileCheck}
        label="Postulaciones Completas"
        value={metrics.completedPostulations}
        color="bg-[#A8D08D]"
      />
      <StatCard
        icon={FileWarning}
        label="Postulaciones Pendientes"
        value={metrics.pendingPostulations}
        color="bg-[#E52421]"
      />
      <StatCard
        icon={Medal}
        label="Deportes Activos"
        value={metrics.activeSports}
        color="bg-[#006837]"
      />
    </div>
  );
};