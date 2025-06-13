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
  Hash, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { peopleService } from '../services/people.service';

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

interface JwtPayload {
  sub: string;
  personId: string;
  email: string;
  role: string;
  exp: number;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface TokenPayload {
  name?: string;
  lastname?: string;
  last_name?: string;
  document_type_id?: string;
  document_type?: string;
  document_number?: string;
  [key: string]: any;
}

export const PersonalDataForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log('User from context:', user);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(paises);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [genders, setGenders] = useState<GenderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [userDocumentTypeId, setUserDocumentTypeId] = useState<string | null>(null);
  const [prefilledName, setPrefilledName] = useState<string>('');
  const [prefilledLastName, setPrefilledLastName] = useState<string>('');

  // Obtener document_type (puede venir como id o como nombre) desde user o localStorage
  const storedUser = localStorage.getItem('user_data');
  let initialDocumentType: string = '';
  if (user?.document_type) {
    initialDocumentType = user.document_type;
  } else if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.document_type) initialDocumentType = parsed.document_type;
    } catch (e) {
      console.warn('No se pudo parsear user_data al inicializar formulario');
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      lastName: user?.last_name || '',
      birthDate: undefined,
      sex: '',
      documentType: initialDocumentType,
      documentNumber: user?.document_number || '',
      address: '',
      city: '',
      department: '',
      country: 'Colombia',
      email: '',
      phone: ''
    },
  });

  // Al montar el componente, decodificar el token para obtener datos básicos
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = jwtDecode<TokenPayload>(token);
        console.log('Token payload:', payload);
        
        // Intentar obtener el tipo de documento del token
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log('Stored user data:', userData);
          
          if (userData.document_type) {
            console.log('Document type from stored user data:', userData.document_type);
            setUserDocumentTypeId(userData.document_type || '');
          }
        }

        if (payload.name) {
          setPrefilledName(payload.name || '');
        }
        if (payload.lastname || payload.last_name) {
          setPrefilledLastName((payload.lastname || payload.last_name) || '');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Verificar si el usuario ya tiene un atleta asociado
  useEffect(() => {
    const checkAthlete = async () => {
      if (!user?.document_number) {
        toast.error('No se encontró información del usuario');
        navigate('/login');
        return;
      }

      try {
        // Intentamos obtener el atleta por su número de documento
        const athlete = await athletesService.getAthleteByDocument(user.document_number);
        
        if (athlete) {
          setAthleteId(athlete.id);
          // Si ya existe el atleta, redirigir al dashboard
          navigate('/user-dashboard');
          return;
        }

        // Si no encontramos el atleta, continuamos con el formulario
        console.log('Usuario no tiene atleta asociado');
      } catch (error) {
        console.error('Error al verificar atleta:', error);
        toast.error('Error al verificar datos del usuario');
      }
    };

    checkAthlete();
  }, [user, navigate]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Obtener tipos de documento y géneros
        const [documentTypesResponse, gendersResponse] = await Promise.all([
          axiosInstance.get<ApiResponse<DocumentTypeDTO[]>>(API_ENDPOINTS.MASTERS.DOCUMENT_TYPES),
          axiosInstance.get<ApiResponse<GenderDTO[]>>(API_ENDPOINTS.MASTERS.GENDERS)
        ]);

        console.log('Document types loaded:', documentTypesResponse.data);
        const docTypes = documentTypesResponse.data.data;
        setDocumentTypes(docTypes);
        setGenders(gendersResponse.data.data);

        // Intentar obtener el tipo de documento del usuario
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log('Trying to set document type from stored user data:', userData);
          
          if (userData.document_type) {
            // Buscar por ID o por nombre
            const matchingDocType = docTypes.find(
              dt => dt.id === userData.document_type || dt.name === userData.document_type
            );
            
            console.log('Matching document type found:', matchingDocType);
            if (matchingDocType) {
              form.setValue('documentType', matchingDocType.id);
              console.log('Form values after setting document type:', form.getValues());
            }
          }
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error loading master data:', error);
        setLoadError(error.message || 'Error cargando datos maestros');
        setIsLoading(false);
      }
    };

    loadMasterData();
  }, [form]);

  useEffect(() => {
    if (selectedDepartment) {
      const cities = ciudadesPorDepartamento[selectedDepartment] || [];
      setFilteredCities(cities);
    } else {
      setFilteredCities([]);
    }
  }, [selectedDepartment]);

  const handleCountrySearch = (value: string) => {
    const filtered = paises.filter(pais =>
      pais.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCountries(filtered);
  };

  const handleSubmit = async (data: FormData) => {
    if (!user?.document_number) {
      toast.error('No se encontró información del usuario');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear el atleta
      const athleteData = {
        document_type_id: data.documentType,
        document_number: data.documentNumber,
        name: data.name,
        last_name: data.lastName,
        birth_date: data.birthDate.toISOString(),
        gender_id: data.sex,
        address: data.address,
        city: data.city,
        state: data.department,
        country: data.country,
        email: data.email,
        phone: data.phone
      };

      console.log('Creando atleta con datos:', athleteData);
      const newAthlete = await athletesService.createAthlete(athleteData);
      console.log('Atleta creado:', newAthlete);
      
      toast.success('Datos personales registrados correctamente');
      navigate('/user-dashboard');
    } catch (error) {
      console.error('Error al registrar datos personales:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error al registrar datos personales';
        toast.error(errorMessage);
      } else {
        toast.error('Error al registrar datos personales. Por favor, intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener y prellenar nombre y apellido una vez que el usuario esté disponible
  useEffect(() => {
    const fillNames = async () => {
      if (!user?.document_number) return;
      try {
        const people = await peopleService.getPeople();
        const person = people.find(p => p.document_number === user.document_number);
        if (person) {
          if (!form.getValues('name')) {
            form.setValue('name', person.name);
          }
          // El servicio podría devolver lastname o last_name
          const lastNameValue = (person as any).lastname || (person as any).last_name || '';
          if (!form.getValues('lastName') && lastNameValue) {
            form.setValue('lastName', lastNameValue);
          }
        }
      } catch (err) {
        console.error('No se pudo prellenar nombre y apellido:', err);
      }
    };

    fillNames();
  }, [user, form]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006837]"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de conexión</h2>
          <p className="text-red-500 mb-6">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#006837] text-white px-4 py-2 rounded hover:bg-[#005229] transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <img src={logo2} alt="Logo" className="w-32 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-[#006837] mb-4">Registro de Datos Personales</h1>
            <p className="text-gray-600">
              Por favor, complete todos los campos con su información personal.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base">
                        <User className="h-5 w-5" />
                        Nombre
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Nombre"
                          className="h-11 text-base bg-gray-100"
                          disabled
                          readOnly
                        />
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <User className="h-5 w-5" />
                        Apellido
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Apellido"
                          className="h-11 text-base bg-gray-100"
                          disabled
                          readOnly
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Calendar className="h-5 w-5" />
                        Fecha de Nacimiento
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          locale="es"
                          dateFormat="dd/MM/yyyy"
                          className="w-full h-11 text-base px-4 border rounded-md focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all duration-200"
                          placeholderText="Seleccione su fecha de nacimiento"
                          showYearDropdown
                          scrollableYearDropdown
                          yearDropdownItemNumber={100}
                          maxDate={new Date()}
                          minDate={new Date(1900, 0, 1)}
                          customInput={
                            <Input 
                              className="h-11 text-base cursor-pointer"
                              readOnly
                            />
                          }
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <UserRound className="h-5 w-5" />
                        Género
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base">
                            <SelectValue placeholder="Seleccione su género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender.id} value={gender.id.toString()} className="text-base">
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <FileText className="h-5 w-5" />
                        Tipo de Documento
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base">
                            <SelectValue placeholder="Seleccione tipo de documento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()} className="text-base">
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Hash className="h-5 w-5" />
                        Número de Documento
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="h-11 text-base bg-gray-100"
                          disabled
                          readOnly
                        />
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <MapPin className="h-5 w-5" />
                        Dirección
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingrese su dirección" 
                          {...field} 
                          className="h-11 text-base"
                        />
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Building className="h-5 w-5" />
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
                          <SelectTrigger className="h-11 text-base">
                            <SelectValue placeholder="Seleccione departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departamentos.map((depto) => (
                            <SelectItem key={depto} value={depto} className="text-base">
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Building className="h-5 w-5" />
                        Ciudad
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base">
                            <SelectValue placeholder="Seleccione ciudad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCities.map((city) => (
                            <SelectItem key={city} value={city} className="text-base">
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Globe className="h-5 w-5" />
                        País
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 text-base">
                            <SelectValue placeholder="Seleccione país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCountries.map((country) => (
                            <SelectItem key={country} value={country} className="text-base">
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Mail className="h-5 w-5" />
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingrese su correo electrónico" 
                          {...field} 
                          className="h-11 text-base"
                        />
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
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Phone className="h-5 w-5" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingrese su número de teléfono" 
                          {...field} 
                          className="h-11 text-base"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/user-dashboard')}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#006837] hover:bg-[#005229] px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Datos'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}; 