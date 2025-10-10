import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  height: z.number().min(0, 'La altura debe ser mayor a 0'),
  weight: z.number().min(0, 'El peso debe ser mayor a 0'),
  muscularMass: z.number().min(0, 'La masa muscular debe ser mayor a 0'),
  fatMass: z.number().min(0, 'La masa grasa debe ser mayor a 0'),
  visceralFat: z.number().min(0, 'La grasa visceral debe ser mayor a 0'),
  metabolicAge: z.number().min(0, 'La edad metabólica debe ser mayor a 0'),
  boneMass: z.number().min(0, 'La masa ósea debe ser mayor a 0'),
  potenciaAerobica: z.number().min(0, 'La potencia aeróbica debe ser mayor a 0'),
});

interface MeasurementsFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  initialData?: z.infer<typeof formSchema>;
}

export const MeasurementsForm = ({ onSubmit, onCancel, initialData }: MeasurementsFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      height: 0,
      weight: 0,
      muscularMass: 0,
      fatMass: 0,
      visceralFat: 0,
      metabolicAge: 0,
      boneMass: 0,
      potenciaAerobica: 0,
    },
  });

  const calculateBMI = () => {
    const height = form.watch('height');
    const weight = form.watch('weight');
    if (height <= 0 || weight <= 0) return 0;
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
  };

  const bmi = calculateBMI();

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-[#006837] bg-opacity-10">
          <Calculator size={24} className="text-[#006837]" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Registrar Medidas Físicas</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura (cm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">IMC</p>
                <p className="text-3xl font-bold text-[#006837]">{bmi}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Categoría</p>
                <p className="text-xl font-semibold text-[#006837]">{getBMICategory(bmi)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="muscularMass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Masa Muscular (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fatMass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Masa Grasa (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visceralFat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grasa Visceral (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metabolicAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edad Metabólica (años)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="boneMass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Masa Ósea (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="potenciaAerobica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potencia Aeróbica (VO₂máx)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.0"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="focus-visible:ring-[#006837]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
};