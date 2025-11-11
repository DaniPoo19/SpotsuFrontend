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
  Trash2,
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



export const AspirantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados principales
  const [aspirant, setAspirant] = useState<Aspirant | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePostulation, setActivePostulation] = useState<any | null>(null);
  
  // Estados de carga optimizados
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    aspirant: false,
    postulation: false,
    documents: false,
    sportsHistory: false,
    measurements: false,
    morphological: false
  });
  
  // Variables morfológicas y pesos
  const [morphologicalVariables, setMorphologicalVariables] = useState<MorphologicalVariable[]>([]);
  const [weights, setWeights] = useState<MorphologicalVariablesWeight[]>([]);
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [hasMeasures, setHasMeasures] = useState<boolean>(false);
  const [hasAllMeasures, setHasAllMeasures] = useState<boolean>(false);

  // Documentos adjuntos
  const [attachedDocs, setAttachedDocs] = useState<{
    medicalCertificate?: { id: string; path: string; status?: string; };
    consentForm?: { id: string; path: string; status?: string; };
  }>({});
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);

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

  // Función para actualizar estados de carga
  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Función para verificar si todos los datos críticos están cargados
  const isDataReady = () => {
    return !loadingStates.aspirant && !loadingStates.postulation && 
           !loadingStates.morphological && !loadingStates.measurements;
  };

  // Effect para manejar el estado general de carga
  useEffect(() => {
    setIsLoading(!isDataReady());
  }, [loadingStates]);

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

  // Fetch aspirant on mount or when id changes - OPTIMIZADO
  useEffect(() => {
    const fetchAspirant = async () => {
      if (!id) return;
      
      // RESETEAR el ref cuando cambia el ID para permitir nueva carga
      console.log('[] ID de aspirante cambió, reseteando refs');
      postulationFetchedRef.current = false;
      historyLoadedRef.current.clear();
      docsLoadedRef.current.clear();
      
      // LIMPIAR datos anteriores
      setExistingResults([]);
      setHasMeasures(false);
      setHasAllMeasures(false);
      setActivePostulation(null);
      
      updateLoadingState('aspirant', true);
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
      } finally {
        updateLoadingState('aspirant', false);
      }
    };

    fetchAspirant();
  }, [id]);

  // Cargar datos morfológicos - OPTIMIZADO
  useEffect(() => {
    const fetchMorphologicalData = async () => {
      updateLoadingState('morphological', true);
      try {
        const [vars, wts] = await Promise.all([
          morphologicalService.getVariables(),
          morphologicalService.getVariablesWeights(),
        ]);

        setMorphologicalVariables(vars);
        setWeights(wts);
      } catch (err) {
        console.error('Error cargando variables morfológicas:', err);
      } finally {
        updateLoadingState('morphological', false);
      }
    };

    fetchMorphologicalData();
  }, []);

  // Cálculos de IMC y colores se manejan en el modal



  // (limpieza) Lógica de validación y manejo de inputs se realiza en el modal.

  // Tipo para los datos del formulario de medidas
  interface MeasurementData {
    estatura: number;
    pesoCorporal: number;
    imc: number;
    masaMuscular: number;
    masaGrasa: number;
    grasaVisceral: number;
    edadMetabolica: number;
    masaOsea: number;
    potenciaAerobica: number;
  }

  // Función para manejar el envío de TODAS las medidas morfológicas
  const handleMeasurementSubmit = async (data: MeasurementData) => {
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

    // Utilidad de normalización para coincidencias robustas (sin acentos)
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Función para encontrar variable por nombre exacto o similar
    const findVariable = (exactName: string, alternativeTerms: string[] = []) => {
      // Primero buscar por nombre exacto
      let variable = morphologicalVariables.find(v => v.name === exactName);
      
      // Si no se encuentra, buscar por términos alternativos
      if (!variable && alternativeTerms.length > 0) {
        variable = morphologicalVariables.find(v => {
          const n = normalize(v.name);
          return alternativeTerms.some(term => n.includes(normalize(term)));
        });
      }
      
      return variable;
    };

    // Mapeo de variables según los nombres EXACTOS de la BD
    const variableMap = {
      estatura: findVariable('Estatura', ['estatura', 'altura', 'height', 'talla']),
      pesoCorporal: findVariable('Peso Corporal', ['peso corporal', 'peso', 'weight']),
      imc: findVariable('IMC', ['imc', 'indice de masa corporal', 'bmi']),
      masaMuscular: findVariable('Masa Muscular', ['masa muscular', 'muscle mass']),
      masaGrasa: findVariable('Masa Grasa', ['masa grasa', 'fat mass', 'grasa']),
      grasaVisceral: findVariable('Grasa Visceral', ['grasa visceral', 'visceral fat']),
      edadMetabolica: findVariable('Edad Metabólica', ['edad metabolica', 'metabolic age']),
      masaOsea: findVariable('Masa Ósea', ['masa osea', 'bone mass']),
      potenciaAerobica: findVariable('Potencia Aeróbica', ['potencia aerobica', 'potencia aeróbica', 'aerobica'])
    };

    // Verificar que todas las variables existan
    const missingVars: string[] = [];
    Object.entries(variableMap).forEach(([key, variable]) => {
      if (!variable) {
        missingVars.push(key);
      }
    });

    if (missingVars.length > 0) {
      console.error('Variables morfológicas faltantes:', missingVars);
      console.log('Variables disponibles en BD:', morphologicalVariables.map(v => v.name));
      throw new Error(`No se encontraron las siguientes variables morfológicas: ${missingVars.join(', ')}`);
    }

    // Preparar payload con TODAS las variables
    const payload: VariableResultPayload[] = [
      { morphological_variable_id: variableMap.estatura!.id, result: data.estatura },
      { morphological_variable_id: variableMap.pesoCorporal!.id, result: data.pesoCorporal },
      { morphological_variable_id: variableMap.imc!.id, result: data.imc },
      { morphological_variable_id: variableMap.masaMuscular!.id, result: data.masaMuscular },
      { morphological_variable_id: variableMap.masaGrasa!.id, result: data.masaGrasa },
      { morphological_variable_id: variableMap.grasaVisceral!.id, result: data.grasaVisceral },
      { morphological_variable_id: variableMap.edadMetabolica!.id, result: data.edadMetabolica },
      { morphological_variable_id: variableMap.masaOsea!.id, result: data.masaOsea },
      { morphological_variable_id: variableMap.potenciaAerobica!.id, result: data.potenciaAerobica }
    ];

    try {
      console.log('Enviando variables morfológicas:', payload);
      
      // Usar el endpoint correcto del backend que maneja upsert automáticamente
      // El backend verifica si existen y actualiza o crea según corresponda
      await morphologicalService.updateVariableResults(post.id, payload);
      
      // Actualizar el estado del aspirante
      setAspirant(prev => prev ? { ...prev, evaluated: true } : prev);
      
      // Recargar los resultados existentes
      await loadExistingResults(post.id);
      
      // Marcar que ahora tiene todas las medidas
      setHasAllMeasures(true);
      setHasMeasures(true);
      
      // Actualizar el estado de la postulación a completada
      try {
        await postulationService.updatePostulationStatus(post.id, 'completed');
        setActivePostulation((prev: any) => prev ? { ...prev, status: 'completed' } : prev);
      } catch (statusError) {
        console.warn('Error al actualizar estado de postulación:', statusError);
      }
    } catch (error: any) {
      console.error('Error al guardar medidas:', error);
      throw new Error(error.response?.data?.message || 'Error al guardar las medidas');
    }
  };

  // Función para cargar resultados existentes FILTRADOS por postulation_id
  const loadExistingResults = async (postulationId: string) => {
    try {
      console.log('[] Cargando resultados para postulación:', postulationId);
      const results = await morphologicalService.getVariableResults(postulationId);
      
      // FILTRAR resultados para asegurar que solo sean de esta postulación
      const filteredResults = (results as any[]).filter(r => {
        const rPostId = r.postulation?.id || r.postulation_id;
        return rPostId === postulationId;
      });
      
      console.log('[] Resultados totales recibidos:', results.length);
      console.log('[] Resultados filtrados para esta postulación:', filteredResults.length);
      
      setExistingResults(filteredResults);
    } catch (error) {
      console.error('Error al cargar resultados existentes:', error);
      setExistingResults([]);
    }
  };

  const initializeMeasurementsForPostulation = async (postulationId: string) => {
    try {
      console.log('[] Inicializando medidas para postulación:', postulationId);
      const results = await morphologicalService.getVariableResults(postulationId);
      
      // FILTRAR resultados para asegurar que solo sean de esta postulación
      const filteredResults = (results as any[]).filter(r => {
        const rPostId = r.postulation?.id || r.postulation_id;
        return rPostId === postulationId;
      });
      
      console.log('[] Resultados totales recibidos en init:', results.length);
      console.log('[] Resultados filtrados en init:', filteredResults.length);
      
      setExistingResults(filteredResults);
      
      const meaningful = filteredResults.filter(r => r.result !== null && r.result !== undefined);
      const has = meaningful.length > 0;
      
      // Establecer hasMeasures inmediatamente para evitar parpadeo
      setHasMeasures(has);
      
      // Verificar que existan LAS 9 variables morfológicas requeridas
      const byIdOrObj = (r: any) => r.morphological_variable_id || r.morphological_variable?.id || '';
      const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const findVar = (names: string[]) => morphologicalVariables.find(v => {
        const n = normalize(v.name);
        return names.some(term => n.includes(normalize(term)));
      });
      
      // Buscar las 9 variables requeridas
      const estaturaVar = findVar(['estatura','altura','height','talla']);
      const pesoVar = morphologicalVariables.find(v => {
        const n = normalize(v.name);
        if (n.includes('muscular')) return false;
        return ['peso corporal','peso','weight'].some(term => n.includes(normalize(term)));
      });
      const imcVar = findVar(['imc','bmi','indice de masa']);
      const masaMuscularVar = findVar(['masa muscular']);
      const masaGrasaVar = findVar(['masa grasa']);
      const grasaVisceralVar = findVar(['grasa visceral']);
      const edadMetabolicaVar = findVar(['edad metabolica','edad metabólica']);
      const masaOseaVar = findVar(['masa osea','masa ósea']);
      const pailerVar = findVar(['pailer test','leger']);
      
      const ids = new Set(meaningful.map(byIdOrObj));
      
      // Verificar que las 9 variables existan Y tengan resultados
      const allVariablesFound = !![
        estaturaVar, pesoVar, imcVar, masaMuscularVar, masaGrasaVar,
        grasaVisceralVar, edadMetabolicaVar, masaOseaVar, pailerVar
      ].every(v => v);
      
      const allResultsExist = allVariablesFound && [
        estaturaVar, pesoVar, imcVar, masaMuscularVar, masaGrasaVar,
        grasaVisceralVar, edadMetabolicaVar, masaOseaVar, pailerVar
      ].every(v => v && ids.has(v.id));
      
      setHasAllMeasures(allResultsExist);
      
      if (has) {
        setAspirant(prev => prev ? { ...prev, evaluated: true } : prev);
      }
      
      console.log('[] Medidas inicializadas - has:', has, 'all 9 variables:', allResultsExist, 'results count:', meaningful.length);
    } catch (err) {
      console.warn('[] No se pudieron verificar medidas existentes en init:', err);
      setExistingResults([]);
      setHasMeasures(false);
      setHasAllMeasures(false);
    }
  };

  // Utilidad de formato se eliminó; no se usa aquí

  // Obtener la URL base del servidor
  // En desarrollo: http://localhost:3000 (remover prefijo /tracksport/api/v1)
  // En producción: https://api.tracksport.socratesunicordoba.co (ya está lista)
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_PREFIX = import.meta.env.VITE_API_PREFIX || '';
  
  // Si hay prefijo, removerlo para obtener la URL base del servidor
  let serverBaseUrl = BASE_URL;
  if (API_PREFIX && BASE_URL.includes(API_PREFIX)) {
    serverBaseUrl = BASE_URL.replace(API_PREFIX, '');
  } else if (BASE_URL.includes('/api/v1')) {
    serverBaseUrl = BASE_URL.replace(/\/(tracksport|spotsu)\/api\/v1\/?$/, '');
  }
  
  const uploadsBase = `${serverBaseUrl}/uploads/`;
  
  console.log('[Aspirants Details] Server Base URL:', serverBaseUrl);
  console.log('[Aspirants Details] Uploads Base:', uploadsBase);

  const fetchPostulationForAthlete = async (athleteId: string) => {
    try {
      // Primero intentar obtener la postulación activa
      let post: any = await athletesService.getActivePostulation(athleteId);
      
      if (post?.id) {
        // Si encontramos una postulación, obtener los datos completos
        try {
          const fullPost = await postulationService.getPostulationById(post.id);
          console.log('[] Postulación activa encontrada con datos completos:', fullPost);
          return fullPost;
        } catch (err) {
          console.warn('[] Error al obtener datos completos de postulación activa:', err);
          return post; // Retornar datos básicos si falla
        }
      }

      // Si no hay postulación activa, buscar en todas las postulaciones
      const posts = await postulationService.getPostulationsByAthlete(athleteId);
      // Mantener solo postulaciones del atleta (por si la API trae demás)
      const ownPosts = posts.filter(p => p.athlete?.id === athleteId);

      // Filtrar por estados vigentes (active o pending)
      const preferred = ['active','pending'];
      post = ownPosts.find(p => preferred.includes(p.status));
      if (!post && ownPosts.length) {
        // ordenar por fecha entre sus propias postulaciones
        const sorted = [...ownPosts].sort((a:any,b:any) => {
          const da = new Date(a.updated_at || a.created_at || 0).getTime();
          const db = new Date(b.updated_at || b.created_at || 0).getTime();
          return db - da; // más reciente primero
        });
        post = sorted[0];
      }

      // Si encontramos una postulación, obtener los datos completos
      if (post?.id) {
        try {
          const fullPost = await postulationService.getPostulationById(post.id);
          console.log('[] Postulación encontrada con datos completos:', fullPost);
          return fullPost;
        } catch (err) {
          console.warn('[] Error al obtener datos completos de postulación:', err);
          return post; // Retornar datos básicos si falla
        }
      }

      return null;
    } catch (err) {
      console.error('[] Error al obtener postulaciones con postulationService:', err);
      return null;
    }
  };

  // Cargar historial deportivo con certificados de la postulación
  // Cargar historial deportivo - OPTIMIZADO
  useEffect(() => {
    const loadSportsHistory = async () => {
      if (!activePostulation) return;
      if (historyLoadedRef.current.has(activePostulation.id)) return;

      updateLoadingState('sportsHistory', true);
      
      try {
        console.log('[] Cargando historial deportivo para postulación:', activePostulation.id);
        console.log('[] Postulación completa:', activePostulation);
        
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
          console.warn('[] No se pudieron cargar documentos adjuntos para logros:', err);
        }

        // Formatear historial deportivo a partir de postulation_sports y sus logros
        const formattedHistory: SportHistoryItem[] = [];
        const seenAch = new Set<string>();

        console.log('[] Postulation sports:', activePostulation.postulation_sports);

        (activePostulation.postulation_sports || []).forEach((ps: any) => {
          if (!ps.postulation_sport_achievements || ps.postulation_sport_achievements.length === 0) {
            console.log('[] No hay logros para deporte:', ps.sport?.name);
            return;
          }
          
          const sportName = ps.sport?.name || '';
          const yearsExp = ps.experience_years ?? 0;

          console.log('[] Procesando deporte:', sportName, 'con', ps.postulation_sport_achievements.length, 'logros');

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

        console.log('[] Historial deportivo formateado:', formattedHistory);
        setSportsHistory(formattedHistory);
        historyLoadedRef.current.add(activePostulation.id);
      } catch (err) {
        console.error('[] Error cargando historial deportivo:', err);
      } finally {
        updateLoadingState('sportsHistory', false);
      }
    };

    loadSportsHistory();
  }, [activePostulation]);

  // Cargar documentos adjuntos
  // Cargar documentos adjuntos - OPTIMIZADO
  useEffect(() => {
    const loadAttachedDocuments = async () => {
      if (!aspirant || !activePostulation) return;
      if (docsLoadedRef.current.has(activePostulation.id)) return;

      updateLoadingState('documents', true);
      
      try {
        console.log('[] Cargando documentos adjuntos para postulación:', activePostulation.id);
        
        // Si la postulación ya contiene los documentos, usarlos directamente
        let postulationDocs: any[] = activePostulation.attached_documents && activePostulation.attached_documents.length
          ? activePostulation.attached_documents
          : [];

        console.log('[] Documentos en postulación:', postulationDocs);

        if (postulationDocs.length === 0) {
          // Fallback: obtener todos los documentos adjuntos y filtrar
          console.log('[] No hay documentos en postulación, buscando en servicio...');
          const allDocs = await attachedDocumentsService.getDocuments();
          
          postulationDocs = allDocs.filter(doc => 
            (doc.postulation?.id === activePostulation.id) ||
            doc.postulation_id === activePostulation.id ||
            (doc.reference_id === activePostulation.id && doc.reference_type === 'postulation')
          );
          console.log('[] Documentos encontrados en servicio:', postulationDocs);
        }

        // Identificar documentos específicos por tipo
        const normalize = (s: string | undefined) => {
          const base = (s ?? '').toLowerCase();
          // Eliminar acentos para comparaciones robustas
          return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        };
        
        console.log('[] Buscando documentos entre:', postulationDocs.map(d => ({
          id: d.id,
          type: d.attachedDocumentType?.name || d.attached_document_type?.name || d.document_type?.name,
          refType: d.reference_type,
          refId: d.reference_id
        })));
        
        const medicalCert = postulationDocs.find(doc => {
          const typeName = normalize(
            doc.attachedDocumentType?.name || 
            doc.attached_document_type?.name || 
            doc.document_type?.name || 
            ''
          );
          return typeName.includes('medic') || typeName.includes('certificado medico');
        });

        const consentForm = postulationDocs.find(doc => {
          const typeName = normalize(
            doc.attachedDocumentType?.name || 
            doc.attached_document_type?.name || 
            doc.document_type?.name || 
            ''
          );
          return typeName.includes('consent') || typeName.includes('consentimiento');
        });

        console.log('[] Certificado médico encontrado:', medicalCert);
        console.log('[] Consentimiento informado encontrado:', consentForm);

        // Construir URL completa si es path relativo
        const buildUrl = (doc: any, isMedicalOrConsent = false) => {
          if (!doc) return undefined;
          const path = doc.path || doc.file_path || doc.filePath;
          if (!path) return undefined;
          
          // Si ya es una URL completa, retornarla
          if (/^https?:\/\//.test(path)) return path;
          
          // Si es certificado médico o consentimiento informado, o cualquier documento
          // usar la URL base del servidor desde variables de entorno
          if (isMedicalOrConsent) {
            return `${serverBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
          }
          
          // Si es un path relativo, construir URL completa
          return `${uploadsBase}${path.startsWith('/') ? path.slice(1) : path}`;
        };

        setAttachedDocs({
          medicalCertificate: medicalCert ? { 
            id: medicalCert.id, 
            path: buildUrl(medicalCert, true) || '',
            status: medicalCert.status
          } : undefined,
          consentForm: consentForm ? { 
            id: consentForm.id, 
            path: buildUrl(consentForm, true) || '',
            status: consentForm.status
          } : undefined,
        });
        docsLoadedRef.current.add(activePostulation.id);
      } catch (err) {
        console.error('[] Error cargando documentos adjuntos:', err);
      } finally {
        updateLoadingState('documents', false);
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

  /* =================   ELIMINAR DOCUMENTO ADJUNTO   ================= */
  const handleDeleteDocument = async (documentId: string, documentType: 'medical' | 'consent') => {
    if (!documentId) return;
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar este documento? El estudiante podrá subir uno nuevo desde su panel.`
    );
    
    if (!confirmDelete) return;
    
    setDeletingDocument(documentId);
    try {
      console.log('[DeleteDocument] Eliminando documento:', documentId);
      await attachedDocumentsService.deleteDocument(documentId);
      
      // Actualizar el estado local para reflejar la eliminación
      setAttachedDocs(prev => ({
        ...prev,
        [documentType === 'medical' ? 'medicalCertificate' : 'consentForm']: undefined
      }));
      
      console.log('[DeleteDocument] Documento eliminado exitosamente');
      
      // Marcar que los documentos deben recargarse
      if (activePostulation?.id) {
        docsLoadedRef.current.delete(activePostulation.id);
      }
    } catch (err) {
      console.error('[DeleteDocument] Error eliminando documento:', err);
      alert('Error al eliminar el documento. Por favor, intenta nuevamente.');
    } finally {
      setDeletingDocument(null);
    }
  };

  /* =================   APROBAR DOCUMENTO ADJUNTO   ================= */
  const handleApproveDocument = async (documentId: string, documentType: 'medical' | 'consent') => {
    if (!documentId) return;
    
    const confirmApprove = window.confirm(
      `¿Confirmas que este documento es válido y deseas aprobarlo?`
    );
    
    if (!confirmApprove) return;
    
    setDeletingDocument(documentId); // Usamos el mismo estado para el loading
    try {
      console.log('[ApproveDocument] Aprobando documento:', documentId);
      await attachedDocumentsService.updateDocument(documentId, { status: 'Completado' });
      
      // Actualizar el estado local para reflejar la aprobación
      setAttachedDocs(prev => {
        const key = documentType === 'medical' ? 'medicalCertificate' : 'consentForm';
        const currentDoc = prev[key];
        if (!currentDoc) return prev;
        
        return {
          ...prev,
          [key]: {
            ...currentDoc,
            status: 'Completado' as any
          }
        };
      });
      
      console.log('[ApproveDocument] Documento aprobado exitosamente');
      alert('Documento aprobado exitosamente');
      
      // Marcar que los documentos deben recargarse
      if (activePostulation?.id) {
        docsLoadedRef.current.delete(activePostulation.id);
      }
    } catch (err) {
      console.error('[ApproveDocument] Error aprobando documento:', err);
      alert('Error al aprobar el documento. Por favor, intenta nuevamente.');
    } finally {
      setDeletingDocument(null);
    }
  };

  // Effect to fetch postulation once aspirant is loaded - OPTIMIZADO
  useEffect(() => {
    const obtainPostulation = async () => {
      if (!aspirant || postulationFetchedRef.current) return;
      
      // LIMPIAR resultados anteriores cuando cambia el aspirante
      console.log('[] Limpiando resultados anteriores al cambiar aspirante');
      setExistingResults([]);
      setHasMeasures(false);
      setHasAllMeasures(false);
      
      updateLoadingState('postulation', true);
      updateLoadingState('measurements', true);
      
      try {
        const post = await fetchPostulationForAthlete(aspirant.id);
        setActivePostulation(post);
        
        if (post?.id) {
          await initializeMeasurementsForPostulation(post.id);
        }
      } catch (error) {
        console.error('Error obteniendo postulación:', error);
      } finally {
        updateLoadingState('postulation', false);
        updateLoadingState('measurements', false);
        postulationFetchedRef.current = true;
      }
    };

    obtainPostulation();
  }, [aspirant]);

  const openMeasurementsModal = async () => {
    // Validaciones básicas
    if (!aspirant) return;
    
    // Verificar que las variables morfológicas estén cargadas
    // Permitimos abrir aunque no existan weights; el modal valida con rangos básicos
    if (!morphologicalVariables.length) {
      console.warn('Variables morfológicas no están listas');
      return;
    }
    
    // Si ya tenemos la postulación y las medidas están listas, abrir directamente
    if (activePostulation?.id && hasMeasures !== undefined) {
      setIsModalOpen(true);
      return;
    }
    
    // Si no tenemos postulación, cargarla
    if (!activePostulation) {
      try {
        const post = await fetchPostulationForAthlete(aspirant.id);
        setActivePostulation(post);
        if (post?.id) {
          await initializeMeasurementsForPostulation(post.id);
        }
      } catch (error) {
        console.error('Error cargando postulación:', error);
        return;
      }
    }
    
    // Verificar que tenemos una postulación válida antes de abrir el modal
    if (!activePostulation?.id) {
      console.error('No se encontró una postulación válida para este aspirante');
      return;
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

  // Memoizar initialData para evitar re-construcción en cada render
  const initialData = React.useMemo(() => {
    if (!morphologicalVariables.length || !existingResults.length) {
      return undefined;
    }

    // Función auxiliar para encontrar resultado de una variable por nombre
    const getResultByVariableName = (names: string[]) => {
      const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Buscar la variable morfológica
      const variable = morphologicalVariables.find(v => {
        const normalized = normalize(v.name);
        return names.some(name => normalized.includes(normalize(name)));
      });
      
      if (!variable) {
        return undefined;
      }
      
      // Buscar el resultado correspondiente
      const result = existingResults.find((r: any) => {
        const varId = r.morphological_variable_id || r.morphological_variable?.id;
        return varId === variable.id;
      });
      
      return result?.result;
    };

    // Construir objeto de datos iniciales con TODAS las variables
    const data = {
      estatura: getResultByVariableName(['estatura', 'altura', 'height', 'talla']),
      pesoCorporal: getResultByVariableName(['peso corporal', 'peso']),
      imc: getResultByVariableName(['imc', 'indice de masa', 'bmi']),
      masaMuscular: getResultByVariableName(['masa muscular', 'muscle mass']),
      masaGrasa: getResultByVariableName(['masa grasa', 'fat mass']),
      grasaVisceral: getResultByVariableName(['grasa visceral', 'visceral fat']),
      edadMetabolica: getResultByVariableName(['edad metabolica', 'edad metabólica', 'metabolic age']),
      masaOsea: getResultByVariableName(['masa osea', 'masa ósea', 'bone mass']),
      potenciaAerobica: getResultByVariableName(['potencia aerobica', 'potencia aeróbica', 'aerobica'])
    };
    
    console.log('[] Datos iniciales memoizados construidos:', data);
    return data;
  }, [morphologicalVariables, existingResults]);

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

    if (!morphologicalVariables.length) {
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
          initialData={initialData}
        />
      </React.Suspense>
    );
  };





  // Render optimizado con estados de carga
  if (isLoading) {
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
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#006837] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del aspirante...</p>
            {loadingStates.aspirant && <p className="text-sm text-gray-500 mt-2">Cargando datos personales...</p>}
            {loadingStates.postulation && <p className="text-sm text-gray-500 mt-2">Cargando postulación...</p>}
            {loadingStates.morphological && <p className="text-sm text-gray-500 mt-2">Cargando variables morfológicas...</p>}
            {loadingStates.measurements && <p className="text-sm text-gray-500 mt-2">Verificando medidas...</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!aspirant) {
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
          <div className="p-8 text-center">
            <p className="text-gray-600">No se encontró información del aspirante</p>
          </div>
        </div>
      </div>
    );
  }

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
            {loadingStates.sportsHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#006837] mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando historial deportivo...</p>
              </div>
            ) : (
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
            )}
          </section>

          <section className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Documentos Adjuntos</h3>
            {loadingStates.documents ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#006837] mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando documentos adjuntos...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
              {/* Certificado Médico */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="text-[#006837]" size={20} />
                    <h4 className="font-medium">Certificado Médico</h4>
                  </div>
                  {attachedDocs.medicalCertificate && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      (attachedDocs.medicalCertificate as any).status === 'Completado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(attachedDocs.medicalCertificate as any).status || 'Pendiente'}
                    </span>
                  )}
                </div>
                {attachedDocs.medicalCertificate ? (
                  <div className="flex items-center gap-2 justify-end">
                    <a 
                      href={attachedDocs.medicalCertificate.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText size={16} />
                      Ver
                    </a>
                    {(attachedDocs.medicalCertificate as any).status !== 'Completado' && (
                      <button
                        onClick={() => handleApproveDocument(attachedDocs.medicalCertificate!.id, 'medical')}
                        disabled={deletingDocument === attachedDocs.medicalCertificate.id}
                        className="p-1 px-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Aprobar documento"
                      >
                        {deletingDocument === attachedDocs.medicalCertificate.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600"></div>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Aprobar</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(attachedDocs.medicalCertificate!.id, 'medical')}
                      disabled={deletingDocument === attachedDocs.medicalCertificate.id}
                      className="p-1 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Eliminar documento"
                    >
                      {deletingDocument === attachedDocs.medicalCertificate.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          <span className="text-sm font-medium">Eliminar</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-yellow-600 text-sm">No cargado</span>
                )}
              </div>

              {/* Consentimiento Informado */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="text-[#006837]" size={20} />
                    <h4 className="font-medium">Consentimiento Informado</h4>
                  </div>
                  {attachedDocs.consentForm && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      (attachedDocs.consentForm as any).status === 'Completado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(attachedDocs.consentForm as any).status || 'Pendiente'}
                    </span>
                  )}
                </div>
                {attachedDocs.consentForm ? (
                  <div className="flex items-center gap-2 justify-end">
                    <a 
                      href={attachedDocs.consentForm.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText size={16} />
                      Ver
                    </a>
                    {(attachedDocs.consentForm as any).status !== 'Completado' && (
                      <button
                        onClick={() => handleApproveDocument(attachedDocs.consentForm!.id, 'consent')}
                        disabled={deletingDocument === attachedDocs.consentForm.id}
                        className="p-1 px-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Aprobar documento"
                      >
                        {deletingDocument === attachedDocs.consentForm.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600"></div>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Aprobar</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(attachedDocs.consentForm!.id, 'consent')}
                      disabled={deletingDocument === attachedDocs.consentForm.id}
                      className="p-1 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Eliminar documento"
                    >
                      {deletingDocument === attachedDocs.consentForm.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          <span className="text-sm font-medium">Eliminar</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-yellow-600 text-sm">No cargado</span>
                )}
              </div>
              </div>
            )}
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

// Alias para rutas que importan como AspirantDetailsPage
export const AspirantDetailsPage = AspirantPage;