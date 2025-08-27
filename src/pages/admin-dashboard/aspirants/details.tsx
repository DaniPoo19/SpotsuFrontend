import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Ruler, 
  CheckCircle, 
  XCircle,
  FileText,
  ClipboardCheck,
  Stethoscope,
  Medal,
  Trophy,
} from 'lucide-react';
import { mockAspirants } from '../data';
import { aspirantsService } from '@/services/aspirants.service';
import { AspirantDTO } from '@/types/dtos';
import { AspirantStatus } from '../components/common/AspirantStatus';
import { Aspirant } from '@/types';
import { morphologicalService, MorphologicalVariable, MorphologicalVariablesWeight, VariableResultPayload } from '@/services/morphological.service';
import { athletesService } from '@/services/athletes.service';
import { postulationService } from '@/services/postulation.service';
import { attachedDocumentsService } from '@/services/attached-documents.service';
import { api } from '@/lib/axios';
import { sportsService } from '@/services/sports.service';



export const AspirantDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aspirant, setAspirant] = useState<Aspirant | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Variables morfológicas y pesos (nuevo enfoque simplificado)
  const [morphologicalVariables, setMorphologicalVariables] = useState<MorphologicalVariable[]>([]);
  const [weights, setWeights] = useState<MorphologicalVariablesWeight[]>([]);
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [isMeasurementsReady, setIsMeasurementsReady] = useState<boolean>(false);
  const [isMorphoLoaded, setIsMorphoLoaded] = useState<boolean>(false);



  const [attachedDocs, setAttachedDocs] = useState<{
    medicalCertificate?: { id: string; path: string; };
    consentForm?: { id: string; path: string; };
  }>({});
  // Eliminado resultsLoaded; se carga bajo demanda al abrir modal
  // Postulación activa cargada para el atleta
  const [activePostulation, setActivePostulation] = useState<any | null>(null);

  // Estado para saber si ya existen medidas y evitar parpadeos en botón
  const [hasMeasures, setHasMeasures] = useState<boolean | null>(null);
  const [hasAllMeasures, setHasAllMeasures] = useState<boolean>(false);

  // Historial deportivo cargado de la postulación
  interface SportHistoryItem {
    sport: string;
    years: number;
    level: string;
    competition: string;
    certificate?: string;
    approved?: boolean;
    id?: string;
    status?: string;
  }

  const [sportsHistory, setSportsHistory] = useState<SportHistoryItem[]>([]);

  // Estado para actualizar logro individual
  const [updatingAchievement, setUpdatingAchievement] = useState<string | null>(null);

  // Puntajes calculados en backend
  const [sportsScore, setSportsScore] = useState<number | null>(null);
  const [morphoScore, setMorphoScore] = useState<number | null>(null);

  // (limpieza) ya no usamos resultsLoaded; el modal recarga bajo demanda

  // Refs para evitar múltiples peticiones por idéntica postulación
  const historyLoadedRef = React.useRef<Set<string>>(new Set()); // postulationId
  const docsLoadedRef = React.useRef<Set<string>>(new Set());

  // Ref para no volver a buscar la postulación si ya se hizo una vez
  const postulationFetchedRef = React.useRef(false);

  const abbreviateDocumentType = (docType: string): string => {
    if (!docType) return 'CC';
    const upper = docType.toUpperCase();
    if (upper.startsWith('C')) return 'CC';
    if (upper.startsWith('T')) return 'TI';
    if (upper.startsWith('P')) return 'PP';
    return upper.slice(0, 2);
  };

  const mapDTOToAspirant = (dto: AspirantDTO): Aspirant => ({
    id: dto.id,
    name: dto.name,
    gender: (dto.gender?.toLowerCase() === 'female' || dto.gender?.startsWith('F')) ? 'female' : 'male',
    discipline: dto.discipline || '',
    documents: dto.documents,
    evaluated: dto.qualification !== null,
    sportsHistory: dto.sportHistories?.map(h => ({
      sport: h.sport?.name || '',
      years: 0,
      level: h.status as any,
      competition: '',
      certificate: undefined,
      approved: undefined
    })) || [],
    personalInfo: {
      firstName: (dto.name || '').split(' ')[0] || dto.name || '',
      lastName: (dto.name || '').split(' ').slice(1).join(' ') || '',
      email: dto.email,
      phone: dto.phone || '',
      emergencyPhone: '',
      birthDate: dto.birthDate || '',
      address: dto.address || '',
      city: dto.city || '',
      state: dto.state || '',
      country: dto.country || '',
      idType: abbreviateDocumentType(dto.documentType) as any,
      idNumber: dto.documentNumber,
    },
  });

  // Fetch aspirant on mount or when id changes
  useEffect(() => {
    const fetchAspirant = async () => {
      if (!id) return;
      try {
        const data = await aspirantsService.getById(id);
        if (data) {
          setAspirant(mapDTOToAspirant(data));
        } else {
          // Fallback to mock if not found
          const mock = mockAspirants.find((a: Aspirant) => a.id === id);
          setAspirant(mock);
        }
      } catch (error) {
        console.error('Error al obtener aspirante:', error);
        const mock = mockAspirants.find((a: Aspirant) => a.id === id);
        setAspirant(mock);
      }
    };

    fetchAspirant();
  }, [id]);

  useEffect(() => {
    const fetchMorphologicalData = async () => {
      try {
        const [vars, wts] = await Promise.all([
          morphologicalService.getVariables(),
          morphologicalService.getVariablesWeights(),
        ]);

        setMorphologicalVariables(vars);
        setWeights(wts);
        setIsMorphoLoaded(true);
      } catch (err) {
        console.error('Error cargando variables morfológicas:', err);
        setIsMorphoLoaded(true);
      }
    };

    fetchMorphologicalData();
  }, []);

  // Cálculos de IMC y colores se manejan en el modal



  // (limpieza) Lógica de validación y manejo de inputs se realiza en el modal.

  // Nueva función simplificada para manejar el envío de medidas
  const handleMeasurementSubmit = async (data: { height: number; weight: number; bmi: number }) => {
    if (!aspirant) return;

    // Usar la postulación activa del estado si está disponible, si no, buscarla
    let post = activePostulation;
    if (!post) {
      post = await fetchPostulationForAthlete(aspirant.id);
      setActivePostulation(post);
    }

    if (!post) {
      throw new Error('No se encontró una postulación activa para este aspirante');
    }

    // Buscar las variables específicas
    const heightVar = morphologicalVariables.find(v => 
      v.name.toLowerCase().includes('height') || 
      v.name.toLowerCase().includes('altura') || 
      v.name.toLowerCase().includes('estatura') ||
      v.name.toLowerCase().includes('talla')
    );
    
    const weightVar = morphologicalVariables.find(v => 
      v.name.toLowerCase().includes('weight') || 
      (v.name.toLowerCase().includes('peso') && !v.name.toLowerCase().includes('muscular'))
    );
    
    const bmiVar = morphologicalVariables.find(v => 
      v.name.toLowerCase().includes('imc') || 
      v.name.toLowerCase().includes('bmi') ||
      v.name.toLowerCase().includes('índice')
    );

    if (!heightVar || !weightVar || !bmiVar) {
      throw new Error('No se encontraron las variables morfológicas requeridas (altura, peso, IMC)');
    }

    // Preparar payload para el backend
    const payload: VariableResultPayload[] = [
      { morphological_variable_id: heightVar.id, result: data.height },
      { morphological_variable_id: weightVar.id, result: data.weight },
      { morphological_variable_id: bmiVar.id, result: data.bmi }
    ];

    try {
      await morphologicalService.createVariableResults(post.id, payload);
      
      // Actualizar el estado del aspirante
      setAspirant(prev => prev ? { ...prev, evaluated: true } : prev);
      
      // Recargar los resultados existentes
      await loadExistingResults(post.id);
    } catch (error: any) {
      console.error('Error al guardar medidas:', error);
      throw new Error(error.response?.data?.message || 'Error al guardar las medidas');
    }
  };

  // Función para cargar resultados existentes
  const loadExistingResults = async (postulationId: string) => {
    try {
      const results = await morphologicalService.getVariableResults(postulationId);
      setExistingResults(results);
    } catch (error) {
      console.error('Error al cargar resultados existentes:', error);
      setExistingResults([]);
    }
  };

  const initializeMeasurementsForPostulation = async (postulationId: string) => {
    try {
      const results = await morphologicalService.getVariableResults(postulationId);
      setExistingResults(results);
      const meaningful = (results as any[]).filter(r => r.postulation?.id === postulationId && r.result !== null && r.result !== undefined);
      const has = meaningful.length > 0;
      setHasMeasures(has);
      // Verificar que existan las tres variables requeridas
      const byIdOrObj = (r: any) => r.morphological_variable_id || r.morphological_variable?.id || '';
      const findVar = (names: string[]) => morphologicalVariables.find(v => names.some(n => v.name.toLowerCase().includes(n)));
      const heightVar = findVar(['height','altura','estatura','talla']);
      const weightVar = findVar(['weight','peso']);
      const bmiVar = findVar(['imc','bmi','índice']);
      const ids = new Set(meaningful.map(byIdOrObj));
      const all = !!heightVar && !!weightVar && !!bmiVar && ids.has(heightVar.id) && ids.has(weightVar.id) && ids.has(bmiVar.id);
      setHasAllMeasures(all);
      if (has) {
        setAspirant(prev => prev ? { ...prev, evaluated: true } : prev);
      }
    } catch (err) {
      console.warn('[Details] No se pudieron verificar medidas existentes en init:', err);
      setExistingResults([]);
      setHasAllMeasures(false);
    }
    setIsMeasurementsReady(true);
  };

  // Utilidad de formato se eliminó; no se usa aquí

  const uploadsBase = `${import.meta.env.VITE_API_URL || '/api'}/uploads/`;

  const fetchPostulationForAthlete = async (athleteId: string) => {
    let post: any = await athletesService.getActivePostulation(athleteId);
    if (post) {
      return post;
    }
    try {
      const posts = await postulationService.getPostulationsByAthlete(athleteId);
      // Mantener solo postulaciones del atleta (por si la API trae demás)
      const ownPosts = posts.filter(p => p.athlete?.id === athleteId);

      // Filtrar por estados vigentes (active o pending)
      const preferred = ['active','pending'];
      post = ownPosts.find(p => preferred.includes(p.status));
      if (!post && posts.length) {
        // ordenar por fecha entre sus propias postulaciones
        const sorted = [...ownPosts].sort((a:any,b:any) => {
          const da = new Date(a.updated_at || a.created_at || 0).getTime();
          const db = new Date(b.updated_at || b.created_at || 0).getTime();
          return db - da; // más reciente primero
        });
        post = sorted[0];
      }
      if (post) {
      } else {
      }
      return post;
    } catch (err) {
      console.error('[Details] Error al obtener postulaciones con postulationService:', err);
      return null;
    }
  };

  // Cargar historial deportivo con certificados de la postulación
  useEffect(() => {
    const loadSportsHistory = async () => {
      if (!activePostulation) return;
      if (historyLoadedRef.current.has(activePostulation.id)) return;

      try {
        // Usar la postulación ya obtenida
        const post = activePostulation;
        if (!post) return;

        const postulation = await postulationService.getPostulationById(post.id);
           
           // Actualizar la postulación activa para que contenga los documentos adjuntos completos
           setActivePostulation(postulation);

        // Obtener documentos adjuntos relacionados a logros para enlazar certificados
        let docsByAchievement: Record<string, string> = {};
        try {
          const allDocs = await attachedDocumentsService.getDocuments();
          docsByAchievement = allDocs
            .filter((d: any) => /(achievement)/i.test(d.reference_type))
            .reduce((acc: any, d: any) => {
              acc[d.reference_id] = d.file_path || d.file_name || '';
              return acc;
            }, {});
        } catch (err) {
          console.warn('[Details] No se pudieron cargar documentos adjuntos para logros:', err);
        }

        // Formatear historial deportivo a partir de postulation_sports y sus logros
        const formattedHistory: SportHistoryItem[] = [];
        const seenAch = new Set<string>();

        (postulation.postulation_sports || []).forEach((ps: any) => {
          if (!ps.postulation_sport_achievements || ps.postulation_sport_achievements.length === 0) return;
          const sportName = ps.sport?.name || '';
          const yearsExp = ps.experience_years ?? 0;

          (ps.postulation_sport_achievements || []).forEach((psa: any) => {
            const ach = psa.sports_achievement || {};
            const categoryName = ach.sports_competition_category?.name || 'Sin categoría';
            const typeName = ach.competition_hierarchy?.name || 'Sin tipo';
            const yearsNum = parseFloat(yearsExp as any) || 0;

            let certUrl: string | undefined =
              // Soporte tanto snake_case como camelCase provenientes del backend
              psa.certificate_url ??
              psa.certificateUrl ??
              docsByAchievement[psa.id] ??
              docsByAchievement[ps.id] ??
              docsByAchievement[ach.id];
            if (certUrl && !/^https?:\/\//.test(certUrl)) {
              certUrl = `${uploadsBase}${certUrl}`;
            }
            

            if (seenAch.has(ach.id)) return;
            seenAch.add(ach.id);

            // Deduplicar por deporte: si ya existe, conservar la mayor experiencia (years) y primer certificado
            const existing = formattedHistory.find(h => h.sport === sportName);
            if (existing) {
              existing.years = Math.max(existing.years, yearsNum);
              // Mantener aprobado=true si alguno lo está
              existing.approved = existing.approved || (psa.status === 'Completado');
              if (!existing.certificate) existing.certificate = certUrl;
              if (!existing.id) existing.id = psa.id;
              if (!existing.status) existing.status = psa.status;
            } else {
              formattedHistory.push({
                id: psa.id,
                sport: sportName,
                years: yearsNum,
                level: categoryName as any,
                competition: typeName,
                certificate: certUrl,
                status: psa.status,
                approved: psa.status === 'Completado' ? true : psa.status === 'Cancelado' ? false : undefined
              });
            }
          });
        });

        if (formattedHistory.length > 0) {
          setSportsHistory(formattedHistory);
        }
        historyLoadedRef.current.add(activePostulation.id);
      } catch (err) {
        console.error('[Details] Error cargando historial deportivo:', err);
      }
    };

    loadSportsHistory();
  }, [activePostulation]);

  // Cargar documentos adjuntos
  useEffect(() => {
    const loadAttachedDocuments = async () => {
      if (!aspirant || !activePostulation) return;
      if (docsLoadedRef.current.has(activePostulation.id)) return;

      try {
        // Obtener la postulación activa
        const post = activePostulation;
        if (!post) return;

        // Si la postulación ya contiene los documentos, usarlos directamente. Evita llamada extra al servicio.
        let postulationDocs: any[] = post.attached_documents && post.attached_documents.length
          ? post.attached_documents
          : [];

        if (postulationDocs.length === 0) {
          // Fallback: obtener todos los documentos adjuntos y filtrar
          const allDocs = await attachedDocumentsService.getDocuments();
          

          postulationDocs = allDocs.filter(doc => 
            (doc.postulation?.id === post.id) ||
            doc.postulation_id === post.id ||
            (doc.reference_id === post.id && doc.reference_type === 'postulation')
          );
        }

        // Identificar documentos específicos por tipo
        const normalize = (s: string | undefined) => {
          const base = (s ?? '').toLowerCase();
          // Eliminar acentos para comparaciones robustas
          return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        };
        const medicalCert = postulationDocs.find(doc => {
          const typeName = normalize(doc.attachedDocumentType?.name);
          return typeName.includes('medic'); // coincide con "medico" o "médico"
        });

        const consentForm = postulationDocs.find(doc => {
          const typeName = normalize(doc.attachedDocumentType?.name);
          return typeName.includes('consent'); // "Consentimiento Informado"
        });

        setAttachedDocs({
          medicalCertificate: medicalCert ? { id: medicalCert.id, path: (medicalCert.path || medicalCert.file_path) } : undefined,
          consentForm: consentForm ? { id: consentForm.id, path: (consentForm.path || consentForm.file_path) } : undefined,
        });
        docsLoadedRef.current.add(activePostulation.id);
        // docs cargados
      } catch (err) {
        console.error('[Details] Error cargando documentos adjuntos:', err);
      }
    };

    loadAttachedDocuments();
  }, [aspirant, activePostulation]);

  // Eliminado: la carga de resultados al abrir el modal para evitar parpadeos.



  /* =================   ACTUALIZAR ESTADO DE LOGROS   ================= */
  const handleAchievementAction = async (achievementId: string, action: 'complete' | 'cancel') => {
    if (!achievementId) return;
    const newStatus = action === 'complete' ? 'Completado' : 'Cancelado';
    setUpdatingAchievement(achievementId);
    try {
      await api.patch(`/postulation-sport-achievements/${achievementId}`, { status: newStatus });
      // Refrescar el estado local
      setSportsHistory(prev => prev.map(h =>
        h.id === achievementId ? { ...h, status: newStatus, approved: newStatus === 'Completado' } : h
      ));
    } catch (err) {
      console.error('Error actualizando estado del logro:', err);
    } finally {
      setUpdatingAchievement(null);
    }
  };

  // Effect to fetch postulation once aspirant is loaded y precargar resultados
  useEffect(() => {
    const obtainPostulation = async () => {
      if (!aspirant || postulationFetchedRef.current) return; // ya intentado
      setIsMeasurementsReady(false);
      setHasMeasures(null);
      const post = await fetchPostulationForAthlete(aspirant.id);
      setActivePostulation(post);
      if (post?.id) {
        await initializeMeasurementsForPostulation(post.id);
      } else {
        setIsMeasurementsReady(true);
      }
      postulationFetchedRef.current = true;
    };

    obtainPostulation();
  }, [aspirant]);

  const openMeasurementsModal = async () => {
    // Asegurar que la postulación y resultados estén listos antes de abrir
    if (!aspirant) return;
    if (!activePostulation) {
      const post = await fetchPostulationForAthlete(aspirant.id);
      setActivePostulation(post);
      if (post?.id) {
        await initializeMeasurementsForPostulation(post.id);
      }
    } else if (!isMeasurementsReady) {
      await initializeMeasurementsForPostulation(activePostulation.id);
    }
    // Esperar a que variables/pesos estén cargados para evitar cálculo tardío y parpadeo
    if (!isMorphoLoaded) {
      await new Promise(r => setTimeout(r, 50));
    }
    setIsModalOpen(true);
  };

  // Eliminado: verificación duplicada de medidas (se hace en initializeMeasurementsForPostulation)

  // Cargar puntajes sólo cuando tengamos postulación activa y las tres medidas existentes
  useEffect(() => {
    const loadScores = async () => {
      if (!activePostulation?.id || hasAllMeasures !== true) return;
      try {
        const [sport, morpho] = await Promise.all([
          sportsService.getPostulationSportScore(activePostulation.id),
          morphologicalService.getPostulationScore(activePostulation.id),
        ]);
        setSportsScore(sport);
        setMorphoScore(morpho);
      } catch (e) {
        // evitar 400 cuando aún no hay puntajes calculables
      }
    };
    loadScores();
  }, [activePostulation?.id, hasAllMeasures]);

  if (!aspirant) {
    return (
      <div className="p-8">
        <p>Aspirante no encontrado</p>
        <button
          onClick={() => navigate('/dashboard/aspirants')}
          className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
      </div>
    );
  }

  // Importar el modal optimizado
  const MeasurementsModal = React.lazy(() => import('./components/MeasurementsModal'));

  const renderMeasurementsModal = () => {
    if (!isModalOpen || !aspirant) return null;

    // Derivar valores iniciales de altura/peso según resultados existentes y variables
    const heightVar = morphologicalVariables.find(v => 
      v.name.toLowerCase().includes('height') || 
      v.name.toLowerCase().includes('altura') || 
      v.name.toLowerCase().includes('estatura') ||
      v.name.toLowerCase().includes('talla')
    );
    const weightVar = morphologicalVariables.find(v => 
      v.name.toLowerCase().includes('weight') || 
      (v.name.toLowerCase().includes('peso') && !v.name.toLowerCase().includes('muscular'))
    );
    const heightResult = existingResults.find((r: any) => 
      r.morphological_variable_id === heightVar?.id || r.morphological_variable?.id === heightVar?.id
    );
    const weightResult = existingResults.find((r: any) => 
      r.morphological_variable_id === weightVar?.id || r.morphological_variable?.id === weightVar?.id
    );
    const initialHeight = heightResult?.result ?? '';
    const initialWeight = weightResult?.result ?? '';

    if (!isMeasurementsReady || !isMorphoLoaded) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#006837]"></div>
        </div>
      );
    }

    return (
      <React.Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#006837]"></div></div>}>
        <MeasurementsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          aspirant={aspirant}
          onSubmit={handleMeasurementSubmit}
          variables={morphologicalVariables}
          weights={weights}
          initialHeight={initialHeight}
          initialWeight={initialWeight}
        />
      </React.Suspense>
    );
  };





  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/dashboard/aspirants')}
        className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={20} />
        Volver a la lista
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{aspirant.name}</h2>
            <p className="text-gray-500">{aspirant.personalInfo.email}</p>
          </div>
          <button
            onClick={openMeasurementsModal}
            className="bg-[#006837] text-white px-4 py-2 rounded-xl hover:bg-[#005828] transition-colors flex items-center gap-2"
          >
            <Ruler size={20} />
            {hasMeasures ? 'Editar Medidas' : 'Registrar Medidas'}
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Identificación</p>
                  <p className="font-medium">{aspirant.personalInfo.idType} {aspirant.personalInfo.idNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                  <p className="font-medium">{aspirant.personalInfo.birthDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{aspirant.personalInfo.address}</p>
                  <p className="font-medium">{aspirant.personalInfo.city}, {aspirant.personalInfo.state}</p>
                  <p className="font-medium">{aspirant.personalInfo.country}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contacto</p>
                  <p className="font-medium">Tel: {aspirant.personalInfo.phone}</p>
                  <p className="font-medium">Emergencia: {aspirant.personalInfo.emergencyPhone}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-4">Información Deportiva</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Disciplina Principal</p>
                  <p className="font-medium">{aspirant.discipline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de Documentos</p>
                  <div className="mt-1">
                    <AspirantStatus documents={aspirant.documents} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de Calificación</p>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      aspirant.evaluated
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {aspirant.evaluated ? 'Calificado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Historial Deportivo</h3>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-[#006837]" size={24} />
              <p className="text-gray-600">Logros y certificaciones deportivas del aspirante</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Deporte</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Años</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Nivel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Competencia</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Certificado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(sportsHistory.length ? sportsHistory : aspirant.sportsHistory).map((history, index): React.ReactNode => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Medal className="text-[#006837]" size={16} />
                          {history.sport}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {Number(history.years) % 1 === 0 ? Number(history.years) : Number(history.years).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.competition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {history.certificate ? (
                          <a
                            href={history.certificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1"
                          >
                            <Download size={16} />
                            Ver PDF
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">No adjunto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (history as any).status === 'Completado'
                            ? 'bg-green-100 text-green-800'
                            : (history as any).status === 'Cancelado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(history as any).status || 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            className={`text-green-600 hover:text-green-800 ${((history as any).status === 'Completado') ? 'opacity-40 cursor-not-allowed' : ''}`}
                            disabled={updatingAchievement === ((history as any).id ?? '') || ((history as any).status === 'Completado')}
                            onClick={() => handleAchievementAction((history as any).id ?? '', 'complete')}
                          >
                            {updatingAchievement === ((history as any).id ?? '') ? (
                              <div className="animate-spin h-5 w-5 border-2 border-green-600 rounded-full border-t-transparent" />
                            ) : (
                              <CheckCircle size={20} />
                            )}
                          </button>
                          <button
                            className={`text-red-600 hover:text-red-800 ${((history as any).status === 'Cancelado') ? 'opacity-40 cursor-not-allowed' : ''}`}
                            disabled={updatingAchievement === ((history as any).id ?? '') || ((history as any).status === 'Cancelado')}
                            onClick={() => handleAchievementAction((history as any).id ?? '', 'cancel')}
                          >
                            {updatingAchievement === ((history as any).id ?? '') ? (
                              <div className="animate-spin h-5 w-5 border-2 border-red-600 rounded-full border-t-transparent" />
                            ) : (
                              <XCircle size={20} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Documentos Adjuntos</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Certificado Médico */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="text-[#006837]" size={20} />
                    <h4 className="font-medium">Certificado Médico</h4>
                </div>
                  {attachedDocs.medicalCertificate ? (
                    <a 
                      href={attachedDocs.medicalCertificate.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1"
                    >
                      <FileText size={16} />
                      Ver Documento
                    </a>
                  ) : (
                    <span className="text-yellow-600 text-sm">No cargado</span>
                  )}
                </div>
              </div>

              {/* Consentimiento Informado */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="text-[#006837]" size={20} />
                    <h4 className="font-medium">Consentimiento Informado</h4>
                </div>
                  {attachedDocs.consentForm ? (
                    <a 
                      href={attachedDocs.consentForm.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1"
                    >
                      <FileText size={16} />
                      Ver Documento
                    </a>
                  ) : (
                    <span className="text-yellow-600 text-sm">No cargado</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Sección de puntajes */}
          {sportsScore !== null && morphoScore !== null && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-4">Puntajes Obtenidos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl shadow flex flex-col items-center">
                  <p className="text-sm text-gray-500 mb-1">Logros Deportivos (40%)</p>
                  <p className="text-3xl font-bold text-[#006837]">{sportsScore}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl shadow flex flex-col items-center">
                  <p className="text-sm text-gray-500 mb-1">Valoración Morfofuncional (60%)</p>
                  <p className="text-3xl font-bold text-[#006837]">{morphoScore}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl shadow flex flex-col items-center">
                  <p className="text-sm text-gray-500 mb-1">Calificación Total</p>
                  <p className="text-3xl font-bold text-[#006837]">{Number(sportsScore)+Number(morphoScore)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderMeasurementsModal()}
    </div>
  );
};