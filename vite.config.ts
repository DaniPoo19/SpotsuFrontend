import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174, // Cambiamos al puerto que está disponible
    strictPort: true, // Forzar el uso de este puerto
    host: true, // Permitir conexiones desde la red
  },
  base: '/', // Usar la raíz para desarrollo local
})

