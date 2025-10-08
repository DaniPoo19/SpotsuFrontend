# Documentación del Frontend - Proyecto TRACKSPORT

Esta carpeta contiene la documentación completa del frontend del proyecto TRACKSPORT, organizada en diferentes archivos especializados.

## 📁 Estructura de la Documentación

### [ESTRUCTURA_COMPONENTES.md](./ESTRUCTURA_COMPONENTES.md)
Documentación completa de la estructura de componentes del proyecto:

- **Árbol de componentes**: Diagrama jerárquico de la estructura
- **Tipos de componentes**: Presentacionales vs Contenedores
- **Props detalladas**: Propiedades de cada componente
- **Patrones de diseño**: Compound components, HOCs, etc.
- **Convenciones de naming**: Estándares del proyecto

### [HOOKS_PERSONALIZADOS.md](./HOOKS_PERSONALIZADOS.md)
Documentación de hooks personalizados:

- **Lista de hooks**: Tabla con propósito y retorno
- **Detalles técnicos**: Implementación y funcionalidades
- **Patrones utilizados**: Zustand, Context + Hook, etc.
- **Beneficios**: Reutilización, separación de responsabilidades
- **Consideraciones de performance**: Memoización y optimizaciones

### [CONTEXTOS.md](./CONTEXTOS.md)
Documentación de contextos y estado global:

- **Propósito de cada contexto**: AuthContext y ParQContext
- **Estado global gestionado**: Qué información mantiene cada uno
- **Métodos expuestos**: Funciones proporcionadas por cada contexto
- **Flujos de datos**: Cómo interactúan los contextos
- **Consideraciones de seguridad**: Manejo de tokens y validaciones

### [UTILIDADES_SERVICIOS.md](./UTILIDADES_SERVICIOS.md)
Documentación de utilidades y servicios de API:

- **Funciones de utilidad**: Herramientas auxiliares (cn, etc.)
- **Servicios de API**: Comunicación con el backend
- **Configuración de API**: Axios, interceptores, endpoints
- **Manejo de errores**: Patrones de error handling
- **Consideraciones de seguridad**: Autenticación y validación

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico
- **React 18**: Framework principal
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de estilos
- **Zustand**: Estado global
- **React Hook Form**: Manejo de formularios
- **Axios**: Cliente HTTP
- **React Router**: Navegación

### Patrones de Arquitectura
- **Component-Based Architecture**: Componentes reutilizables
- **Context API**: Estado global
- **Service Layer**: Abstracción de API
- **Custom Hooks**: Lógica reutilizable
- **Error Boundaries**: Manejo de errores

## 📋 Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes de interfaz base
│   ├── layout/          # Componentes de layout
│   ├── common/          # Componentes comunes
│   └── [otros]          # Componentes específicos
├── contexts/            # Contextos de React
├── hooks/               # Hooks personalizados
├── services/            # Servicios de API
├── lib/                 # Utilidades y configuración
├── types/               # Definiciones de tipos
├── pages/               # Páginas de la aplicación
├── router/              # Configuración de rutas
└── assets/              # Recursos estáticos
```

## 🔧 Convenciones del Proyecto

### Naming Conventions
- **Componentes**: PascalCase (`PersonalDataForm`)
- **Hooks**: camelCase con prefijo "use" (`useAuth`)
- **Contextos**: PascalCase con sufijo "Context" (`AuthContext`)
- **Servicios**: camelCase con sufijo "Service" (`authService`)
- **Archivos**: PascalCase para componentes, camelCase para utilidades

### Code Style
- **TypeScript**: Tipado estricto
- **ESLint**: Linting configurado
- **Prettier**: Formateo automático
- **Husky**: Pre-commit hooks

## 🚀 Flujos Principales

### 1. Autenticación
```
Login → Validación → Token → Context → Navegación
```

### 2. Registro de Atleta
```
Datos Personales → PAR-Q → Medidas → Historial → Dashboard
```

### 3. Gestión de Aspirantes (Admin)
```
Lista → Detalles → Evaluación → Aprobación/Rechazo
```

## 📊 Estado Global

### AuthContext
- Usuario autenticado
- Estado del atleta
- Navegación automática
- Persistencia de sesión

### ParQContext
- Preguntas del cuestionario
- Respuestas del usuario
- Estado de completado
- Resultado del cuestionario

## 🔐 Seguridad

### Autenticación
- **JWT Tokens**: Almacenamiento en localStorage
- **Interceptores**: Headers automáticos
- **Validación**: Verificación de tokens
- **Logout automático**: En caso de token inválido

### Validación
- **Input sanitization**: Limpieza de datos
- **Type validation**: Verificación de tipos
- **Business rules**: Validación de reglas de negocio

## 🧪 Testing

### Estrategia de Testing
- **Unit Tests**: Componentes y hooks individuales
- **Integration Tests**: Flujos entre componentes
- **E2E Tests**: Flujos completos de usuario

### Herramientas
- **Jest**: Framework de testing
- **React Testing Library**: Testing de componentes
- **MSW**: Mock Service Worker para API

## 📈 Performance

### Optimizaciones
- **Code Splitting**: Carga bajo demanda
- **Memoización**: useCallback y useMemo
- **Lazy Loading**: Componentes cargados dinámicamente
- **Bundle Optimization**: Tree shaking y minificación

### Monitoreo
- **Bundle Analyzer**: Análisis del bundle
- **Performance Metrics**: Core Web Vitals
- **Error Tracking**: Logging de errores

## 🔄 CI/CD

### Pipeline
- **Linting**: Verificación de código
- **Type Checking**: Validación de TypeScript
- **Testing**: Ejecución de tests
- **Build**: Generación de bundle
- **Deploy**: Despliegue automático

## 📚 Recursos Adicionales

### Documentación Externa
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)

### Herramientas de Desarrollo
- **React DevTools**: Debugging de componentes
- **Redux DevTools**: Debugging de estado (Zustand)
- **Vite DevTools**: Optimización de desarrollo

## 🤝 Contribución

### Guías de Contribución
1. Seguir convenciones de naming
2. Escribir tests para nuevas funcionalidades
3. Documentar cambios en la API
4. Actualizar documentación relevante

### Proceso de Review
1. Pull Request con descripción detallada
2. Review de código por parte del equipo
3. Ejecución exitosa de tests
4. Aprobación y merge

---

**Última actualización**: Septiembre 2025  
**Versión**: 1.0.0  
**Mantenido por**: Equipo de Desarrollo TRACKSPORT


