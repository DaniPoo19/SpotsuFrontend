# Utilidades y Servicios - Proyecto TRACKSPORT Frontend

## D) Utilidades

### Funciones de Utilidad

#### `cn` - Función de Clases CSS (`lib/utils.ts`)
**Propósito:** Combina y optimiza clases CSS usando clsx y tailwind-merge

**Ubicación:** `src/lib/utils.ts`

**Implementación:**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Funcionalidades:**
- **Combinación de clases**: Une múltiples clases CSS
- **Optimización de Tailwind**: Elimina clases conflictivas
- **TypeScript**: Soporte completo de tipos
- **Condicionales**: Maneja clases condicionales

**Uso:**
```typescript
cn("px-4 py-2", "bg-blue-500", condition && "text-white")
```

**Beneficios:**
- Evita conflictos de clases CSS
- Optimiza el bundle final
- Mejora la legibilidad del código
- Mantiene consistencia en estilos

## Servicios de API

### Lista de Servicios

| Servicio | Propósito | Ubicación |
|----------|-----------|-----------|
| `authService` | Autenticación y gestión de usuarios | `services/auth.service.ts` |
| `athletesService` | Gestión de atletas | `services/athletes.service.ts` |
| `aspirantsService` | Gestión de aspirantes | `services/aspirants.service.ts` |
| `attachedDocumentsService` | Gestión de documentos adjuntos | `services/attached-documents.service.ts` |
| `documentTypesService` | Tipos de documentos | `services/document-types.service.ts` |
| `mastersService` | Datos maestros | `services/masters.service.ts` |
| `morphologicalService` | Variables morfológicas | `services/morphological.service.ts` |
| `parqService` | Cuestionario PAR-Q | `services/parq.service.ts` |
| `peopleService` | Gestión de personas | `services/people.service.ts` |
| `postulationService` | Gestión de postulaciones | `services/postulation.service.ts` |
| `reportsService` | Reportes y estadísticas | `services/reports.service.ts` |
| `sportHistoriesService` | Historiales deportivos | `services/sport-histories.service.ts` |
| `sportsAchievementsService` | Logros deportivos | `services/sports-achievements.service.ts` |
| `sportsService` | Gestión de deportes | `services/sports.service.ts` |

### Detalles de Servicios Principales

#### 1. AuthService (`services/auth.service.ts`)

**Propósito:** Gestiona toda la autenticación, incluyendo login, registro, validación de tokens y perfil de usuario.

**Métodos Principales:**
```typescript
class AuthService {
  async login(credentials: LoginCredentials): Promise<User>
  async register(userData: RegisterDTO): Promise<UserDTO>
  async getProfile(): Promise<UserDTO>
  logout(): void
  getToken(): string | null
  getUserData(): User | null
  async getCurrentUser(): Promise<User>
  async getAthleteById(athleteId: string): Promise<Athlete>
  async getAthleteByDocument(documentTypeId: string, documentNumber: string): Promise<Athlete | null>
  isAuthenticated(): boolean
  async validateToken(token: string): Promise<User | null>
}
```

**Funcionalidades:**
- **Login**: Autenticación con credenciales
- **Registro**: Creación de nuevos usuarios
- **Validación de tokens**: Verificación de sesiones
- **Gestión de perfil**: Obtención de datos del usuario
- **Interceptores**: Configuración automática de headers
- **Persistencia**: Manejo de tokens en localStorage

**Características Técnicas:**
- **Axios**: Cliente HTTP configurado
- **JWT**: Decodificación de tokens
- **Interceptores**: Headers de autorización automáticos
- **Error handling**: Manejo centralizado de errores HTTP

#### 2. AthletesService (`services/athletes.service.ts`)

**Propósito:** Gestiona operaciones CRUD para atletas, incluyendo creación, actualización y consulta de datos.

**Métodos Principales:**
```typescript
class AthletesService {
  async createAthlete(athleteData: CreateAthleteDTO): Promise<Athlete>
  async getAthleteById(id: string): Promise<Athlete>
  async getAthleteByDocument(documentNumber: string): Promise<Athlete>
  async updateAthlete(id: string, athleteData: UpdateAthleteDTO): Promise<Athlete>
  async deleteAthlete(id: string): Promise<void>
  async getAthletes(params?: AthletesParams): Promise<Athlete[]>
}
```

**Funcionalidades:**
- **CRUD completo**: Crear, leer, actualizar, eliminar atletas
- **Búsqueda por documento**: Encontrar atleta por número de documento
- **Filtrado**: Búsqueda con parámetros
- **Validación**: Verificación de datos antes de envío

#### 3. ParQService (`services/parq.service.ts`)

**Propósito:** Gestiona el cuestionario PAR-Q, incluyendo carga de preguntas y envío de respuestas.

