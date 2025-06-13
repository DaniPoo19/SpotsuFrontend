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
  TestTube
} from 'lucide-react';
import { mockAspirants } from '../data';
import { aspirantsService } from '@/services/aspirants.service';
import { AspirantDTO } from '@/types/dtos';
import { AspirantStatus } from '../components/common/AspirantStatus';
import { Aspirant } from '@/types';
import { morphologicalService, MorphologicalVariable, MorphologicalVariablesWeight, VariableResultPayload } from '@/services/morphological.service';
import { athletesService } from '@/services/athletes.service';
import { api } from '@/lib/axios';

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
        // Excluir variable IMC del listado editable, ya que se calcula automáticamente
        const filteredVars = vars.filter(v => !v.name.toLowerCase().includes('imc'));
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

        setHeightVarId(findIdByPattern(filteredVars, /(altura|estatura|talla|height|longitud)/));
        setWeightVarId(findIdByPattern(filteredVars, /\bpeso\b/));
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
      /* 1) Obtener semestre activo */
      const semesterResp = await api.get('/semesters/active');
      const activeSemester = semesterResp.data?.data;

      if (!activeSemester) {
        setSubmitError('No hay semestre activo configurado.');
        return;
      }

      /* 2) Obtener postulaciones del atleta y buscar la vigente para el semestre activo */
      const postulations = await athletesService.getPostulations(aspirant.id);
      let activePostulation = postulations.find((p: any) => p.semester?.id === activeSemester.id);

      /* 3) Si no existe, crear una nueva postulación */
      if (!activePostulation) {
        try {
          const createResp = await api.post('/postulations', {
            athlete_id: aspirant.id,
            semester_id: activeSemester.id,
            status: 'active',
          });
          activePostulation = createResp.data?.data;
        } catch (creationErr) {
          console.error('Error creando postulación:', creationErr);
          setSubmitError('No se pudo crear una postulación para el atleta');
          return;
        }
      }

      if (!activePostulation) {
        setSubmitError('No se pudo obtener postulación para el atleta');
        return;
      }

      /* 4) Construir payload completo con todas las mediciones */
      const allPayload: VariableResultPayload[] = measurementResults
        .map(res => ({ id: res.variable.id, numeric: parseFloat(res.value) }))
        .filter(r => !Number.isNaN(r.numeric))
        .map(r => ({
          morphological_variable_id: r.id,
          result: r.numeric,
        }));

      if (allPayload.length === 0) {
        setSubmitError('Debe ingresar al menos una medida');
        return;
      }

      /* 5) Obtener resultados existentes para no duplicar */
      let existingVarIds: string[] = [];
      try {
        const postDetailsResp = await api.get(`/postulations/${activePostulation.id}`);
        existingVarIds = (postDetailsResp.data?.data?.morphological_variable_results || []).map((r: any) => r.morphological_variable?.id);
      } catch (err) {
        console.warn('No se pudo obtener detalles de postulación para filtrar duplicados:', err);
      }

      const payload: VariableResultPayload[] = allPayload.filter(v => !existingVarIds.includes(v.morphological_variable_id));

      if (payload.length === 0) {
        console.log('Todas las variables ya existen, no hay nada nuevo que guardar');
        setIsModalOpen(false);
        return;
      }

      /* 6) Enviar resultados al backend de forma individual */
      for (const variable of payload) {
        try {
          await morphologicalService.createVariableResult(activePostulation.id, variable);
        } catch (err: any) {
          // Si ya existe, ignoramos el error 400 (duplicado) y continuamos
          if (err?.response?.status === 400) {
            console.warn('Variable ya existía, se omite:', variable.morphological_variable_id);
            continue;
          }
          throw err;
        }
      }
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
            {aspirant.evaluated ? 'Editar Medidas' : 'Registrar Medidas'}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aspirant.sportsHistory.map((history, index): React.ReactNode => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{history.sport}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.years}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{history.competition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {history.certificate && (
                          <button className="text-[#006837] hover:text-[#A8D08D] font-medium flex items-center gap-1">
                            <Download size={16} />
                            Descargar
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => console.log('Aprobar certificado', index)}
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800"
                            onClick={() => console.log('Desaprobar certificado', index)}
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {renderMeasurementsModal()}
    </div>
  );
};