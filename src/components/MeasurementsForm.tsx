import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator, Ruler, Scale, Dumbbell, Heart, Brain, Bone, Timer } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  height: z.number().min(0, 'La altura debe ser mayor a 0'),
  weight: z.number().min(0, 'El peso debe ser mayor a 0'),
  muscularMass: z.number().min(0, 'La masa muscular debe ser mayor a 0'),
  fatMass: z.number().min(0, 'La masa grasa debe ser mayor a 0'),
  visceralFat: z.number().min(0, 'La grasa visceral debe ser mayor a 0'),
  metabolicAge: z.number().min(0, 'La edad metabólica debe ser mayor a 0'),
  boneMass: z.number().min(0, 'La masa ósea debe ser mayor a 0'),
  pailerTest: z.number().min(0, 'El test de Pailer-Léger debe ser mayor a 0'),
});

interface MeasurementsFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  initialData?: z.infer<typeof formSchema>;
}

const MeasurementInput = ({ 
  icon: Icon, 
  label, 
  name, 
  control, 
  placeholder, 
  unit 
}: { 
  icon: any, 
  label: string, 
  name: keyof z.infer<typeof formSchema>, 
  control: any, 
  placeholder: string,
  unit: string 
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[#006837] font-medium">{label}</FormLabel>
        <FormControl>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Icon size={18} />
            </div>
            <Input
              type="number"
              placeholder={placeholder}
              {...field}
              onChange={e => field.onChange(parseFloat(e.target.value))}
              className="h-12 pl-10 pr-12 bg-white border-gray-200 focus:border-[#006837] focus:ring-[#006837]/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {unit}
            </div>
          </div>
        </FormControl>
        <FormMessage className="text-red-500" />
      </FormItem>
    )}
  />
);

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
      pailerTest: 0,
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

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return 'text-yellow-500';
    if (bmi < 25) return 'text-[#006837]';
    if (bmi < 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const bmi = calculateBMI();

  return (
    <Card className="w-full max-w-2xl border-none shadow-lg">
      <CardHeader className="bg-[#006837] text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/20">
            <Calculator size={24} />
          </div>
          <CardTitle>Registrar Medidas Físicas</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <MeasurementInput
                icon={Ruler}
                label="Altura"
                name="height"
                control={form.control}
                placeholder="0.0"
                unit="cm"
              />
              <MeasurementInput
                icon={Scale}
                label="Peso"
                name="weight"
                control={form.control}
                placeholder="0.0"
                unit="kg"
              />
            </div>

            <Card className="bg-gray-50 border border-gray-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Índice de Masa Corporal</p>
                    <p className={`text-3xl font-bold ${getBMIColor(bmi)}`}>{bmi}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Categoría</p>
                    <p className={`text-xl font-semibold ${getBMIColor(bmi)}`}>{getBMICategory(bmi)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="bg-gray-200" />

            <div className="grid grid-cols-2 gap-6">
              <MeasurementInput
                icon={Dumbbell}
                label="Masa Muscular"
                name="muscularMass"
                control={form.control}
                placeholder="0.0"
                unit="kg"
              />
              <MeasurementInput
                icon={Heart}
                label="Masa Grasa"
                name="fatMass"
                control={form.control}
                placeholder="0.0"
                unit="%"
              />
              <MeasurementInput
                icon={Heart}
                label="Grasa Visceral"
                name="visceralFat"
                control={form.control}
                placeholder="0.0"
                unit="%"
              />
              <MeasurementInput
                icon={Brain}
                label="Edad Metabólica"
                name="metabolicAge"
                control={form.control}
                placeholder="0"
                unit="años"
              />
              <MeasurementInput
                icon={Bone}
                label="Masa Ósea"
                name="boneMass"
                control={form.control}
                placeholder="0.0"
                unit="kg"
              />
              <MeasurementInput
                icon={Timer}
                label="Test de Pailer-Léger"
                name="pailerTest"
                control={form.control}
                placeholder="0.0"
                unit="nivel"
              />
            </div>

            <CardFooter className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#006837] hover:bg-[#005229]"
              >
                Guardar
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};