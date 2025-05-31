import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Scale, 
  Ruler, 
  Activity, 
  Heart, 
  Clock, 
  Bone, 
  Timer,
  Info
} from 'lucide-react';
import { aspirantsService } from '../../services/aspirants.service';
import { toast } from 'sonner';

interface MorphologicalData {
  weight: number;
  height: number;
  bmi: number;
  muscleMass: number;
  fatMass: number;
  visceralFat: number;
  metabolicAge: number;
  boneMass: number;
  legerTest: number;
}

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: 'Bajo peso', color: 'text-blue-600' };
  if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
  if (bmi < 30) return { category: 'Sobrepeso', color: 'text-yellow-600' };
  return { category: 'Obesidad', color: 'text-red-600' };
};

export const MorphologicalEvaluationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aspirant, setAspirant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<MorphologicalData>({
    weight: 0,
    height: 0,
    bmi: 0,
    muscleMass: 0,
    fatMass: 0,
    visceralFat: 0,
    metabolicAge: 0,
    boneMass: 0,
    legerTest: 0
  });

  useEffect(() => {
    const loadAspirant = async () => {
      if (!id) return;
      try {
        const data = await aspirantsService.getById(id);
        setAspirant(data);
      } catch (error) {
        console.error('Error al cargar aspirante:', error);
        toast.error('Error al cargar los detalles del aspirante');
      } finally {
        setIsLoading(false);
      }
    };

    loadAspirant();
  }, [id]);

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);

    if (name === 'weight' || name === 'height') {
      const newData = {
        ...formData,
        [name]: numericValue
      };
      
      if (name === 'weight' || name === 'height') {
        newData.bmi = calculateBMI(
          name === 'weight' ? numericValue : formData.weight,
          name === 'height' ? numericValue : formData.height
        );
      }
      
      setFormData(newData);
    } else {
      setFormData({
        ...formData,
        [name]: numericValue
      });
    }
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    try {
      // Aquí iría la llamada al servicio para guardar los datos
      toast.success('Evaluación morfológica guardada exitosamente');
      navigate(`/dashboard/aspirants/${id}`);
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      toast.error('Error al guardar la evaluación');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  const bmiCategory = getBMICategory(formData.bmi);

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/dashboard/aspirants/${id}`)}
          className="flex items-center text-[#006837] hover:text-[#A8D08D]"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver a detalles
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Evaluación Morfológica</h2>
          {aspirant && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{aspirant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{aspirant.documentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sexo</p>
                  <p className="font-medium">{aspirant.gender}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Medidas Básicas */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scale className="text-[#006837]" />
              Medidas Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso corporal (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    step="0.1"
                    required
                  />
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estatura (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="height"
                    value={formData.height || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    required
                  />
                  <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMC
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="bmi"
                    value={formData.bmi.toFixed(2)}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                  <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {formData.bmi > 0 && (
                  <p className={`mt-1 text-sm ${bmiCategory.color}`}>
                    {bmiCategory.category}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Composición Corporal */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="text-[#006837]" />
              Composición Corporal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Muscular (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="muscleMass"
                    value={formData.muscleMass || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    step="0.1"
                    required
                  />
                  <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Grasa (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="fatMass"
                    value={formData.fatMass || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    step="0.1"
                    required
                  />
                  <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grasa Visceral
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="visceralFat"
                    value={formData.visceralFat || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    required
                  />
                  <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad Metabólica
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="metabolicAge"
                    value={formData.metabolicAge || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    required
                  />
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Ósea (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="boneMass"
                    value={formData.boneMass || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    step="0.1"
                    required
                  />
                  <Bone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test de Leger
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="legerTest"
                    value={formData.legerTest || ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent transition-all"
                    required
                  />
                  <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${
                isFormValid()
                  ? 'bg-[#006837] hover:bg-[#005229]'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Guardar Evaluación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 