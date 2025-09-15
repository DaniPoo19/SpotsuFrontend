import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Ruler, 
  CheckCircle, 
  XCircle,
  Scale,
  Activity,
  Weight,
  ArrowUp,
  Calculator,
  Save,
  User,
  AlertTriangle
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

export interface MeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspirant: any;
  onSubmit: (data: { height: number; weight: number; bmi: number }) => Promise<void>;
  variables: MorphologicalVariable[];
  weights: MorphologicalVariablesWeight[];
  initialHeight?: number | string;
  initialWeight?: number | string;
}

export const MeasurementsModal = memo(({ 
  isOpen, 
  onClose, 
  aspirant,
  onSubmit,
  variables,
  weights,
  initialHeight,
  initialWeight
}: MeasurementsModalProps) => {
  const [height, setHeight] = useState<string>(initialHeight ? String(initialHeight) : '');
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});
  const [showPreview, setShowPreview] = useState(false);

  // Buscar variables específicas
  const heightVar = variables.find(v => 
    v.name.toLowerCase().includes('height') || 
    v.name.toLowerCase().includes('altura') || 
    v.name.toLowerCase().includes('estatura') ||
    v.name.toLowerCase().includes('talla')
  );
  
  const weightVar = variables.find(v => 
    v.name.toLowerCase().includes('weight') || 
    (v.name.toLowerCase().includes('peso') && !v.name.toLowerCase().includes('muscular'))
  );
  
  const bmiVar = variables.find(v => 
    v.name.toLowerCase().includes('imc') || 
    v.name.toLowerCase().includes('bmi') ||
    v.name.toLowerCase().includes('índice')
  );

  // Calcular IMC automáticamente
  const calculateBMI = useCallback((heightCm: number, weightKg: number): number => {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
  }, []);

  const bmi = calculateBMI(parseFloat(height) || 0, parseFloat(weight) || 0);

  // Validar rangos según los pesos morfológicos
  const validateMeasurement = useCallback((variable: MorphologicalVariable | undefined, value: number) => {
    if (!variable || !aspirant) return { isValid: true, score: 0, range: null };

    // Filtrar weights válidos antes de aplicar la lógica de validación
    const validWeights = weights.filter(w => 
      w && 
      w.morphological_variable && 
      w.gender && 
      w.sport
    );

    const applicableWeights = validWeights.filter(w => 
      w.morphological_variable?.id === variable.id &&
      w.gender?.name?.toLowerCase().startsWith((aspirant.gender || '').charAt(0).toLowerCase()) &&
      (!aspirant.discipline || w.sport?.name?.toLowerCase() === aspirant.discipline.toLowerCase())
    );

    // Buscar el rango que contiene el valor
    const matchingWeight = applicableWeights.find(w => 
      value >= w.min_value && value <= w.max_value
    );

    if (matchingWeight) {
      return {
        isValid: true,
        score: matchingWeight.score,
        range: { min: matchingWeight.min_value, max: matchingWeight.max_value }
      };
    }

    // Si no está en ningún rango, encontrar el más cercano para mostrar información
    const allRanges = applicableWeights.map(w => ({ min: w.min_value, max: w.max_value, score: w.score }));
    return {
      isValid: false,
      score: 0,
      range: allRanges.length > 0 ? allRanges[0] : null
    };
  }, [weights, aspirant]);

  const heightValidation = validateMeasurement(heightVar, parseFloat(height) || 0);
  const weightValidation = validateMeasurement(weightVar, parseFloat(weight) || 0);
  // Validación de BMI solo para estado visual, no se muestran puntuaciones

  // Sincronizar una sola vez con valores iniciales para evitar parpadeos
  useEffect(() => {
    if (initialHeight !== undefined && initialHeight !== null) {
      setHeight(String(initialHeight));
    }
    if (initialWeight !== undefined && initialWeight !== null) {
      setWeight(String(initialWeight));
    }
    // solo en el primer render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const newErrors: { height?: string; weight?: string } = {};

    // Validaciones
    if (!heightNum || heightNum <= 0) {
      newErrors.height = 'La estatura debe ser un número positivo';
    } else if (!heightValidation.isValid) {
      newErrors.height = `La estatura debe estar en el rango permitido`;
    }

    if (!weightNum || weightNum <= 0) {
      newErrors.weight = 'El peso debe ser un número positivo';
    } else if (!weightValidation.isValid) {
      newErrors.weight = `El peso debe estar en el rango permitido`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      
      await onSubmit({
        height: heightNum,
        weight: weightNum,
        bmi: bmi
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

  const bmiStatus = getBMIStatus(bmi);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#006837] to-[#00a65a] text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Ruler className="w-6 h-6" />
                  </div>
                  Registro de Medidas Antropométricas
                </h2>
                <p className="text-white/90 text-lg">
                  {aspirant?.personalInfo?.firstName} {aspirant?.personalInfo?.lastName}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {aspirant?.gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {aspirant?.discipline}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Medidas Principales */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Estatura */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <label className="flex items-center gap-3" htmlFor="height">
                  <div className="p-2 bg-[#006837]/10 rounded-xl">
                    <ArrowUp className="w-5 h-5 text-[#006837]" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-800">Estatura</span>
                    <p className="text-sm text-gray-500">Medida en centímetros</p>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    id="height"
                    name="height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-[#006837]/20 focus:border-[#006837] transition-all ${
                      errors.height 
                        ? 'border-red-500 bg-red-50' 
                        : heightValidation.isValid && height 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300'
                    }`}
                    placeholder="Ej: 175.5"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    cm
                  </div>
                </div>
                {errors.height && (
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.height}
                  </p>
                )}
                {height && heightValidation.range && (
                  <div className={`p-3 rounded-lg border ${heightValidation.isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className="text-sm font-medium">
                      Rango permitido: {heightValidation.range.min} - {heightValidation.range.max} cm
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Peso */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <label className="flex items-center gap-3" htmlFor="weight">
                  <div className="p-2 bg-[#006837]/10 rounded-xl">
                    <Weight className="w-5 h-5 text-[#006837]" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-800">Peso</span>
                    <p className="text-sm text-gray-500">Medida en kilogramos</p>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    id="weight"
                    name="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:ring-4 focus:ring-[#006837]/20 focus:border-[#006837] transition-all ${
                      errors.weight 
                        ? 'border-red-500 bg-red-50' 
                        : weightValidation.isValid && weight 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300'
                    }`}
                    placeholder="Ej: 70.5"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    kg
                  </div>
                </div>
                {errors.weight && (
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.weight}
                  </p>
                )}
                {weight && weightValidation.range && (
                  <div className={`p-3 rounded-lg border ${weightValidation.isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className="text-sm font-medium">
                      Rango permitido: {weightValidation.range.min} - {weightValidation.range.max} kg
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Cálculo Automático del IMC */}
            {height && weight && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Calculator className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Índice de Masa Corporal (IMC)</h3>
                      <p className="text-gray-600">Calculado automáticamente</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600">{bmi.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 font-medium">kg/m²</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`px-4 py-2 rounded-full border font-medium ${bmiStatus.color}`}>
                    {bmiStatus.label}
                  </div>
                </div>
                {/* Se elimina la visualización de fórmula/cálculo */}
              </motion.div>
            )}
            {/* Se elimina el resumen de puntuación y detalles de puntos */}
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors flex items-center gap-2"
            >
              <XCircle size={20} />
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !height || !weight || !heightValidation.isValid || !weightValidation.isValid}
              className="px-8 py-3 bg-gradient-to-r from-[#006837] to-[#00a65a] hover:from-[#005229] hover:to-[#008347] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Medidas
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

MeasurementsModal.displayName = 'MeasurementsModal';

export default MeasurementsModal;