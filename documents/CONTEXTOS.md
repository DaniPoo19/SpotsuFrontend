# Contextos - Proyecto TRACKSPORT Frontend

## C) Contextos

### Propósito de cada contexto

| Contexto | Propósito | Ubicación |
|----------|-----------|-----------|
| `AuthContext` | Gestión completa de autenticación, estado del usuario y navegación | `contexts/AuthContext.tsx` |
| `ParQContext` | Gestión del cuestionario PAR-Q (Physical Activity Readiness Questionnaire) | `contexts/ParQContext.tsx` |

## Detalles de Contextos

### 1. AuthContext

**Ubicación:** `src/contexts/AuthContext.tsx`

**Propósito:** Gestiona todo el flujo de autenticación, desde login hasta logout, incluyendo verificación de tokens, estado del atleta asociado y navegación automática.

#### Estado Global Gestionado:
```typescript
interface AuthContextType {
  user: User | null;                    // Usuario autenticado
  athlete: Athlete | null;              // Atleta asociado al usuario
  isAuthenticated: boolean;             // Estado de autenticación
  isLoading: boolean;                   // Estado de carga
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  checkAthleteStatus: () => Promise<void>;
}
```

#### Datos Específicos:
- **user**: Información completa del usuario (id, email, name, role, document_number, etc.)
- **athlete**: Datos del atleta asociado al usuario (si existe)
- **isAuthenticated**: Boolean que indica si el usuario está autenticado
- **isLoading**: Boolean para estados de carga durante operaciones async

#### Métodos Expuestos:

##### `login(credentials: LoginCredentials): Promise<User>`
- **Propósito**: Autentica al usuario con credenciales
- **Parámetros**: `{document_type_id, document_number, password}`
- **Retorna**: Objeto User completo
- **Funcionalidades**:
  - Llama al servicio de autenticación
  - Almacena token en localStorage
  - Verifica estado del atleta asociado
  - Navega automáticamente según el estado del usuario

##### `logout(): void`
- **Propósito**: Cierra la sesión del usuario
- **Funcionalidades**:
  - Limpia localStorage (token y datos de usuario)
  - Llama al servicio de logout
  - Resetea estado global
  - Navega a página de login

##### `checkAthleteStatus(): Promise<void>`
- **Propósito**: Verifica si el usuario tiene un atleta asociado
- **Funcionalidades**:
  - Consulta API para verificar estado del atleta
  - Actualiza estado del atleta en el contexto
  - Maneja errores si no existe atleta asociado

#### Flujo de Autenticación:
```
1. Inicialización → Verificar token en localStorage
2. Validación → Validar token con servidor
3. Estado del Atleta → Verificar atleta asociado
4. Navegación → Redirigir según estado
5. Persistencia → Mantener sesión
```

#### Características Técnicas:
- **Persistencia**: Tokens almacenados en localStorage
- **Validación automática**: Verificación de sesión al cargar la app
- **Navegación inteligente**: Redirección basada en estado del usuario
- **Manejo de errores**: Gestión centralizada de errores de autenticación
- **Interceptores**: Configuración automática de headers de autorización

### 2. ParQContext

**Ubicación:** `src/contexts/ParQContext.tsx`

**Propósito:** Gestiona el cuestionario PAR-Q (Physical Activity Readiness Questionnaire), incluyendo la carga de preguntas, manejo de respuestas, validación y envío de resultados.

#### Estado Global Gestionado:
```typescript
interface ParQContextType {
  questions: ParQQuestion[];                           // Preguntas del cuestionario
  answers: Record<string, boolean | null>;             // Respuestas del usuario
  loading: boolean;                                    // Estado de carga
  completed: boolean;                                  // Cuestionario completado
  passed: boolean;                                     // Resultado del cuestionario
  setAnswer: (questionId: string, answer: boolean) => void;
  submitAnswers: () => Promise<boolean>;
  resetParQ: () => void;
}
```

