import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { athletesService } from '../services/athletes.service';
import { mastersService } from '../services/masters.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DocumentTypeDTO, GenderDTO } from '../types/dtos';
import axiosInstance from '../api/axios';
import API_ENDPOINTS from '../api/endpoints';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import logo2 from '@/assets/2.png';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Calendar, 
  UserRound, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Globe, 
  FileText, 
  Hash 
} from 'lucide-react';

// Registrar el locale español
registerLocale('es', es);

const departamentos = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
];

// Lista completa de países con Colombia primero
const paises = [
  'Colombia',
  'Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Antigua y Barbuda', 'Arabia Saudita', 'Argelia', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaiyán', 'Bahamas', 'Bangladés', 'Barbados', 'Baréin', 'Bélgica', 'Belice', 'Benín', 'Bielorrusia', 'Birmania', 'Bolivia', 'Bosnia y Herzegovina', 'Botsuana', 'Brasil', 'Brunéi', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Bután', 'Cabo Verde', 'Camboya', 'Camerún', 'Canadá', 'Catar', 'Chad', 'Chile', 'China', 'Chipre', 'Ciudad del Vaticano', 'Comoras', 'Corea del Norte', 'Corea del Sur', 'Costa de Marfil', 'Costa Rica', 'Croacia', 'Cuba', 'Dinamarca', 'Dominica', 'Ecuador', 'Egipto', 'El Salvador', 'Emiratos Árabes Unidos', 'Eritrea', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos', 'Estonia', 'Etiopía', 'Filipinas', 'Finlandia', 'Fiyi', 'Francia', 'Gabón', 'Gambia', 'Georgia', 'Ghana', 'Granada', 'Grecia', 'Guatemala', 'Guinea', 'Guinea Ecuatorial', 'Guinea-Bisáu', 'Guyana', 'Haití', 'Honduras', 'Hungría', 'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda', 'Islandia', 'Islas Marshall', 'Islas Salomón', 'Israel', 'Italia', 'Jamaica', 'Japón', 'Jordania', 'Kazajistán', 'Kenia', 'Kirguistán', 'Kiribati', 'Kuwait', 'Laos', 'Lesoto', 'Letonia', 'Líbano', 'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Luxemburgo', 'Macedonia del Norte', 'Madagascar', 'Malasia', 'Malaui', 'Maldivas', 'Malí', 'Malta', 'Marruecos', 'Mauricio', 'Mauritania', 'México', 'Micronesia', 'Moldavia', 'Mónaco', 'Mongolia', 'Montenegro', 'Mozambique', 'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Níger', 'Nigeria', 'Noruega', 'Nueva Zelanda', 'Omán', 'Países Bajos', 'Pakistán', 'Palaos', 'Palestina', 'Panamá', 'Papúa Nueva Guinea', 'Paraguay', 'Perú', 'Polonia', 'Portugal', 'Reino Unido', 'República Centroafricana', 'República Checa', 'República del Congo', 'República Democrática del Congo', 'República Dominicana', 'Ruanda', 'Rumanía', 'Rusia', 'Samoa', 'San Cristóbal y Nieves', 'San Marino', 'San Vicente y las Granadinas', 'Santa Lucía', 'Santo Tomé y Príncipe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leona', 'Singapur', 'Siria', 'Somalia', 'Sri Lanka', 'Suazilandia', 'Sudáfrica', 'Sudán', 'Sudán del Sur', 'Suecia', 'Suiza', 'Surinam', 'Tailandia', 'Tanzania', 'Tayikistán', 'Timor Oriental', 'Togo', 'Tonga', 'Trinidad y Tobago', 'Túnez', 'Turkmenistán', 'Turquía', 'Tuvalu', 'Ucrania', 'Uganda', 'Uruguay', 'Uzbekistán', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Yibuti', 'Zambia', 'Zimbabue'
];

