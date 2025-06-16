import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Ruler, 
  CheckCircle, 
  XCircle,
  Scale,
  Activity,
  Heart,
  Bone,
  Timer,
  User,
  Weight,
  ArrowUp,
  Percent,
  Clock,
  TestTube,
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

interface PhysicalMeasurements {
  height: number;
  weight: number;
  muscularMass: number;
  fatMass: number;
  visceralFat: number;
  metabolicAge: number;
  boneMass: number;
  pailerTest: number;
}

interface MeasurementResult {
  variable: MorphologicalVariable;
  value: string;
  isValid: boolean;
  score: number | null;
}

export const AspirantDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aspirant, setAspirant] = useState<Aspirant | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [measurements, setMeasurements] = useState<PhysicalMeasurements>({
    height: 0,
    weight: 0,
    muscularMass: 0,
    fatMass: 0,
    visceralFat: 0,
    metabolicAge: 0,
    boneMass: 0,
    pailerTest: 0
  });

  // Variables morfológicas y pesos
  const [variables, setVariables] = useState<MorphologicalVariable[]>([]);
  const [weights, setWeights] = useState<MorphologicalVariablesWeight[]>([]);
  const [measurementResults, setMeasurementResults] = useState<MeasurementResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // IDs de las variables Altura y Peso para referencia directa
  const [heightVarId, setHeightVarId] = useState<string | null>(null);
  const [weightVarId, setWeightVarId] = useState<string | null>(null);
  const [imcVarId, setImcVarId] = useState<string | null>(null);

  // Después de los estados de heightVarId y weightVarId
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  // useEffect para sincronizar inputs cuando lleguen los resultados o cambien
  useEffect(() => {
    const hRes = heightVarId ? measurementResults.find(r => r.variable.id === heightVarId) : undefined;
    if (hRes && hRes.value !== heightInput) {
      setHeightInput(hRes.value);
    }

    const wRes = weightVarId ? measurementResults.find(r => r.variable.id === weightVarId) : undefined;
    if (wRes && wRes.value !== weightInput) {
      setWeightInput(wRes.value);
    }
  }, [measurementResults, heightVarId, weightVarId]);

  const [attachedDocs, setAttachedDocs] = useState<{
    medicalCertificate?: { id: string; path: string; };
    consentForm?: { id: string; path: string; };
  }>({});
  const [isUpdatingDoc, setIsUpdatingDoc] = useState<string | null>(null);
  const [sportsHistoryLoaded, setSportsHistoryLoaded] = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  // Postulación activa cargada para el atleta
  const [activePostulation, setActivePostulation] = useState<any | null>(null);

  // Estado para saber si ya existen medidas y evitar parpadeos en botón
  const [hasMeasures, setHasMeasures] = useState<boolean | null>(null);

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

  // Reset flag when modal toggles
  useEffect(() => {
    if (!isModalOpen) {
      setResultsLoaded(false);
    }
  }, [isModalOpen]);

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
        // Detectar variable IMC
        const imcVar = vars.find(v => /imc/i.test(v.name));
        setImcVarId(imcVar?.id || null);

        // Excluir variable IMC del listado editable, ya que se calcula automáticamente
        const filteredVars = vars.filter(v => v.id !== imcVar?.id);
        setVariables(filteredVars);
        setWeights(wts);
        
        // Inicializar resultados
        const initialResults = filteredVars.map(variable => ({
          variable,
          value: '',
          isValid: false,
          score: null,
        }));
        setMeasurementResults(initialResults);

        // Detectar variables clave y almacenar sus IDs para uso futuro
        const findIdByPattern = (vars: MorphologicalVariable[], pattern: RegExp): string | null => {
          const found = vars.find(v => pattern.test(v.name.toLowerCase()));
          return found ? found.id : null;
        };

        const heightId = findIdByPattern(filteredVars, /(altura|estatura|talla|height|longitud)/) ||
                         filteredVars.find(v => v.unit?.toLowerCase() === 'cm')?.id || null;
        const weightId = findIdByPattern(filteredVars, /\bpeso\b/) ||
                         filteredVars.find(v => v.unit?.toLowerCase() === 'kg' && /peso/i.test(v.name))?.id || null;

        setHeightVarId(heightId);
        setWeightVarId(weightId);
      } catch (err) {
        console.error('Error cargando variables morfológicas:', err);
      }
    };

    fetchMorphologicalData();
  }, []);

  const calculateBMI = (height: number, weight: number): number => {
    if (height <= 0 || weight <= 0) return 0;
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
  };

  const getBMIColor = (bmi: number) => {
    if (bmi === 0 || Number.isNaN(bmi)) return 'text-gray-500';
    if (bmi < 18.5) return 'text-yellow-500'; // Bajo peso
    if (bmi < 25) return 'text-[#006837]';    // Normal
    if (bmi < 30) return 'text-orange-500';   // Sobrepeso
    return 'text-red-600';                    // Obesidad
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMeasurements(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const validateMeasurement = (value: number, variable: MorphologicalVariable): { isValid: boolean; score: number | null } => {
    if (!aspirant) return { isValid: false, score: null };

    // Caso especial: Potencia Aeróbica se considera válida con cualquier número positivo
    if (variable.name.toLowerCase().includes('potencia aeróbica')) {
      return {
        isValid: value > 0,
        score: null,
      };
    }

    const weightEntry = weights.find(w =>
      w.morphological_variable.id === variable.id &&
      w.gender.name.toLowerCase().startsWith((aspirant.gender || '').charAt(0)) &&
      (!aspirant.discipline || w.sport.name.toLowerCase() === aspirant.discipline.toLowerCase()) &&
      value >= w.min_value && value <= w.max_value
    );

    return {
      isValid: !!weightEntry,
      score: weightEntry?.score || null,
    };
  };

  const sanitizeValue = (v: string): string => {
    // Permite solo dígitos y un punto
    let value = v.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    return value;
  };

  const handleMeasurementChange = (variableId: string, rawValue: string) => {
    const sanitized = sanitizeValue(rawValue);
    setMeasurementResults(prev => prev.map(result => {
      if (result.variable.id !== variableId) return result;

      // Calcular validación sólo si existe un número válido
      const numeric = parseFloat(sanitized);
      const hasNumber = !Number.isNaN(numeric);
      const { isValid, score } = hasNumber ? validateMeasurement(numeric, result.variable) : { isValid: false, score: null };

      return {
        ...result,
        value: sanitized,
        isValid,
        score,
      };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspirant) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const post = activePostulation;
      if (!post) {
        setSubmitError('No se encontró postulación activa para el atleta');
        return;
      }

      const basePayload: VariableResultPayload[] = measurementResults
        .map(res => ({ id: res.variable.id, numeric: parseFloat(res.value) }))
        .filter(r => !Number.isNaN(r.numeric))
        .map(r => ({
          morphological_variable_id: r.id,
          result: r.numeric,
        }));

      // Calcular IMC si corresponde
      let finalPayload = basePayload;
      if (imcVarId) {
        const h = parseFloat(heightInput);
        const w = parseFloat(weightInput);
        if (!Number.isNaN(h) && !Number.isNaN(w) && h > 0) {
          const bmi = Number(((w)/( (h/100)*(h/100))).toFixed(2));
          finalPayload = [...basePayload, { morphological_variable_id: imcVarId, result: bmi }];
        }
      }

      if (finalPayload.length === 0) {
        setSubmitError('Debe ingresar al menos una medida');
        return;
      }

      // Verificar si ya existen resultados
      let existing: any[] = [];
      try {
        const rawExisting = await morphologicalService.getVariableResults(post.id);
        existing = (rawExisting as any[]).filter(r => r.postulation?.id === post.id && r.postulation?.athlete?.id === aspirant.id);
        console.log('[Details] Medidas existentes filtradas:', existing);
        if (existing.length > 0) {
          setSubmitError('Las medidas ya fueron registradas para esta postulación');
          return;
        }
      } catch (err: any) {
        // Si el backend responde 400 (p.ej. sin registros) continuamos, cualquier otro error se loguea
        if (err?.response?.status !== 400) {
          console.warn('[Details] Error consultando medidas existentes:', err);
        }
      }

      await morphologicalService.createVariableResults(post.id, finalPayload);
      setAspirant(prev => prev ? { ...prev, evaluated: true } : prev);
    setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando resultados morfológicos:', err);
      setSubmitError('Error al guardar las medidas. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalScore = () => {
    return measurementResults.reduce((total, result) => total + (result.score || 0), 0);
  };

  const formatUnit = (unit: string): string => {
    if (unit === 'ml/kg/min^{-1}') return 'ml/kg/min';
    if (unit === 'Kg/m^{2}') return 'kg/m²';
    return unit;
  };

  const uploadsBase = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/`;

  const fetchPostulationForAthlete = async (athleteId: string) => {
    console.log('[Details] Intentando obtener postulación activa mediante athletesService');
    let post: any = await athletesService.getActivePostulation(athleteId);
    if (post) {
      console.log('[Details] Postulación activa encontrada (athletesService):', post.id);
      return post;
    }
    console.log('[Details] No se encontró postulación activa con athletesService, probando postulationService');
    try {
      const posts = await postulationService.getPostulationsByAthlete(athleteId);
      console.log('[Details] Lista de postulaciones obtenida:', posts);
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
        console.log('[Details] Postulación seleccionada:', post.id, 'status:', post.status);
      } else {
        console.warn('[Details] El atleta no tiene postulaciones registradas.');
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
        console.log('[Details] Cargando historial deportivo para aspirante:', aspirant?.id);
        // Usar la postulación ya obtenida
        const post = activePostulation;
        console.log('[Details] Postulación activa:', post);
        if (!post) return;

        console.log('[Details] Obteniendo detalles de postulación:', post.id);
        const postulation = await postulationService.getPostulationById(post.id);
        console.log('[Details][DEBUG] Postulación recibida:', postulation);
        console.log('[Details] Deportes en postulación:', postulation.postulation_sports);

        // Actualizar la postulación activa para que contenga los documentos adjuntos completos
        setActivePostulation(postulation);

        // Obtener documentos adjuntos relacionados a logros para enlazar certificados
        let docsByAchievement: Record<string, string> = {};
        try {
          const allDocs = await attachedDocumentsService.getDocuments();
          console.log('[Details][DEBUG] Documentos recuperados total (attached-documents):', allDocs.length, allDocs);
          docsByAchievement = allDocs
            .filter((d: any) => /(achievement)/i.test(d.reference_type))
            .reduce((acc: any, d: any) => {
              acc[d.reference_id] = d.file_path || d.file_name || '';
              return acc;
            }, {});
          console.log('[Details] Mapeo docsByAchievement:', docsByAchievement);
        } catch (err) {
          console.warn('[Details] No se pudieron cargar documentos adjuntos para logros:', err);
        }

        // Formatear historial deportivo a partir de postulation_sports y sus logros
        const formattedHistory: SportHistoryItem[] = [];
        const seenAch = new Set<string>();
        const sportMap: Record<string, number> = {}; // to accumulate years max
        (postulation.postulation_sports || []).forEach((ps: any) => {
          if (!ps.postulation_sport_achievements || ps.postulation_sport_achievements.length === 0) return;
          const sportName = ps.sport?.name || '';
          const yearsExp = ps.experience_years ?? 0;
          console.log('[Details] Procesando deporte:', sportName, 'con', ps.postulation_sport_achievements?.length || 0, 'logros');

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
            console.log('[Details] Certificado mapeado:', certUrl);

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
        setSportsHistoryLoaded(true);
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
        console.log('[Details] Cargando documentos adjuntos para aspirante:', aspirant.id);
        // Obtener la postulación activa
        const post = activePostulation;
        console.log('[Details] Postulación activa para documentos:', post);
        if (!post) return;

        // Si la postulación ya contiene los documentos, usarlos directamente. Evita llamada extra al servicio.
        let postulationDocs: any[] = post.attached_documents && post.attached_documents.length
          ? post.attached_documents
          : [];

        if (postulationDocs.length === 0) {
          // Fallback: obtener todos los documentos adjuntos y filtrar
          const allDocs = await attachedDocumentsService.getDocuments();
          console.log('[Details][DEBUG] Total docs recuperados (attached-documents):', allDocs.length);

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
        setDocsLoaded(true);
      } catch (err) {
        console.error('[Details] Error cargando documentos adjuntos:', err);
      }
    };

    loadAttachedDocuments();
  }, [aspirant, activePostulation]);

  // Hook para precargar los resultados de variables (medidas) cuando el modal se abre
  useEffect(() => {
    const loadVariableResults = async () => {
      if (!isModalOpen || resultsLoaded || !aspirant) return;

      try {
        console.log('[Details] Intentando cargar mediciones previas...');
        const post = activePostulation;
        if (!post) {
          console.warn('[Details] Sin postulación activa, no se cargan medidas.');
          return;
        }

        const prevAll = await morphologicalService.getVariableResults(post.id);
        const meaningful = (prevAll as any[] || []).filter(r => (r.postulation?.id === post.id) && r.result !== null && r.result !== undefined);
        console.log('[Details] Resultados previos de variables filtrados:', meaningful);

        if (meaningful.length > 0) {
          // Mapear resultados ...
          setMeasurementResults(current => current.map(r => {
            const found = meaningful.find(p => (p.morphological_variable_id ?? p.morphological_variable?.id) === r.variable.id);
            return found ? { ...r, value: String(found.result), isValid: true } : r;
          }));

          // Sincronizar inputs de altura y peso
          const hRes = meaningful.find(p => (p.morphological_variable_id ?? p.morphological_variable?.id) === heightVarId);
          const wRes = meaningful.find(p => (p.morphological_variable_id ?? p.morphological_variable?.id) === weightVarId);
          if (hRes) setHeightInput(String(hRes.result));
          if (wRes) setWeightInput(String(wRes.result));

          // Marcar como evaluado si aún no lo estaba
          setAspirant(prevAsp => prevAsp ? { ...prevAsp, evaluated: true } : prevAsp);
        }

        setResultsLoaded(true);
      } catch (err) {
        console.error('[Details] Error al cargar mediciones previas:', err);
      }
    };

    loadVariableResults();
  }, [isModalOpen, resultsLoaded, aspirant, activePostulation]);

  const handleDocumentAction = async (docId: string, action: 'approve' | 'reject') => {
    if (!docId) return;
    
    setIsUpdatingDoc(docId);
    try {
      await attachedDocumentsService.updateDocument(docId, {
        status: action === 'approve' ? 'Completado' : 'Cancelado'
      });
      
      // Recargar documentos para reflejar el cambio
      if (!aspirant?.id) return;
      const post = activePostulation;
      if (post) {
        const allDocs = await attachedDocumentsService.getDocuments();
        const postulationDocs = allDocs.filter(doc => 
          (doc.postulation?.id === post.id) ||
          doc.postulation_id === post.id ||
          (doc.reference_id === post.id && doc.reference_type === 'postulation')
        );

        const medicalCert = postulationDocs.find(doc => (doc.document_type_id === '2') || (doc.attachedDocumentType?.id === '2'));
        const consentForm = postulationDocs.find(doc => (doc.document_type_id === '3') || (doc.attachedDocumentType?.id === '3'));

        setAttachedDocs({
          medicalCertificate: medicalCert ? { id: medicalCert.id, path: (medicalCert.path || medicalCert.file_path) } : undefined,
          consentForm: consentForm ? { id: consentForm.id, path: (consentForm.path || consentForm.file_path) } : undefined,
        });
      }
    } catch (err) {
      console.error('Error actualizando documento:', err);
    } finally {
      setIsUpdatingDoc(null);
    }
  };

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

  // Effect to fetch postulation once aspirant is loaded
  useEffect(() => {
    const obtainPostulation = async () => {
      if (!aspirant || postulationFetchedRef.current) return; // ya intentado
      const post = await fetchPostulationForAthlete(aspirant.id);
      setActivePostulation(post);
      setHasMeasures(null); // reiniciar mientras se verifica
      postulationFetchedRef.current = true;
    };

    obtainPostulation();
  }, [aspirant, activePostulation]);

  // Detectar si la postulación ya tiene medidas cargadas para mostrar el botón correcto
  useEffect(() => {
    const checkExistingMeasurements = async () => {
      if (!aspirant || !activePostulation) return;

      try {
        const results = await morphologicalService.getVariableResults(activePostulation.id);
        const meaningful = (results as any[]).filter(r => r.postulation?.id === activePostulation.id && r.result !== null && r.result !== undefined);
        const has = meaningful.length > 0;
        setHasMeasures(has);
        if (has) {
          setAspirant(prev => prev ? { ...prev, evaluated: true } : prev);
        }
      } catch (err) {
        console.warn('[Details] No se pudieron verificar medidas existentes:', err);
      }
    };

    checkExistingMeasurements();
  }, [aspirant, activePostulation]);

  // Cargar puntajes cuando tengamos postulación activa
  useEffect(() => {
    const loadScores = async () => {
      if (!activePostulation?.id) return;
      try {
        const [sport, morpho] = await Promise.all([
          sportsService.getPostulationSportScore(activePostulation.id),
          morphologicalService.getPostulationScore(activePostulation.id),
        ]);
        setSportsScore(sport);
        setMorphoScore(morpho);
      } catch (err) {
        console.error('[Details] Error cargando puntajes:', err);
      }
    };
    loadScores();
  }, [activePostulation?.id]);

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

  const renderMeasurementsModal = () => {
    if (!isModalOpen) return null;

    // Agrupar variables por categoría
    const groupedVariables = measurementResults.reduce((acc, result) => {
      const category = result.variable.name.toLowerCase().includes('masa') ? 'Composición Corporal' :
                      result.variable.name.toLowerCase().includes('test') ? 'Tests' :
                      'Medidas Básicas';
      if (!acc[category]) acc[category] = [];
      acc[category].push(result);
      return acc;
    }, {} as Record<string, MeasurementResult[]>);

    // --- Funciones helper para localizar estatura y peso de forma fiable ---
    const getHeightResult = () =>
      heightVarId ? measurementResults.find(r => r.variable.id === heightVarId) : undefined;

    const getWeightResult = () =>
      weightVarId ? measurementResults.find(r => r.variable.id === weightVarId) : undefined;

    const alturaResult = getHeightResult();
    const pesoResult   = getWeightResult();

    // Palabras clave para filtrar cuando se muestran las otras medidas
    const heightKeywords = ['altura', 'estatura', 'talla', 'height', 'longitud'];
    const weightKeywords = ['peso'];

    const alturaStr = heightInput;
    const pesoStr = weightInput;
    const altura = parseFloat(alturaStr);
    const peso = parseFloat(pesoStr);
    const imc = (!Number.isNaN(altura) && !Number.isNaN(peso)) ? calculateBMI(altura, peso) : 0;

    // Función para obtener el icono según la variable
    const getVariableIcon = (variableName: string) => {
      const name = variableName.toLowerCase();
      if (name.includes('altura')) return <ArrowUp className="text-[#006837]" size={20} />;
      if (name.includes('peso')) return <Weight className="text-[#006837]" size={20} />;
      if (name.includes('masa muscular')) return <Activity className="text-[#006837]" size={20} />;
      if (name.includes('grasa')) return <Percent className="text-[#006837]" size={20} />;
      if (name.includes('visceral')) return <Heart className="text-[#006837]" size={20} />;
      if (name.includes('metabólica')) return <Clock className="text-[#006837]" size={20} />;
      if (name.includes('ósea')) return <Bone className="text-[#006837]" size={20} />;
      if (name.includes('test')) return <TestTube className="text-[#006837]" size={20} />;
      return <Ruler className="text-[#006837]" size={20} />;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Ruler className="text-[#006837]" size={24} />
                Registro de Medidas Físicas
              </h2>
              <p className="text-gray-600 mt-1">Complete las medidas del aspirante según los rangos establecidos</p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección de Medidas Básicas */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Scale className="text-[#006837]" size={20} />
                Medidas Básicas
              </h3>

              {/* Inputs específicos para peso y estatura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <ArrowUp className="text-[#006837]" size={20} />
                    <span className="font-medium text-gray-700">Estatura</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={alturaStr}
                      onChange={(e) => {
                        const val = sanitizeValue(e.target.value);
                        setHeightInput(val);
                        if (heightVarId) {
                          handleMeasurementChange(heightVarId, val);
                        } else {
                          const v = measurementResults.find(r => /(altura|estatura|talla|height|longitud)/.test(r.variable.name.toLowerCase()));
                          if (v) handleMeasurementChange(v.variable.id, val);
                        }
                      }}
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all font-medium"
                      placeholder="Ingrese la estatura"
                    />
                    <span className="text-gray-500 min-w-[40px] font-medium">cm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Weight className="text-[#006837]" size={20} />
                    <span className="font-medium text-gray-700">Peso</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pesoStr}
                      onChange={(e) => {
                        const val = sanitizeValue(e.target.value);
                        setWeightInput(val);
                        if (weightVarId) {
                          handleMeasurementChange(weightVarId, val);
                        } else {
                          const v = measurementResults.find(r => /\bpeso\b/.test(r.variable.name.toLowerCase()) && !/(muscular|grasa|visceral|ósea|osea|masa)/.test(r.variable.name.toLowerCase()));
                          if (v) handleMeasurementChange(v.variable.id, val);
                        }
                      }}
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all font-medium"
                      placeholder="Ingrese el peso"
                    />
                    <span className="text-gray-500 min-w-[40px] font-medium">kg</span>
                  </div>
                </div>
              </div>

              {/* Cálculo automático del IMC */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <Scale className="text-[#006837]" size={20} />
                      Índice de Masa Corporal (IMC)
                    </h4>
                    <p className="text-sm text-gray-500">Calculado automáticamente</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-bold ${getBMIColor(imc)}`}>
                      {imc.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1 font-medium">kg/m²</span>
                  </div>
                </div>
              </div>

              {/* Resto de medidas básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {groupedVariables['Medidas Básicas']?.filter(result => 
                  !heightKeywords.some(k => result.variable.name.toLowerCase().includes(k)) &&
                  !weightKeywords.some(k => result.variable.name.toLowerCase().includes(k))
                ).map((result) => (
                  <div key={result.variable.id} className="space-y-2">
                    <label className="flex items-center gap-2">
                      {getVariableIcon(result.variable.name)}
                      <span className="font-medium text-gray-700">{result.variable.name}</span>
                      {result.isValid && <CheckCircle className="text-green-500" size={16} />}
                      {!result.isValid && result.value.length > 0 && <XCircle className="text-red-500" size={16} />}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={result.value}
                        onChange={(e) => handleMeasurementChange(result.variable.id, sanitizeValue(e.target.value))}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all font-medium ${
                          result.isValid ? 'border-green-500' : result.value.length > 0 ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`Ingrese ${result.variable.name.toLowerCase()}`}
                      />
                      <span className="text-gray-500 min-w-[40px] font-medium">{formatUnit(result.variable.unit || '')}</span>
                    </div>
                    {!result.isValid && result.value.length > 0 && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <XCircle size={14} />
                        Valor fuera del rango permitido
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de Composición Corporal */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="text-[#006837]" size={20} />
                Composición Corporal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedVariables['Composición Corporal']?.map((result) => (
                  <div key={result.variable.id} className="space-y-2">
                    <label className="flex items-center gap-2">
                      {getVariableIcon(result.variable.name)}
                      <span className="font-medium text-gray-700">{result.variable.name}</span>
                      {result.isValid && <CheckCircle className="text-green-500" size={16} />}
                      {!result.isValid && result.value.length > 0 && <XCircle className="text-red-500" size={16} />}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={result.value}
                        onChange={(e) => handleMeasurementChange(result.variable.id, sanitizeValue(e.target.value))}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all font-medium ${
                          result.isValid ? 'border-green-500' : result.value.length > 0 ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`Ingrese ${result.variable.name.toLowerCase()}`}
                      />
                      <span className="text-gray-500 min-w-[40px] font-medium">{formatUnit(result.variable.unit || '')}</span>
                    </div>
                    {!result.isValid && result.value.length > 0 && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <XCircle size={14} />
                        Valor fuera del rango permitido
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de Tests */}
            {groupedVariables['Tests'] && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TestTube className="text-[#006837]" size={20} />
                  Tests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedVariables['Tests'].map((result) => (
                    <div key={result.variable.id} className="space-y-2">
                      <label className="flex items-center gap-2">
                        {getVariableIcon(result.variable.name)}
                        <span className="font-medium text-gray-700">{result.variable.name}</span>
                        {result.isValid && <CheckCircle className="text-green-500" size={16} />}
                        {!result.isValid && result.value.length > 0 && <XCircle className="text-red-500" size={16} />}
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={result.value}
                          onChange={(e) => handleMeasurementChange(result.variable.id, sanitizeValue(e.target.value))}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all font-medium ${
                            result.isValid ? 'border-green-500' : result.value.length > 0 ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder={`Ingrese ${result.variable.name.toLowerCase()}`}
                        />
                        <span className="text-gray-500 min-w-[40px] font-medium">{formatUnit(result.variable.unit || '')}</span>
                      </div>
                      {!result.isValid && result.value.length > 0 && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <XCircle size={14} />
                          Valor fuera del rango permitido
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="text-red-500" size={20} />
                <p className="text-red-700">{submitError}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between items-center pt-6 border-t gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <XCircle size={20} />
                Cancelar
              </button>
              <div className="space-y-1 text-center sm:text-center flex-1">
                <p className="text-sm text-gray-500">Puntaje Total</p>
                <p className="text-3xl font-extrabold text-[#006837]">{getTotalScore()}</p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`ml-auto px-6 py-2.5 bg-[#006837] text-white rounded-lg hover:bg-[#005128] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Guardar Medidas
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
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
            onClick={() => setIsModalOpen(true)}
            className="bg-[#006837] text-white px-4 py-2 rounded-xl hover:bg-[#005828] transition-colors flex items-center gap-2"
          >
            <Ruler size={20} />
            {hasMeasures === null ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : hasMeasures ? 'Editar Medidas' : 'Registrar Medidas'}
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