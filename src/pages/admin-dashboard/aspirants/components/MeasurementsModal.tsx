import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Ruler, 
  XCircle,
  Scale,
  Activity,
  Weight,
  ArrowUp,
  Calculator,
  Save,
  User,
  AlertTriangle,
  Heart,
  Bone,
  Droplet,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MorphologicalVariable {
  id: string;
  name: string;
  unit: string;
  description?: string;
}

interface MorphologicalVariablesWeight {
  id: string;
  morphological_variable: MorphologicalVariable;
  gender: { id: string; name: string; };
  sport: { id: string; name: string; };
  min_value: number;
  max_value: number;
  score: number;
}

export interface MeasurementData {
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

export interface MeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspirant: any;
  onSubmit: (data: MeasurementData) => Promise<void>;
  variables: MorphologicalVariable[];
  weights: MorphologicalVariablesWeight[];
  initialData?: Partial<MeasurementData>;
}

export const MeasurementsModal = memo(({ 
  isOpen, 
  onClose, 
  aspirant,
  onSubmit,
  variables,
  weights,
  initialData
}: MeasurementsModalProps) => {
  // Ref para evitar el parpadeo al cargar datos iniciales
  const initialDataLoadedRef = React.useRef(false);
  
  // Estados para variables de INGRESO MANUAL
  const [estatura, setEstatura] = useState<string>('');
  const [pesoCorporal, setPesoCorporal] = useState<string>('');
  const [velocidad, setVelocidad] = useState<string>(''); // Nueva: velocidad para calcular VO2 MAX
  
  // Estados para variables CALCULADAS (desde bioimpedancia)
  const [masaMuscular, setMasaMuscular] = useState<string>('');
  const [grasaVisceral, setGrasaVisceral] = useState<string>('');
  const [masaOsea, setMasaOsea] = useState<string>('');
  const [edadMetabolica, setEdadMetabolica] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalculated, setShowCalculated] = useState(false);

  // ============ CÁLCULOS AUTOMÁTICOS ============
  
  // 1. Calcular IMC automáticamente
  const calculateBMI = useCallback((heightCm: number, weightKg: number): number => {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
  }, []);

  const imc = useMemo(() => {
    return calculateBMI(parseFloat(estatura) || 0, parseFloat(pesoCorporal) || 0);
  }, [estatura, pesoCorporal, calculateBMI]);

  // 2. Calcular VO2 MAX automáticamente desde la velocidad
  // Fórmula: VO2 Max = 5,857 x Velocidad (Km/h) – 19,458
  const calculateVO2Max = useCallback((velocidadKmh: number): number => {
    if (velocidadKmh <= 0) return 0;
    const vo2 = 5.857 * velocidadKmh - 19.458;
    // Asegurar que no sea negativo y redondear a 2 decimales
    return parseFloat(Math.max(0, vo2).toFixed(2));
  }, []);

  const potenciaAerobica = useMemo(() => {
    return calculateVO2Max(parseFloat(velocidad) || 0);
  }, [velocidad, calculateVO2Max]);

  // 3. Calcular Masa Grasa automáticamente (Peso - Masa Muscular)
  const masaGrasa = useMemo(() => {
    const peso = parseFloat(pesoCorporal) || 0;
    const muscular = parseFloat(masaMuscular) || 0;
    if (peso > 0 && muscular > 0 && muscular < peso) {
      return parseFloat((peso - muscular).toFixed(2));
    }
    return 0;
  }, [pesoCorporal, masaMuscular]);

  // Efecto para mostrar sección calculada cuando hay datos básicos
  useEffect(() => {
    if (estatura && pesoCorporal) {
      setShowCalculated(true);
    }
  }, [estatura, pesoCorporal]);

  // Sincronizar con valores iniciales SOLO UNA VEZ para evitar parpadeo
  useEffect(() => {
    if (initialData && !initialDataLoadedRef.current) {
      console.log('[] Cargando datos iniciales en modal:', initialData);
      
      if (initialData.estatura !== undefined) setEstatura(String(initialData.estatura));
      if (initialData.pesoCorporal !== undefined) setPesoCorporal(String(initialData.pesoCorporal));
      if (initialData.masaMuscular !== undefined) setMasaMuscular(String(initialData.masaMuscular));
      if (initialData.grasaVisceral !== undefined) setGrasaVisceral(String(initialData.grasaVisceral));
      if (initialData.masaOsea !== undefined) setMasaOsea(String(initialData.masaOsea));
      if (initialData.edadMetabolica !== undefined) setEdadMetabolica(String(initialData.edadMetabolica));
      
      // Si existe potenciaAerobica, calcular velocidad inversa
      // Fórmula inversa: Velocidad = (VO2 Max + 19.458) / 5.857
      if (initialData.potenciaAerobica !== undefined && initialData.potenciaAerobica > 0) {
        const velocidadCalculada = (initialData.potenciaAerobica + 19.458) / 5.857;
        setVelocidad(velocidadCalculada.toFixed(2));
      }
      
      // Marcar como cargado para evitar re-cargas
      initialDataLoadedRef.current = true;
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const estaturaNum = parseFloat(estatura);
    const pesoCorporalNum = parseFloat(pesoCorporal);
    const velocidadNum = parseFloat(velocidad);
    const masaMuscularNum = parseFloat(masaMuscular);
    const grasaVisceralNum = parseFloat(grasaVisceral);
    const edadMetabolicaNum = parseFloat(edadMetabolica);
    const masaOseaNum = parseFloat(masaOsea);

    const newErrors: Record<string, string> = {};

    // Validaciones - INGRESO MANUAL
    if (!estaturaNum || estaturaNum <= 0) {
      newErrors.estatura = 'La estatura es obligatoria';
    } else if (estaturaNum < 100 || estaturaNum > 250) {
      newErrors.estatura = 'La estatura debe estar entre 100 y 250 cm';
    }

    if (!pesoCorporalNum || pesoCorporalNum <= 0) {
      newErrors.pesoCorporal = 'El peso corporal es obligatorio';
    } else if (pesoCorporalNum < 30 || pesoCorporalNum > 200) {
      newErrors.pesoCorporal = 'El peso debe estar entre 30 y 200 kg';
    }

    if (!velocidadNum || velocidadNum <= 0) {
      newErrors.velocidad = 'La velocidad es obligatoria';
    } else if (velocidadNum < 5 || velocidadNum > 25) {
      newErrors.velocidad = 'La velocidad debe estar entre 5 y 25 km/h';
    }
    
    // Validar que el VO2 calculado esté en rango razonable
    if (potenciaAerobica < 10 || potenciaAerobica > 100) {
      newErrors.velocidad = 'La velocidad ingresada genera un VO₂máx fuera de rango (10-100 ml/kg/min)';
    }

    // Validaciones - DATOS DE BIOIMPEDANCIA
    if (!masaMuscularNum || masaMuscularNum <= 0) {
      newErrors.masaMuscular = 'Ingrese el valor de bioimpedancia';
    } else if (masaMuscularNum >= pesoCorporalNum) {
      newErrors.masaMuscular = 'La masa muscular debe ser menor al peso total';
    }

    if (!grasaVisceralNum || grasaVisceralNum < 0) {
      newErrors.grasaVisceral = 'Ingrese el valor del dispositivo';
    }

    if (!masaOseaNum || masaOseaNum <= 0) {
      newErrors.masaOsea = 'Ingrese el valor estimado';
    }

    if (!edadMetabolicaNum || edadMetabolicaNum <= 0) {
      newErrors.edadMetabolica = 'Ingrese la edad metabólica calculada';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      
      console.log('[] Guardando medidas con VO2 calculado:', potenciaAerobica);
      
      await onSubmit({
        estatura: estaturaNum,
        pesoCorporal: pesoCorporalNum,
        imc: imc,
        masaMuscular: masaMuscularNum,
        masaGrasa: masaGrasa,
        grasaVisceral: grasaVisceralNum,
        edadMetabolica: edadMetabolicaNum,
        masaOsea: masaOseaNum,
        potenciaAerobica: potenciaAerobica // Usar el valor calculado desde velocidad
      });
      
      onClose();
    } catch (error) {
      console.error('Error al guardar medidas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBMIStatus = (bmiValue: number) => {
    if (bmiValue < 18.5) return { label: 'Bajo peso', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (bmiValue < 25) return { label: 'Normal', color: 'text-green-600 bg-green-50 border-green-200' };
    if (bmiValue < 30) return { label: 'Sobrepeso', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { label: 'Obesidad', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const bmiStatus = getBMIStatus(imc);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-[#006837] to-[#00a65a] text-white p-8">
            <div className="flex justify-between items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Ruler className="w-6 h-6" />
                  </div>
                  Variables Morfofuncionales
                </h2>
                <p className="text-white/90 text-lg">
                  {aspirant?.personalInfo?.firstName} {aspirant?.personalInfo?.lastName}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                    <User className="w-4 h-4" />
                    {aspirant?.gender}
                  </span>
                  <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                    <Activity className="w-4 h-4" />
                    {aspirant?.discipline}
                  </span>
                </div>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <XCircle size={24} />
              </motion.button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-250px)]">
            
            {/* SECCIÓN 1: MEDIDAS BÁSICAS (Manual) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#006837]/10 rounded-xl">
                  <Scale className="w-6 h-6 text-[#006837]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Medidas Antropométricas Básicas</h3>
                  <p className="text-sm text-gray-500">Valores medidos directamente</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Estatura */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="estatura">
                    <ArrowUp className="w-4 h-4 text-[#006837]" />
                    Estatura
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.1"
                      id="estatura"
                      value={estatura}
                      onChange={(e) => setEstatura(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 text-lg border-2 rounded-xl focus:ring-4 focus:ring-[#006837]/20 focus:border-[#006837] transition-all ${
                        errors.estatura 
                          ? 'border-red-500 bg-red-50' 
                          : estatura 
                            ? 'border-green-500 bg-green-50/50' 
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="175.5"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                      cm
                    </div>
                  </div>
                  {errors.estatura && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-red-600 text-sm flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {errors.estatura}
                    </motion.p>
                  )}
                </motion.div>

                {/* Peso Corporal */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="pesoCorporal">
                    <Weight className="w-4 h-4 text-[#006837]" />
                    Peso Corporal
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.1"
                      id="pesoCorporal"
                      value={pesoCorporal}
                      onChange={(e) => setPesoCorporal(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 text-lg border-2 rounded-xl focus:ring-4 focus:ring-[#006837]/20 focus:border-[#006837] transition-all ${
                        errors.pesoCorporal 
                          ? 'border-red-500 bg-red-50' 
                          : pesoCorporal 
                            ? 'border-green-500 bg-green-50/50' 
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="70.5"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                      kg
                    </div>
                  </div>
                  {errors.pesoCorporal && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-red-600 text-sm flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {errors.pesoCorporal}
                    </motion.p>
                  )}
                </motion.div>

                {/* Velocidad (para calcular VO2 MAX) */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="velocidad">
                    <TrendingUp className="w-4 h-4 text-[#006837]" />
                    Velocidad Test Course Navette
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.1"
                      id="velocidad"
                      value={velocidad}
                      onChange={(e) => setVelocidad(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 text-lg border-2 rounded-xl focus:ring-4 focus:ring-[#006837]/20 focus:border-[#006837] transition-all ${
                        errors.velocidad 
                          ? 'border-red-500 bg-red-50' 
                          : velocidad 
                            ? 'border-green-500 bg-green-50/50' 
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="12.5"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                      km/h
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Velocidad alcanzada en el test de Course Navette
                  </p>
                  {errors.velocidad && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-red-600 text-sm flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {errors.velocidad}
                    </motion.p>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Valores Calculados Automáticamente */}
            <AnimatePresence>
              {estatura && pesoCorporal && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-4"
                >
                  {/* IMC Calculado */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="p-3 bg-blue-100 rounded-xl"
                        >
                          <Calculator className="w-6 h-6 text-blue-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            IMC (Calculado)
                            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">Automático</span>
                          </h3>
                          <p className="text-sm text-gray-600">Índice de Masa Corporal</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.div
                          key={imc}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-4xl font-bold text-blue-600"
                        >
                          {imc.toFixed(2)}
                        </motion.div>
                        <div className="text-sm text-gray-500 font-medium">kg/m²</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className={`inline-flex px-4 py-2 rounded-full border-2 font-semibold ${bmiStatus.color}`}>
                        {bmiStatus.label}
                      </div>
                    </div>
                  </div>

                  {/* VO2 MAX Calculado */}
                  {velocidad && potenciaAerobica > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="p-3 bg-green-100 rounded-xl"
                          >
                            <Activity className="w-6 h-6 text-green-600" />
                          </motion.div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                              VO₂ Máx (Calculado)
                              <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">Automático</span>
                            </h3>
                            <p className="text-sm text-gray-600">Consumo Máximo de Oxígeno</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.div
                            key={potenciaAerobica}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-4xl font-bold text-green-600"
                          >
                            {potenciaAerobica.toFixed(2)}
                          </motion.div>
                          <div className="text-sm text-gray-500 font-medium">ml/kg/min</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <Info className="w-4 h-4" />
                        <span>Calculado desde velocidad: <strong>{parseFloat(velocidad).toFixed(2)} km/h</strong></span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* SECCIÓN 2: COMPOSICIÓN CORPORAL (Bioimpedancia) */}
            <AnimatePresence>
              {showCalculated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Análisis de Bioimpedancia</h3>
                      <p className="text-sm text-gray-500">Valores obtenidos del equipo de bioimpedancia eléctrica</p>
                    </div>
                  </div>

                  <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-200">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Masa Muscular */}
                      <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="masaMuscular">
                          <Activity className="w-4 h-4 text-purple-600" />
                          Masa Muscular
                          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full ml-auto">Del equipo</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            id="masaMuscular"
                            value={masaMuscular}
                            onChange={(e) => setMasaMuscular(e.target.value)}
                            className={`w-full px-4 py-3 pr-12 text-lg border-2 rounded-xl focus:ring-4 focus:ring-purple-600/20 focus:border-purple-600 transition-all ${
                              errors.masaMuscular ? 'border-red-500 bg-red-50' : masaMuscular ? 'border-purple-500 bg-purple-50/50' : 'border-gray-300'
                            }`}
                            placeholder="35.2"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">kg</div>
                        </div>
                        {errors.masaMuscular && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {errors.masaMuscular}
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Masa Grasa (Calculada) */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Droplet className="w-4 h-4 text-orange-600" />
                          Masa Grasa
                          <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full ml-auto">Calculada</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={masaGrasa || ''}
                            disabled
                            className="w-full px-4 py-3 text-lg border-2 rounded-xl bg-orange-50/50 border-orange-300 text-gray-700 cursor-not-allowed"
                            placeholder="Automático"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">kg</div>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Peso Corporal - Masa Muscular
                        </p>
                      </div>

                      {/* Grasa Visceral */}
                      <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="grasaVisceral">
                          <Heart className="w-4 h-4 text-red-600" />
                          Grasa Visceral
                          <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full ml-auto">Del equipo</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            id="grasaVisceral"
                            value={grasaVisceral}
                            onChange={(e) => setGrasaVisceral(e.target.value)}
                            className={`w-full px-4 py-3 pr-16 text-lg border-2 rounded-xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 transition-all ${
                              errors.grasaVisceral ? 'border-red-500 bg-red-50' : grasaVisceral ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
                            }`}
                            placeholder="8"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Score</div>
                        </div>
                        {errors.grasaVisceral && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {errors.grasaVisceral}
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Masa Ósea */}
                      <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="masaOsea">
                          <Bone className="w-4 h-4 text-gray-600" />
                          Masa Ósea
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-auto">Estimada</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            id="masaOsea"
                            value={masaOsea}
                            onChange={(e) => setMasaOsea(e.target.value)}
                            className={`w-full px-4 py-3 pr-12 text-lg border-2 rounded-xl focus:ring-4 focus:ring-gray-600/20 focus:border-gray-600 transition-all ${
                              errors.masaOsea ? 'border-red-500 bg-red-50' : masaOsea ? 'border-gray-500 bg-gray-50/50' : 'border-gray-300'
                            }`}
                            placeholder="3.2"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">kg</div>
                        </div>
                        {errors.masaOsea && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {errors.masaOsea}
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Edad Metabólica */}
                      <motion.div whileHover={{ scale: 1.02 }} className="space-y-3 md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="edadMetabolica">
                          <User className="w-4 h-4 text-indigo-600" />
                          Edad Metabólica
                          <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full ml-auto">Del algoritmo</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            id="edadMetabolica"
                            value={edadMetabolica}
                            onChange={(e) => setEdadMetabolica(e.target.value)}
                            className={`w-full px-4 py-3 pr-16 text-lg border-2 rounded-xl focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all ${
                              errors.edadMetabolica ? 'border-red-500 bg-red-50' : edadMetabolica ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-300'
                            }`}
                            placeholder="25"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">años</div>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Comparación del ritmo metabólico con valores promedio por edad
                        </p>
                        {errors.edadMetabolica && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {errors.edadMetabolica}
                          </motion.p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Footer con botones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors flex items-center gap-2 font-medium"
            >
              <XCircle size={20} />
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-[#006837] to-[#00a65a] hover:from-[#005229] hover:to-[#008347] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Medidas
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

MeasurementsModal.displayName = 'MeasurementsModal';

export default MeasurementsModal;
