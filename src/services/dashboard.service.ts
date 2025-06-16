import { api } from '@/lib/axios';

export interface DashboardMetrics {
  totalPostulations: number;
  completedPostulations: number;
  pendingPostulations: number;
  activeSports: number;
  sportDistribution: Array<{
    name: string;
    count: number;
    avgScore: number;
  }>;
  topAthletes: Array<{
    name: string;
    total_score: number;
    sports_score: number;
    morpho_score: number;
  }>;
}

export const dashboardService = {
  getMetrics: async (semesterId?: string): Promise<DashboardMetrics> => {
    const [postulations, sports, report] = await Promise.all([
      api.get('/postulations' + (semesterId ? `/semester/${semesterId}` : '')),
      api.get('/sports'),
      api.get('/postulations/report/' + (semesterId || 'current')),
    ]);

    const postulationData = postulations.data?.data || [];
    const sportsData = sports.data?.data || [];
    const reportData = report.data?.data || [];

    // Conteos básicos
    const totalPostulations = postulationData.length;
    const completedPostulations = postulationData.filter((p: any) => p.status === 'completed').length;

    // Distribución por deporte
    const sportCounts = new Map<string, { count: number, totalScore: number }>();
    postulationData.forEach((p: any) => {
      (p.postulation_sports || []).forEach((ps: any) => {
        const sport = ps.sport?.name;
        if (sport) {
          const current = sportCounts.get(sport) || { count: 0, totalScore: 0 };
          sportCounts.set(sport, {
            count: current.count + 1,
            totalScore: current.totalScore + (ps.score || 0)
          });
        }
      });
    });

    const sportDistribution = Array.from(sportCounts.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      avgScore: data.totalScore / data.count
    }));

    // Ordenar atletas por puntaje total
    const topAthletes = reportData
      .sort((a: any, b: any) => b.total_score - a.total_score)
      .slice(0, 5);

    return {
      totalPostulations,
      completedPostulations,
      pendingPostulations: totalPostulations - completedPostulations,
      activeSports: sportsData.filter((s: any) => s.is_active).length,
      sportDistribution,
      topAthletes
    };
  }
}; 