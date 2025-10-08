# Estructura de Componentes - Proyecto TRACKSPORT Frontend

## A) Árbol de Componentes

```
src/
├── components/
│   ├── ui/                          # Componentes de interfaz reutilizables
│   │   ├── avatar.tsx               # Avatar de usuario
│   │   ├── button.tsx               # Botón con variantes
│   │   ├── card.tsx                 # Tarjeta contenedora
│   │   ├── command.tsx              # Comando/búsqueda
│   │   ├── DashboardCard.tsx        # Tarjeta específica del dashboard
│   │   ├── dialog.tsx               # Modal/diálogo
│   │   ├── form.tsx                 # Formulario con validación
│   │   ├── input.tsx                # Campo de entrada
│   │   ├── label.tsx                # Etiqueta de formulario
│   │   ├── popover.tsx              # Popover flotante
│   │   ├── select.tsx               # Selector desplegable
│   │   └── separator.tsx            # Separador visual
│   ├── layout/                      # Componentes de layout
│   │   ├── index.tsx                # Exportaciones del layout
│   │   ├── ProtectedLayout.tsx      # Layout protegido
│   │   ├── Sidebar.tsx              # Barra lateral
│   │   ├── UserDashboardLayout.tsx  # Layout del dashboard de usuario
│   │   ├── UserDashboardSidebar.tsx # Sidebar del dashboard
│   │   └── UserSidebar.tsx          # Sidebar de usuario
│   ├── common/                      # Componentes comunes
│   │   ├── AspirantStatus.tsx       # Estado del aspirante
│   │   └── StatCard.tsx             # Tarjeta de estadísticas
│   ├── AspirantDetails.tsx          # Detalles del aspirante
│   ├── AspirantsList.tsx            # Lista de aspirantes
│   ├── Home.tsx                     # Página de inicio
│   ├── LoadingSpinner.tsx           # Spinner de carga
│   ├── MeasurementsForm.tsx         # Formulario de medidas
│   ├── PersonalDataForm.tsx         # Formulario de datos personales
│   ├── ProtectedRoute.tsx           # Ruta protegida
│   ├── Sidebar.tsx                  # Sidebar principal
│   ├── SportsHistoryForm.tsx        # Formulario de historial deportivo
│   └── UserInfoBanner.tsx           # Banner de información del usuario
```

## B) Tipos de Componentes

### 1. Componentes Presentacionales (UI)
Solo muestran interfaz de usuario, no manejan lógica de negocio.

#### `Button` (`ui/button.tsx`)
**Props:**
- `variant`: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- `size`: "default" | "sm" | "lg" | "icon"
- `asChild`: boolean (renderizar como Slot)
- `className`: string
- `disabled`: boolean
- `onClick`: function

#### `Card` (`ui/card.tsx`)
**Props:**
- `className`: string
- `children`: ReactNode

#### `Input` (`ui/input.tsx`)
**Props:**
- `type`: string
- `placeholder`: string
- `value`: string
- `onChange`: function
- `disabled`: boolean
- `className`: string

#### `Select` (`ui/select.tsx`)
**Props:**
- `value`: string
- `onValueChange`: function
- `defaultValue`: string
- `disabled`: boolean
- `children`: ReactNode

#### `LoadingSpinner` (`LoadingSpinner.tsx`)
**Props:**
- `size?`: "sm" | "md" | "lg"
- `className?`: string

#### `AspirantStatus` (`common/AspirantStatus.tsx`)
**Props:**
- `status`: string
- `className?`: string

#### `StatCard` (`common/StatCard.tsx`)
**Props:**
- `title`: string
- `value`: string | number
- `icon`: ReactNode
- `className?`: string

### 2. Componentes Contenedores
Manejan lógica de negocio y estado.

#### `PersonalDataForm` (`PersonalDataForm.tsx`)
**Props:** Ninguna (componente de página)
**Estado interno:**
- Formulario con validación usando react-hook-form
- Estados de carga y errores
- Datos maestros (tipos de documento, géneros)
- Navegación condicional

#### `AspirantsList` (`AspirantsList.tsx`)
**Props:**
- `aspirants`: Aspirant[]
- `loading`: boolean
- `onAspirantSelect`: function
- `selectedAspirantId?`: string

**Estado interno:**
- Lista filtrada de aspirantes
- Estado de selección
- Paginación

#### `AspirantDetails` (`AspirantDetails.tsx`)
**Props:**
- `aspirant`: Aspirant
- `onClose`: function

