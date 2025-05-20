# SPOSTU - Sistema de Gestión Deportiva Universitaria

## Instalación

```bash
# Instalar dependencias
npm install

# Instalar dependencias adicionales
npm install axios react-hook-form react-hot-toast
```

## Ejecución

### Backend
```bash
# Navegar al directorio del backend
cd ../spotsu-backend

# Iniciar el servidor backend
npm run start:dev
```

### Frontend
```bash
# En el directorio del proyecto frontend
npm run dev
```

## Flujo de prueba

1. Iniciar sesión en http://localhost:5173/login con credenciales válidas
2. El token JWT se almacenará en localStorage
3. Navegar a http://localhost:5173/register para completar el formulario de datos personales
4. Enviar el formulario para registrar un nuevo atleta
5. Verificar el registro en Swagger: http://localhost:3000/spotsu/api/v1/api/docs

## Estructura de servicios

Los servicios están organizados por entidad y utilizan Axios para comunicarse con el backend:

- `auth.service.ts`: Gestión de autenticación
- `athletes.service.ts`: Operaciones CRUD para atletas
- `people.service.ts`: Operaciones CRUD para personas
- `sports.service.ts`: Operaciones CRUD para deportes
- `sport-histories.service.ts`: Operaciones CRUD para historiales deportivos
- `masters.service.ts`: Servicios para datos maestros (tipos de documento, géneros, etc.)

Todos los servicios están tipados con TypeScript y manejan errores de forma consistente. 