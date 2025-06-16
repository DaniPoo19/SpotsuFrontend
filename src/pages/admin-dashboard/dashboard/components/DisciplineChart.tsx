import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardMetrics } from '@/services/dashboard.service';

interface DisciplineChartProps {
  metrics: DashboardMetrics;
}

export const DisciplineChart: React.FC<DisciplineChartProps> = ({ metrics }) => {
  const chartData = metrics.sportDistribution.map(sport => ({
    name: sport.name,
    postulantes: sport.count,
    promedio: parseFloat(sport.avgScore.toFixed(2))
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">Distribución por Deporte</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="postulantes" name="Postulantes" fill="#006837" />
              <Bar yAxisId="right" dataKey="promedio" name="Promedio" fill="#A8D08D" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">Top 5 Atletas</h3>
        <div className="space-y-4">
          {metrics.topAthletes.map((athlete, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#006837] text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{athlete.name}</h4>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Deportivo: {athlete.sports_score.toFixed(1)}</span>
                  <span>Morfo: {athlete.morpho_score.toFixed(1)}</span>
                  <span className="font-semibold">Total: {athlete.total_score.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};