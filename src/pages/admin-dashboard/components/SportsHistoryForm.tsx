import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { differenceInYears, parse } from 'date-fns';
import { 
  Search, Plus, X, Upload, Trophy, Calendar, Medal, 
  FileCheck, ChevronDown, ChevronUp, Clipboard, GraduationCap 
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const sports = [
  'Fútbol', 'Baloncesto', 'Voleibol', 'Natación', 'Atletismo',
  'Tenis', 'Béisbol', 'Gimnasia', 'Ciclismo', 'Boxeo',
  'Karate', 'Taekwondo', 'Judo', 'Rugby', 'Ajedrez'
];

const competitionTypes = {
  'Juegos intercolegiados': [
    'Fase municipal',
    'Fase departamental',
    'Fase nacional',
    'Fase internacional'
  ],
  'Deporte asociado': [
    'Interclubes',
    'Campeonatos departamentales',
    'Interligas',
    'Campeonatos zonales o regionales',
    'Campeonato nacional'
  ],
  'Deporte federado': [
    'Selección nacional',
    'Participaciones internacionales',
    'Reconocimientos al mérito deportivo'
  ]
};

const achievementSchema = z.object({
  competitionName: z.string().min(1, 'El nombre de la competencia es requerido'),
  competitionCategory: z.string().min(1, 'La categoría es requerida'),
  competitionType: z.string().min(1, 'El tipo de competencia es requerido'),
  certificate: z.any().optional(),
});

const sportHistorySchema = z.object({
  sport: z.string().min(1, 'El deporte es requerido'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  achievements: z.array(achievementSchema)
});

const documentsSchema = z.object({
  consentForm: z.any().optional(),
  academicCertificate: z.any().optional(),
});

const formSchema = z.object({
  sportsHistory: z.array(sportHistorySchema),
  documents: documentsSchema,
});

export const SportsHistoryForm = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSports, setFilteredSports] = useState(sports);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [showSportSearch, setShowSportSearch] = useState(false);
  const [expandedSports, setExpandedSports] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sportsHistory: [],
      documents: {
        consentForm: null,
        academicCertificate: null,
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sportsHistory"
  });

  useEffect(() => {
    const filtered = sports.filter(
      sport => sport.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedSports.includes(sport)
    );
    setFilteredSports(filtered);
  }, [searchTerm, selectedSports]);

  const calculateExperience = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    return differenceInYears(end, start);
  };

  const handleSportSelect = (sport: string) => {
    if (!selectedSports.includes(sport)) {
      setSelectedSports([...selectedSports, sport]);
      append({
        sport,
        startDate: '',
        endDate: '',
        achievements: []
      });
      setSearchTerm('');
      setShowSportSearch(false);
      setExpandedSports([...expandedSports, sport]);
    }
  };

  const toggleSportExpansion = (sport: string) => {
    setExpandedSports(prev => 
      prev.includes(sport) 
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('Form data:', data);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Required Documents Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
            <Clipboard size={24} className="text-[#006837]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos Requeridos</h2>
        </div>

        <Form {...form}>
          <form className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="documents.consentForm"
              render={({ field }) => (
                <div className="bg-gray-50 rounded-xl p-6">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <FileCheck size={20} className="text-[#006837]" />
                      Consentimiento Informado
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="consent-form"
                        />
                        <label
                          htmlFor="consent-form"
                          className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#006837] transition-colors"
                        >
                          <Upload size={24} className="text-[#006837]" />
                          <div className="text-center">
                            <p className="font-medium text-gray-700">Subir Consentimiento</p>
                            <p className="text-sm text-gray-500">PDF, JPG o PNG</p>
                          </div>
                        </label>
                        {field.value && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <FileCheck size={18} className="text-green-600" />
                              {typeof field.value === 'object' ? field.value.name : field.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => field.onChange(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="documents.academicCertificate"
              render={({ field }) => (
                <div className="bg-gray-50 rounded-xl p-6">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <GraduationCap size={20} className="text-[#006837]" />
                      Certificado Académico
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="academic-certificate"
                        />
                        <label
                          htmlFor="academic-certificate"
                          className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#006837] transition-colors"
                        >
                          <Upload size={24} className="text-[#006837]" />
                          <div className="text-center">
                            <p className="font-medium text-gray-700">Subir Certificado</p>
                            <p className="text-sm text-gray-500">PDF, JPG o PNG</p>
                          </div>
                        </label>
                        {field.value && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <FileCheck size={18} className="text-green-600" />
                              {typeof field.value === 'object' ? field.value.name : field.value}
                            </span>
                            <button
                              type="button"
                              onClick={() => field.onChange(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Sports History Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
            <Trophy size={24} className="text-[#006837]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Historial Deportivo</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="relative">
              {!showSportSearch ? (
                <button
                  type="button"
                  onClick={() => setShowSportSearch(true)}
                  className="w-full px-6 py-3 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Agregar Deporte
                </button>
              ) : (
                <div className="bg-white rounded-xl border p-4 shadow-lg">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar deporte..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSports.map((sport) => (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => handleSportSelect(sport)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Medal size={18} className="text-[#006837]" />
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {fields.map((field, sportIndex) => {
                const sport = form.watch(`sportsHistory.${sportIndex}.sport`);
                const isExpanded = expandedSports.includes(sport);

                return (
                  <div key={field.id} className="bg-white rounded-xl border shadow-sm">
                    <div 
                      className="flex justify-between items-center p-6 cursor-pointer"
                      onClick={() => toggleSportExpansion(sport)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#006837] bg-opacity-10">
                          <Trophy size={24} className="text-[#006837]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{sport}</h3>
                          <p className="text-sm text-gray-500">
                            {form.watch(`sportsHistory.${sportIndex}.achievements`)?.length || 0} logros registrados
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(sportIndex);
                            setSelectedSports(selectedSports.filter(s => s !== sport));
                            setExpandedSports(expandedSports.filter(s => s !== sport));
                          }}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X size={20} />
                        </button>
                        {isExpanded ? (
                          <ChevronUp size={24} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={24} className="text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name={`sportsHistory.${sportIndex}.startDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Calendar size={16} className="text-gray-500" />
                                  Fecha de Inicio
                                </FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="focus-visible:ring-[#006837]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`sportsHistory.${sportIndex}.endDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Calendar size={16} className="text-gray-500" />
                                  Fecha de Fin
                                </FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="focus-visible:ring-[#006837]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Medal size={16} className="text-gray-500" />
                              Años de Experiencia
                            </FormLabel>
                            <Input
                              type="number"
                              value={calculateExperience(
                                form.watch(`sportsHistory.${sportIndex}.startDate`),
                                form.watch(`sportsHistory.${sportIndex}.endDate`)
                              )}
                              disabled
                              className="bg-gray-50"
                            />
                          </FormItem>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium flex items-center gap-2">
                              <Trophy size={18} className="text-[#006837]" />
                              Logros Deportivos
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                const achievements = form.watch(`sportsHistory.${sportIndex}.achievements`) || [];
                                form.setValue(`sportsHistory.${sportIndex}.achievements`, [
                                  ...achievements,
                                  { competitionName: '', competitionCategory: '', competitionType: '', certificate: null }
                                ]);
                              }}
                              className="text-[#006837] hover:text-[#A8D08D] flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#006837] hover:bg-opacity-10 transition-colors"
                            >
                              <Plus size={18} />
                              Añadir Logro
                            </button>
                          </div>

                          <div className="grid gap-4">
                            {form.watch(`sportsHistory.${sportIndex}.achievements`)?.map((_, achievementIndex) => (
                              <div key={achievementIndex} className="bg-gray-50 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="font-medium">Logro #{achievementIndex + 1}</h5>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const achievements = form.watch(`sportsHistory.${sportIndex}.achievements`);
                                      form.setValue(
                                        `sportsHistory.${sportIndex}.achievements`,
                                        achievements.filter((_, i) => i !== achievementIndex)
                                      );
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nombre de la Competencia</FormLabel>
                                        <FormControl>
                                          <Input {...field} className="focus-visible:ring-[#006837]" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionCategory`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <FormControl>
                                          <select
                                            {...field}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                                          >
                                            <option value="">Seleccionar categoría</option>
                                            {Object.keys(competitionTypes).map((category) => (
                                              <option key={category} value={category}>
                                                {category}
                                              </option>
                                            ))}
                                          </select>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionType`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tipo de Competencia</FormLabel>
                                        <FormControl>
                                          <select
                                            {...field}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                                          >
                                            <option value="">Seleccionar tipo</option>
                                            {competitionTypes[form.watch(`sportsHistory.${sportIndex}.achievements.${achievementIndex}.competitionCategory`) as keyof typeof competitionTypes]?.map((type) => (
                                              <option key={type} value={type}>
                                                {type}
                                              </option>
                                            ))}
                                          </select>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`sportsHistory.${sportIndex}.achievements.${achievementIndex}.certificate`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Certificado</FormLabel>
                                        <FormControl>
                                          <div className="space-y-2">
                                            <Input
                                              type="file"
                                              onChange={(e) => field.onChange(e.target.files?.[0])}
                                              accept=".pdf,.jpg,.jpeg,.png"
                                              className="hidden"
                                              id={`certificate-${sportIndex}-${achievementIndex}`}
                                            />
                                            <label
                                              htmlFor={`certificate-${sportIndex}-${achievementIndex}`}
                                              className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-white transition-colors"
                                            >
                                              <Upload size={18} className="text-[#006837]" />
                                              Subir Certificado
                                            </label>
                                            {field.value && (
                                              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                                  <FileCheck size={16} className="text-green-600" />
                                                  {typeof field.value === 'object' ? field.value.name : field.value}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => field.onChange(null)}
                                                  className="text-red-500 hover:text-red-700"
                                                >
                                                  <X size={16} />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#006837] text-white rounded-xl hover:bg-[#005828] transition-colors font-medium"
              >
                Guardar Historial
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};