#### Datos Específicos:
- **questions**: Array de preguntas cargadas desde la API
- **answers**: Objeto con respuestas del usuario (questionId → boolean)
- **loading**: Estado de carga durante operaciones async
- **completed**: Indica si el cuestionario fue completado
- **passed**: Indica si el usuario pasó el cuestionario

#### Métodos Expuestos:

##### `setAnswer(questionId: string, answer: boolean): void`
- **Propósito**: Establece la respuesta a una pregunta específica
- **Parámetros**: 
  - `questionId`: ID único de la pregunta
  - `answer`: Respuesta booleana (true/false)
- **Funcionalidades**:
  - Actualiza el estado de respuestas
  - Mantiene sincronización con UI

##### `submitAnswers(): Promise<boolean>`
- **Propósito**: Envía las respuestas del cuestionario al servidor
- **Retorna**: Boolean indicando si el usuario pasó el cuestionario
- **Funcionalidades**:
  - Valida que todas las preguntas estén respondidas
  - Formatea respuestas para envío
  - Llama al servicio PAR-Q
  - Actualiza estado de completado y resultado
  - Muestra notificaciones de resultado

##### `resetParQ(): void`
- **Propósito**: Resetea el cuestionario para empezar de nuevo
- **Funcionalidades**:
  - Limpia respuestas del usuario
  - Resetea estados de completado y resultado
  - Recarga preguntas desde la API

#### Flujo del PAR-Q:
```
1. Carga Inicial → Obtener preguntas de API
2. Respuestas → Usuario responde preguntas
3. Validación → Verificar completitud
4. Envío → Enviar respuestas al servidor
5. Resultado → Mostrar resultado (pasó/no pasó)
6. Reset → Opción de reiniciar cuestionario
```

#### Características Técnicas:
- **Carga asíncrona**: Preguntas cargadas desde API al inicializar
- **Validación**: Verificación de completitud antes de envío
- **Notificaciones**: Toast messages para feedback del usuario
- **Error handling**: Manejo centralizado de errores
- **Estado persistente**: Respuestas mantenidas durante la sesión

## Arquitectura de Contextos

### 1. Provider Pattern
- Cada contexto tiene su propio Provider
- Providers anidados en App.tsx
- Hooks personalizados para consumo

### 2. Separación de Responsabilidades
- **AuthContext**: Solo autenticación y usuario
- **ParQContext**: Solo cuestionario PAR-Q
- Sin dependencias cruzadas entre contextos

### 3. Error Boundaries
- Manejo de errores a nivel de contexto
- Fallbacks para estados de error
- Logging de errores para debugging

### 4. Performance Optimizations
- `useCallback` para funciones estables
- `useMemo` para cálculos costosos
- Re-renders optimizados

## Integración con Componentes

### 1. Consumo de Contextos
```typescript
// En componentes
const { user, login, logout } = useAuth();
const { questions, setAnswer, submitAnswers } = useParQ();
```

### 2. Protección de Rutas
```typescript
// Rutas protegidas
<ProtectedRoute>
  <Component />
</ProtectedRoute>
```

### 3. Estado Global
- Contextos proporcionan estado global
- Componentes consumen estado reactivamente
- Actualizaciones automáticas en toda la app

## Consideraciones de Seguridad

### 1. AuthContext
- **Tokens seguros**: Almacenamiento en localStorage
- **Validación de tokens**: Verificación de expiración
- **Logout automático**: En caso de token inválido
- **Headers de autorización**: Configuración automática

### 2. ParQContext
- **Validación de datos**: Verificación de respuestas
- **Sanitización**: Limpieza de datos antes de envío
- **Error handling**: Manejo seguro de errores

## Testing de Contextos

### 1. Unit Tests
- Testing de métodos individuales
- Mocking de dependencias externas
- Verificación de estados

### 2. Integration Tests
- Testing de flujos completos
- Interacción entre contextos
- Validación de navegación

### 3. E2E Tests
- Flujos de usuario completos
- Autenticación end-to-end
- Cuestionario PAR-Q completo