// Mapeo de departamentos a ciudades
const ciudadesPorDepartamento: { [key: string]: string[] } = {
  'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Sabaneta', 'Rionegro', 'Apartadó', 'Turbo', 'Yarumal', 'Santa Fe de Antioquia'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia', 'Galapa', 'Baranoa', 'Sabanagrande', 'Palmar de Varela', 'Luruaco'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'San Juan Nepomuceno', 'Santa Rosa del Sur', 'San Jacinto', 'María la Baja', 'Turbana'],
  'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Villa de Leyva', 'Nobsa', 'Samacá', 'Moniquirá', 'Garagoa'],
  'Caldas': ['Manizales', 'La Dorada', 'Riosucio', 'Chinchiná', 'Villamaría', 'Aguadas', 'Anserma', 'Salamina', 'Supía', 'Pensilvania'],
  'Cundinamarca': ['Bogotá', 'Soacha', 'Girardot', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera', 'Madrid', 'Funza', 'Fusagasugá'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Buga', 'Cartago', 'Jamundí', 'Yumbo', 'Florida', 'Pradera'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Málaga', 'Socorro', 'Oiba', 'Puerto Wilches'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios', 'El Zulia', 'La Playa', 'Chinácota', 'Sardinata', 'Tibú'],
  'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún', 'Tierralta', 'Montelíbano', 'Planeta Rica', 'Puerto Libertador', 'San Andrés de Sotavento', 'San Antero'],
  'Meta': ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Puerto Gaitán', 'San Martín', 'La Macarena', 'San Juan de Arama', 'El Castillo', 'Mesetas'],
  'Tolima': ['Ibagué', 'Espinal', 'Honda', 'Mariquita', 'Líbano', 'Melgar', 'Fresno', 'Lérida', 'Purificación', 'Guamo'],
  'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Palermo', 'San Agustín', 'Isnos', 'Aipe', 'Hobo'],
  'Cauca': ['Popayán', 'Santander de Quilichao', 'Patía', 'Puerto Tejada', 'El Tambo', 'Piendamó', 'Silvia', 'Timbío', 'Cajibío', 'Miranda'],
  'Nariño': ['Pasto', 'Tumaco', 'Ipiales', 'La Unión', 'Túquerres', 'El Charco', 'La Tola', 'Sandoná', 'Buesaco', 'Samaniego'],
  'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Belén de Umbría', 'Marsella', 'Quinchía', 'Guática', 'Pueblo Rico', 'Mistrató'],
  'Quindío': ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Circasia', 'Filandia', 'Salento', 'Pijao', 'Buenavista'],
  'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación', 'Aracataca', 'El Banco', 'Plato', 'Pivijay', 'Remolino', 'Salamina', 'Zona Bananera'],
  'Cesar': ['Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia', 'Chimichagua', 'Curumaní', 'La Jagua de Ibirico', 'La Paz', 'Pailitas', 'San Alberto'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'San Juan del Cesar', 'Fonseca', 'Barrancas', 'Dibulla', 'Albania', 'Hatonuevo'],
  'Sucre': ['Sincelejo', 'Corozal', 'San Marcos', 'Sampués', 'Tolú', 'San Onofre', 'Coveñas', 'Ovejas', 'Los Palmitos', 'Morroa'],
  'Casanare': ['Yopal', 'Aguazul', 'Tauramena', 'Villanueva', 'Monterrey', 'Paz de Ariporo', 'Orocué', 'San Luis de Palenque', 'Trinidad', 'Pore'],
  'Putumayo': ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuéz', 'San Miguel', 'Villagarzón', 'Puerto Caicedo', 'Puerto Guzmán', 'Sibundoy', 'Colón'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia', 'Santa Catalina'],
  'Amazonas': ['Leticia', 'Puerto Nariño', 'La Chorrera', 'La Pedrera', 'Tarapacá', 'Puerto Arica', 'Puerto Santander', 'Mirití-Paraná', 'El Encanto', 'La Victoria'],
  'Guainía': ['Inírida', 'Barranco Minas', 'Mapiripana', 'San Felipe', 'Morichal', 'Cacahual', 'Pana Pana', 'Puerto Colombia', 'La Guadalupe', 'Pacoa'],
  'Guaviare': ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
  'Vaupés': ['Mitú', 'Carurú', 'Taraira', 'Pacoa', 'Yavaraté', 'Papunaua'],
  'Vichada': ['Puerto Carreño', 'Cumaribo', 'La Primavera', 'Santa Rosalía', 'San José de Ocune', 'San Pedro de Vichada']
};

const formSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .nonempty("El nombre es obligatorio")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo debe contener letras"),
  lastName: z.string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .nonempty("El apellido es obligatorio")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo debe contener letras"),
  birthDate: z.date({
    required_error: "La fecha de nacimiento es obligatoria",
    invalid_type_error: "Fecha inválida",
  }),
  sex: z.string().nonempty("Debe seleccionar un género"),
  documentType: z.string().nonempty("Debe seleccionar un tipo de documento"),
  documentNumber: z.string()
    .min(5, "El número de documento debe tener al menos 5 caracteres")
    .nonempty("El número de documento es obligatorio")
    .regex(/^\d+$/, "El número de documento solo debe contener números"),
  address: z.string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .nonempty("La dirección es obligatoria"),
  city: z.string()
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .nonempty("La ciudad es obligatoria"),
  department: z.string().nonempty("El departamento es obligatorio"),
  country: z.string().nonempty("El país es obligatorio"),
  email: z.string()
    .email("Correo electrónico inválido")
    .nonempty("El correo electrónico es obligatorio")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Formato de correo electrónico inválido"),
  phone: z.string()
    .min(7, "El número de teléfono debe tener al menos 7 caracteres")
    .nonempty("El número de teléfono es obligatorio")
    .regex(/^[0-9+]+$/, "El número de teléfono solo debe contener números y el símbolo +")
});

type FormData = z.infer<typeof formSchema>;

const parqQuestions = [
  '¿Le ha dicho su médico alguna vez que padece una enfermedad cardiaca y que sólo debe hacer aquella actividad física que le aconseje un médico?',
  '¿Tiene dolor en el pecho cuando hace actividad física?',
  'En el último mes, ¿ha tenido dolor en el pecho cuando no hacía actividad física?',
  '¿Pierde el equilibrio debido a mareos o se ha desmayado alguna vez?',
  '¿Tiene problemas en huesos o articulaciones (por ejemplo, espalda, rodilla o cadera) que puedan empeorar si aumenta la actividad física?',
  '¿Le receta su médico algún medicamento para la tensión arterial o un problema cardíaco?',
  '¿Conoce alguna razón por la cual no debería realizar actividad física?'
];

