import React from 'react';
import { AspirantsList } from './components/AspirantsList';

export const AspirantsPage = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Lista de Aspirantes</h2>
      <AspirantsList />
    </div>
  );
};