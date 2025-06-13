import React from 'react';
import { DashboardStats } from './components/DashboardStats';
import { DisciplineChart } from './components/DisciplineChart';

export const DashboardPage = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Panel de Control</h2>
      <DashboardStats />
      <DisciplineChart />
    </div>
  );
};