export const PersonalDataForm = () => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(paises);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [genders, setGenders] = useState<GenderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      birthDate: undefined,
      sex: "",
      documentType: "",
      documentNumber: "",
      address: "",
      city: "",
      department: "",
      country: "",
      email: "",
      phone: ""
    },
  });

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        console.log('Cargando datos maestros...');
        const [docTypes, genderList] = await Promise.all([
          mastersService.getDocumentTypes(),
          mastersService.getGenders()
        ]);
        
        console.log('Tipos de documento:', docTypes);
        console.log('Géneros:', genderList);
        
        setDocumentTypes(docTypes);
        setGenders(genderList);
      } catch (error) {
        console.error('Error al cargar datos maestros:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setLoadError(`Error al cargar datos maestros: ${errorMessage}`);
        toast.error('Error al cargar datos maestros. Por favor, intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMasterData();
  }, [navigate]);

  useEffect(() => {
    if (selectedDepartment) {
      setFilteredCities(ciudadesPorDepartamento[selectedDepartment] || []);
    } else {
      setFilteredCities([]);
    }
  }, [selectedDepartment]);

  const handleCountrySearch = (value: string) => {
    const searchTerm = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = paises.filter(country => 
      country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchTerm)
    );
    setFilteredCountries(filtered);
  };

  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      console.log('Enviando datos al backend:', values);
      
      // Asegurarse de que la fecha esté en el formato correcto YYYY-MM-DD
      const formattedDate = values.birthDate.toISOString().split('T')[0];
      const dataToSend = {
        ...values,
        birthDate: formattedDate
      };
      
      const response = await athletesService.registerPersonalData(dataToSend);
      console.log('Respuesta del backend:', response);
      
      toast.success('Datos del deportista registrados correctamente');
      
      form.reset();
    } catch (error: any) {
      console.error('Error al enviar datos:', error);
      
      let errorMessage = 'Error al registrar datos del deportista';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando formulario...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de conexión</h2>
          <p className="text-red-500 mb-6">{loadError}</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Importante:</strong> Para que esta aplicación funcione correctamente, el servidor backend debe estar en ejecución.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Asegúrese de que el servidor NestJS esté ejecutándose en <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:3000</code> con el prefijo global <code className="bg-gray-100 px-1 py-0.5 rounded">/spotsu/api/v1</code>.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Pasos para iniciar el servidor backend:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Abra una terminal en la carpeta del proyecto backend NestJS</li>
                <li>Ejecute <code className="bg-gray-100 px-1 py-0.5 rounded">npm run start:dev</code> o <code className="bg-gray-100 px-1 py-0.5 rounded">yarn start:dev</code></li>
                <li>Espere a que el servidor se inicie correctamente (debería ver un mensaje indicando que escucha en puerto 3000)</li>
                <li>Verifique que no haya errores en la consola del servidor</li>
                <li>Compruebe que el servidor responde visitando <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:3000/spotsu/api/v1/genders</code> en su navegador</li>
              </ol>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-[#006837] hover:bg-[#005828] w-full sm:w-auto"
              >
                Reintentar conexión
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    // Intentar hacer una solicitud de prueba sin verificar token
                    console.log('Probando conexión...');
                    console.log('URL de prueba:', API_ENDPOINTS.MASTERS.GENDERS);
                    
                    toast.loading('Verificando conexión con el servidor...', { id: 'connection-test' });
                    const response = await axiosInstance.get(API_ENDPOINTS.MASTERS.GENDERS);
                    
                    console.log('Respuesta de prueba:', response.data);
                    toast.success('Conexión exitosa con el servidor', { id: 'connection-test' });
                    
                    // Mostrar los datos recibidos
                    if (response.data?.data?.length > 0) {
                      setGenders(response.data.data);
                      toast.success(`Se obtuvieron ${response.data.data.length} registros de género del servidor`);
                      
                      // Recargar la página después de una conexión exitosa
                      setTimeout(() => {
                        window.location.reload();
                      }, 1500);
                    }
                  } catch (error: any) {
                    console.error('Error en la prueba de conexión:', error);
                    
                    let errorMessage = 'Error en la prueba de conexión';
                    if (error.response) {
                      errorMessage += `: ${error.response.status} - ${error.response.statusText}`;
                      console.error('Detalles del error:', error.response.data);
                    } else if (error.request) {
                      errorMessage += ': No se recibió respuesta del servidor';
                    } else {
                      errorMessage += `: ${error.message}`;
                    }
                    
                    toast.error(errorMessage, { id: 'connection-test' });
                  }
                }} 
                className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
              >
                Probar Conexión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <img src={logo2} alt="Logo" className="h-16" />
        </div>
        <h2 className="text-2xl font-bold text-[#006837] mb-4 text-center">Registro de Deportista</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese su nombre" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Apellido
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese su apellido" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Nacimiento
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        locale="es"
                        dateFormat="dd/MM/yyyy"
                        className="w-full p-2 border rounded-md"
                        placeholderText="Seleccione su fecha de nacimiento"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      Género
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione su género" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genders.map((gender) => (
                          <SelectItem key={gender.id} value={gender.id.toString()}>
                            {gender.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tipo de Documento
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Número de Documento
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese su número de documento" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese su dirección" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Departamento
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDepartment(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departamentos.map((depto) => (
                          <SelectItem key={depto} value={depto}>
                            {depto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Ciudad
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione ciudad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      País
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCountries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Correo Electrónico
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese su correo electrónico" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese su número de teléfono" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center mt-6">
              <Button 
                type="submit" 
                className="bg-[#006837] hover:bg-[#005828] text-white px-8 py-2 rounded-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar y continuar'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}; 