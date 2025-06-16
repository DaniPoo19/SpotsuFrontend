import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/SpotsuFrontend/', // Asegúrate que coincida exactamente con tu repositorio (case-sensitive)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // Fuerza a que los SVG no se conviertan en base64
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          // Manejo especial para SVG
          if (assetInfo.name?.endsWith('.svg')) {
            return 'assets/[name][extname]'; // Sin hash para fácil referencia
          }
          return 'assets/[name].[hash][extname]';
        },
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    host: true,
  }
});
