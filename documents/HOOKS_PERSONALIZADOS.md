# Hooks Personalizados - Proyecto TRACKSPORT Frontend

## B) Hooks Personalizados

### Lista de Hooks Personalizados

| Hook | Propósito | Retorna | Ubicación |
|------|-----------|---------|-----------|
| `useAuth` | Gestión de autenticación y estado del usuario | `{user, login, logout, isAuthenticated}` | `hooks/useAuth.ts` |

## Detalles de Hooks

### 1. `useAuth` Hook

**Ubicación:** `src/hooks/useAuth.ts`

**Implementación:** Utiliza Zustand para manejo de estado global

**Interfaz:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}
```

**Funcionalidades:**
- **Gestión de usuario**: Almacena y actualiza información del usuario
- **Gestión de token**: Maneja tokens de autenticación
- **Persistencia**: Almacena datos en localStorage automáticamente
- **Logout**: Limpia estado y localStorage

**Uso:**
```typescript
const { user, token, setUser, setToken, logout } = useAuth();
```

**Características técnicas:**
- **Persistencia automática**: Usa `persist` middleware de Zustand
- **Storage**: localStorage con clave 'auth-storage'
- **Serialización**: JSON automático
- **Estado reactivo**: Actualizaciones automáticas en toda la app

### 2. `useAuth` (Context Hook)

**Ubicación:** `src/contexts/AuthContext.tsx`

**Implementación:** Hook personalizado que consume AuthContext

**Interfaz:**
```typescript
interface AuthContextType {
  user: User | null;
  athlete: Athlete | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  checkAthleteStatus: () => Promise<void>;
}
```

**Funcionalidades:**
- **Autenticación completa**: Login, logout, validación de token
- **Estado del atleta**: Verificación de estado de atleta asociado
- **Navegación automática**: Redirección según estado del usuario
- **Persistencia**: Manejo de tokens en localStorage
- **Validación de sesión**: Verificación automática al cargar la app

**Uso:**
```typescript
const { 
  user, 
  athlete, 
  isAuthenticated, 
  isLoading, 
  login, 
  logout, 
  checkAthleteStatus 
} = useAuth();
```

**Flujo de autenticación:**
1. **Inicialización**: Verifica token en localStorage
2. **Validación**: Valida token con servidor
3. **Estado del atleta**: Verifica si usuario tiene atleta asociado
4. **Navegación**: Redirige según estado de autenticación
5. **Persistencia**: Mantiene sesión entre recargas

### 3. `useParQ` Hook

**Ubicación:** `src/contexts/ParQContext.tsx`

**Implementación:** Hook personalizado que consume ParQContext

**Interfaz:**
```typescript
interface ParQContextType {
  questions: ParQQuestion[];
  answers: Record<string, boolean | null>;
  loading: boolean;
  completed: boolean;
  passed: boolean;
  setAnswer: (questionId: string, answer: boolean) => void;
  submitAnswers: () => Promise<boolean>;
  resetParQ: () => void;
}
```

**Funcionalidades:**
- **Gestión de preguntas**: Carga preguntas del PAR-Q desde API
- **Respuestas**: Manejo de respuestas del usuario
- **Validación**: Verificación de completitud del formulario
- **Envío**: Envío de respuestas a API
- **Estado**: Tracking de progreso y resultado

**Uso:**
```typescript
const { 
  questions, 
  answers, 
  loading, 
  completed, 
  passed, 
  setAnswer, 
  submitAnswers, 
  resetParQ 
} = useParQ();
```

**Flujo del PAR-Q:**
1. **Carga inicial**: Obtiene preguntas de la API
2. **Respuestas**: Usuario responde preguntas
3. **Validación**: Verifica que todas las preguntas estén respondidas
4. **Envío**: Envía respuestas al servidor
5. **Resultado**: Recibe y muestra resultado (pasó/no pasó)

## Patrones de Hooks Utilizados

### 1. Estado Global con Zustand
- **useAuth**: Manejo de autenticación global
- **Persistencia**: Datos persisten entre sesiones
- **Reactividad**: Actualizaciones automáticas

### 2. Context + Hook Pattern
- **useAuth** (Context): Autenticación completa
- **useParQ**: Gestión de cuestionario PAR-Q
- **Encapsulación**: Lógica compleja encapsulada

### 3. Custom Hooks con Dependencias Externas
- **react-hook-form**: Validación de formularios
- **react-router-dom**: Navegación
- **axios**: Peticiones HTTP
- **toast**: Notificaciones

## Convenciones de Naming

- **Hooks**: camelCase con prefijo "use" (ej: `useAuth`)
- **Estados**: camelCase descriptivo (ej: `isLoading`)
- **Funciones**: camelCase descriptivo (ej: `checkAthleteStatus`)
- **Tipos**: PascalCase con sufijo "Type" (ej: `AuthContextType`)

## Beneficios de los Hooks Personalizados

### 1. Reutilización
- Lógica compartida entre componentes
- Reducción de código duplicado

### 2. Separación de Responsabilidades
- Lógica de negocio separada de UI
- Componentes más limpios y enfocados

### 3. Testing
- Hooks pueden ser probados independientemente
- Lógica aislada y testeable

### 4. Mantenibilidad
- Cambios centralizados
- Fácil actualización de funcionalidades

## Flujo de Datos en Hooks

```
Component → Hook → Context/Store → API → State Update → Component Re-render
     ↓         ↓         ↓          ↓         ↓              ↓
  UI Event → useAuth → AuthContext → axios → setUser → UI Update
```

## Consideraciones de Performance

### 1. Memoización
- `useCallback` para funciones estables
- `useMemo` para cálculos costosos

### 2. Dependencias
- Arrays de dependencias optimizados
- Evitar re-renders innecesarios

### 3. Persistencia
- localStorage para datos críticos
- Validación de expiración de tokens

### 4. Error Handling
- Manejo centralizado de errores
- Fallbacks para estados de error


