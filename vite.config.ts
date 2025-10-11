// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['lucide-react'] },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'https://api.tracksport.socratesunicordoba.co',
        changeOrigin: true,
        secure: true,
        // Asegura que todas las rutas locales /api/* lleguen como /tracksport/api/v1/*
        rewrite: (path) => path.replace(/^\/api/, '/tracksport/api/v1'),
      },
    },
  },
  base: '/',
});