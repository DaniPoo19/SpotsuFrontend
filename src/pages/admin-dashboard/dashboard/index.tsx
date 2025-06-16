import React, { useState, useEffect } from 'react';
import { DashboardStats } from './components/DashboardStats';
import { DisciplineChart } from './components/DisciplineChart';
import { dashboardService, type DashboardMetrics } from '@/services/dashboard.service';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await dashboardService.getMetrics();
        setMetrics(data);
      } catch (err: any) {
        console.error('Error cargando métricas:', err);
        setError(err.message || 'Error al cargar las métricas del dashboard');
        toast.error('Error al cargar las métricas del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#006837]" />
          <p className="text-gray-600">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Panel de Control</h2>
      <div className="space-y-8">
        <DashboardStats metrics={metrics} />
        <DisciplineChart metrics={metrics} />
      </div>
    </div>
  );
};