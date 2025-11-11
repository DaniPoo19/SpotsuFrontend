# 🔄 Cómo Cambiar Entre Backend Local y Producción

## 📋 Guía Rápida

Para cambiar entre el backend local y el de producción, solo necesitas editar el archivo `.env.local` y reiniciar el servidor.

---

## 🏠 OPCIÓN 1: Backend Local (Desarrollo)

### Configuración en `.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_API_PREFIX=/tracksport/api/v1
```

### URLs resultantes:
- **API:** `http://localhost:3000/tracksport/api/v1/athletes`
- **Archivos:** `http://localhost:3000/uploads/documento.pdf`

### Requisitos:
- Backend corriendo en `localhost:3000`
- Backend configurado con el prefijo `/tracksport/api/v1` en `main.ts`

---

## ☁️ OPCIÓN 2: Backend de Producción

### Configuración en `.env.local`:

```env
VITE_API_URL=https://api.tracksport.socratesunicordoba.co
```

**Nota:** NO configurar `VITE_API_PREFIX` (eliminarlo o dejarlo vacío)

### URLs resultantes:
- **API:** `https://api.tracksport.socratesunicordoba.co/athletes`
- **Archivos:** `https://api.tracksport.socratesunicordoba.co/uploads/documento.pdf`

### Requisitos:
- Conexión a internet
- Backend de producción accesible

---

## 🔧 Pasos para Cambiar

### Método 1: Edición Manual

1. Abre el archivo `.env.local` en tu editor
2. Cambia las variables según la opción que necesites
3. Guarda el archivo
4. Reinicia el servidor de desarrollo:
   ```bash
   # Detener el servidor (Ctrl+C)
   npm run dev
   ```

### Método 2: Usando Diferentes Archivos

Puedes mantener dos archivos de configuración:

**`.env.local.dev`** (Desarrollo):
```env
VITE_API_URL=http://localhost:3000
VITE_API_PREFIX=/tracksport/api/v1
```

**`.env.local.prod`** (Producción):
```env
VITE_API_URL=https://api.tracksport.socratesunicordoba.co
```

Luego copia el que necesites:
```bash
# Para desarrollo
cp .env.local.dev .env.local
npm run dev

# Para producción
cp .env.local.prod .env.local
npm run dev
```

---

## ✅ Verificación

### En la Consola del Navegador

Después de reiniciar, deberías ver logs que confirmen la configuración:

**Desarrollo Local:**
```
[Config] Base URL: http://localhost:3000
[Config] API Prefix: /tracksport/api/v1
[Config] API URL configured as: http://localhost:3000/tracksport/api/v1
```

**Producción:**
```
[Config] Base URL: https://api.tracksport.socratesunicordoba.co
[Config] API Prefix: (ninguno)
[Config] API URL configured as: https://api.tracksport.socratesunicordoba.co
```

### En la Pestaña Network (DevTools)

**Desarrollo Local:**
```
GET http://localhost:3000/tracksport/api/v1/athletes
GET http://localhost:3000/tracksport/api/v1/document-types
```

**Producción:**
```
GET https://api.tracksport.socratesunicordoba.co/athletes
GET https://api.tracksport.socratesunicordoba.co/document-types
```

---

## 🎯 Resumen de Diferencias

| Aspecto | Desarrollo Local | Producción |
|---------|------------------|------------|
| **VITE_API_URL** | `http://localhost:3000` | `https://api.tracksport.socratesunicordoba.co` |
| **VITE_API_PREFIX** | `/tracksport/api/v1` | *(vacío/no configurar)* |
| **URL API final** | Con prefijo | Sin prefijo |
| **Ejemplo** | `.../tracksport/api/v1/athletes` | `.../athletes` |

---

## 🐛 Problemas Comunes

### Error: "No se puede conectar al servidor"

**Causa:** Backend no está corriendo o URL incorrecta.

**Solución:**
- **Local:** Verifica que el backend esté corriendo en `localhost:3000`
- **Producción:** Verifica que la URL de producción sea correcta y accesible

### Error: 404 en endpoints

**Causa:** Prefijo incorrecto o faltante.

**Solución:**
- **Local:** Asegúrate de tener `VITE_API_PREFIX=/tracksport/api/v1`
- **Producción:** Asegúrate de NO tener `VITE_API_PREFIX` configurado

### Cambios no se reflejan

**Causa:** Cache de Vite o servidor no reiniciado.

**Solución:**
```bash
# Limpiar cache y reiniciar
rm -rf node_modules/.vite
npm run dev
```

---

## 📝 Checklist de Cambio

Al cambiar de backend, verifica:

- [ ] Archivo `.env.local` editado correctamente
- [ ] Variables configuradas según el entorno (desarrollo/producción)
- [ ] Servidor de desarrollo reiniciado completamente
- [ ] Logs en consola muestran la configuración correcta
- [ ] Peticiones en Network tab usan las URLs correctas
- [ ] Login funciona correctamente
- [ ] Endpoints responden correctamente

---

## 💡 Consejos

1. **Mantén dos archivos de configuración separados** para cambiar rápidamente
2. **Verifica siempre los logs de consola** después de cambiar
3. **Limpia el cache** si los cambios no se reflejan
4. **Documenta tu configuración actual** para evitar confusiones
5. **No versiones `.env.local`** en git (ya está en `.gitignore`)

---

## 🔗 Archivos Relacionados

- `.env.example` - Plantilla con ejemplos de configuración
- `CONFIG_FINAL.md` - Documentación detallada de configuración
- `src/config.ts` - Archivo de configuración principal
- `src/lib/axios.ts` - Instancia de axios configurada
- `src/api/axios.ts` - Instancia legacy de axios

---

**¡Listo!** Ahora puedes cambiar fácilmente entre desarrollo y producción simplemente editando `.env.local` 🎉

