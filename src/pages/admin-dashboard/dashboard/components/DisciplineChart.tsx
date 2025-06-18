import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const disciplineData = [
  { name: 'Natación', value: 12 },
  { name: 'Atletismo', value: 8 },
  { name: 'Fútbol', value: 15 },
  { name: 'Baloncesto', value: 10 },
];

export const DisciplineChart = () => {
  return (
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
  );
};