**Métodos Principales:**
```typescript
class ParQService {
  async getQuestions(): Promise<ParQQuestion[]>
  async submitAnswers(answers: ParQAnswer[]): Promise<ParQResponse>
  async getResponsesByUserId(userId: string): Promise<ParQResponse[]>
  async getResponseById(responseId: string): Promise<ParQResponse>
}
```

**Funcionalidades:**
- **Carga de preguntas**: Obtiene preguntas del cuestionario
- **Envío de respuestas**: Procesa respuestas del usuario
- **Historial**: Consulta respuestas anteriores
- **Validación**: Verificación de completitud

#### 4. MastersService (`services/masters.service.ts`)

**Propósito:** Proporciona datos maestros del sistema como tipos de documento, géneros, departamentos, etc.

**Métodos Principales:**
```typescript
class MastersService {
  async getDocumentTypes(): Promise<DocumentTypeDTO[]>
  async getGenders(): Promise<GenderDTO[]>
  async getDepartments(): Promise<DepartmentDTO[]>
  async getCitiesByDepartment(departmentId: string): Promise<CityDTO[]>
  async getCountries(): Promise<CountryDTO[]>
  async getSports(): Promise<SportDTO[]>
}
```

**Funcionalidades:**
- **Datos maestros**: Información de referencia del sistema
- **Relaciones**: Datos relacionados (ciudades por departamento)
- **Caché**: Optimización de consultas frecuentes
- **Consistencia**: Datos estandarizados

### Configuración de API

#### Axios Configuration (`lib/api.ts`)
**Ubicación:** `src/lib/api.ts`

**Configuración:**
```typescript
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Interceptores:**
```typescript
// Request Interceptor
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

**Características:**
- **Base URL configurable**: Variable de entorno VITE_API_URL
- **Headers automáticos**: Content-Type y Authorization
- **Interceptores**: Manejo automático de tokens y errores
- **Logout automático**: En caso de token inválido

#### Endpoints Configuration (`api/endpoints.ts`)
**Ubicación:** `src/api/endpoints.ts`

**Estructura:**
```typescript
export default {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout'
  },
  ATHLETES: {
    BASE: '/athletes',
    BY_ID: (id: string) => `/athletes/${id}`,
    BY_DOCUMENT: '/athletes/by-document'
  },
  PARQ: {
    QUESTIONS: '/parq/questions',
    RESPONSES: '/parq/responses',
    SUBMIT: '/parq/submit'
  },
  MASTERS: {
    DOCUMENT_TYPES: '/masters/document-types',
    GENDERS: '/masters/genders',
    DEPARTMENTS: '/masters/departments',
    CITIES: '/masters/cities',
    COUNTRIES: '/masters/countries',
    SPORTS: '/masters/sports'
  }
};
```

## Comunicación con Backend

### 1. Patrón de Servicios
- **Clases singleton**: Instancias únicas por servicio
- **Métodos async**: Todas las operaciones son asíncronas
- **Error handling**: Manejo centralizado de errores
- **TypeScript**: Tipado fuerte en todas las interfaces

### 2. Manejo de Errores
```typescript
try {
  const response = await service.method();
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Manejo específico de errores HTTP
    if (error.response?.status === 401) {
      // Token inválido
    } else if (error.response?.status === 404) {
      // Recurso no encontrado
    }
  }
  throw error;
}
```

### 3. Validación de Datos
- **DTOs**: Data Transfer Objects para validación
- **Zod**: Validación de esquemas en runtime
- **TypeScript**: Validación en tiempo de compilación

### 4. Optimizaciones
- **Caché**: Datos maestros cacheados
- **Debounce**: Búsquedas optimizadas
- **Paginación**: Listas grandes paginadas
- **Lazy loading**: Carga bajo demanda

## Estructura de Respuestas API

### Formato Estándar
```typescript
interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

### Manejo de Estados
- **Loading**: Estados de carga durante peticiones
- **Error**: Manejo de errores con mensajes descriptivos
- **Success**: Confirmación de operaciones exitosas
- **Empty**: Estados vacíos con mensajes informativos

## Testing de Servicios

### 1. Unit Tests
- Mocking de axios
- Testing de métodos individuales
- Validación de parámetros

### 2. Integration Tests
- Testing con API real
- Validación de flujos completos
- Manejo de errores

### 3. E2E Tests
- Flujos de usuario completos
- Interacción con backend
- Validación de datos

## Consideraciones de Seguridad

### 1. Autenticación
- **JWT tokens**: Almacenamiento seguro
- **Interceptores**: Headers automáticos
- **Expiración**: Validación de tokens

### 2. Validación
- **Input sanitization**: Limpieza de datos
- **Type validation**: Verificación de tipos
- **Business rules**: Validación de reglas de negocio

### 3. Error Handling
- **No data leakage**: No exposición de datos sensibles
- **Logging**: Registro de errores para debugging
- **User feedback**: Mensajes informativos al usuario