**Estado interno:**
- Datos detallados del aspirante
- Formularios de edición
- Estados de validación

#### `MeasurementsForm` (`MeasurementsForm.tsx`)
**Props:** Ninguna
**Estado interno:**
- Formulario de medidas corporales
- Validación de datos
- Integración con API

#### `SportsHistoryForm` (`SportsHistoryForm.tsx`)
**Props:** Ninguna
**Estado interno:**
- Historial deportivo del usuario
- Validación de datos
- Integración con servicios

#### `UserInfoBanner` (`UserInfoBanner.tsx`)
**Props:**
- `user`: User
- `className?`: string

**Estado interno:**
- Información del usuario autenticado
- Navegación contextual

### 3. Componentes de Layout

#### `ProtectedLayout` (`layout/ProtectedLayout.tsx`)
**Props:**
- `children`: ReactNode

**Funcionalidad:**
- Verificación de autenticación
- Redirección a login si no está autenticado
- Renderizado de layout protegido

#### `UserDashboardLayout` (`layout/UserDashboardLayout.tsx`)
**Props:**
- `children`: ReactNode

**Funcionalidad:**
- Layout específico para dashboard de usuario
- Sidebar de navegación
- Header con información del usuario

#### `Sidebar` (`Sidebar.tsx`)
**Props:**
- `isOpen`: boolean
- `onClose`: function
- `user`: User

**Estado interno:**
- Estado de apertura/cierre
- Navegación activa
- Menús contextuales

## C) Props Detalladas por Componente

### Componentes UI Base

| Componente | Props Principales | Tipo | Descripción |
|------------|-------------------|------|-------------|
| Button | variant, size, disabled, onClick | string, string, boolean, function | Botón con variantes de estilo |
| Input | type, placeholder, value, onChange | string, string, string, function | Campo de entrada de texto |
| Select | value, onValueChange, children | string, function, ReactNode | Selector desplegable |
| Card | className, children | string, ReactNode | Contenedor de tarjeta |
| Dialog | open, onOpenChange, children | boolean, function, ReactNode | Modal/diálogo |
| Form | onSubmit, children | function, ReactNode | Formulario con validación |

### Componentes de Formulario

| Componente | Props Principales | Estado Interno |
|------------|-------------------|----------------|
| PersonalDataForm | - | Formulario, validación, datos maestros |
| MeasurementsForm | - | Medidas corporales, validación |
| SportsHistoryForm | - | Historial deportivo, validación |

### Componentes de Lista

| Componente | Props Principales | Estado Interno |
|------------|-------------------|----------------|
| AspirantsList | aspirants, loading, onAspirantSelect | Filtrado, paginación, selección |
| AspirantDetails | aspirant, onClose | Datos detallados, edición |

### Componentes de Layout

| Componente | Props Principales | Funcionalidad |
|------------|-------------------|---------------|
| ProtectedLayout | children | Autenticación, protección de rutas |
| UserDashboardLayout | children | Layout del dashboard |
| Sidebar | isOpen, onClose, user | Navegación lateral |

## D) Patrones de Diseño Utilizados

### 1. Compound Components
- `Form` con `FormField`, `FormLabel`, `FormControl`, `FormMessage`
- `Select` con `SelectTrigger`, `SelectContent`, `SelectItem`

### 2. Render Props
- Componentes que aceptan funciones como children
- Flexibilidad en el renderizado

### 3. Higher-Order Components
- `ProtectedRoute` para protección de rutas
- Wrappers de autenticación

### 4. Custom Hooks
- `useForm` para manejo de formularios
- `useAuth` para autenticación
- `useParQ` para cuestionario PAR-Q

### 5. Context Pattern
- `AuthContext` para estado de autenticación
- `ParQContext` para cuestionario PAR-Q

## E) Flujo de Datos

```
User Input → Form Validation → API Service → Context/State → UI Update
     ↓              ↓              ↓            ↓            ↓
  Component → react-hook-form → axios → Context → Re-render
```

## F) Convenciones de Naming

- **Componentes**: PascalCase (ej: `PersonalDataForm`)
- **Props**: camelCase (ej: `onValueChange`)
- **Archivos**: PascalCase para componentes (ej: `Button.tsx`)
- **Hooks**: camelCase con prefijo "use" (ej: `useAuth`)
- **Contextos**: PascalCase con sufijo "Context" (ej: `AuthContext`)
