import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // "@/components/..." = "src/components/..."
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // accessible depuis les autres appareils du réseau local
    port: 3000,
    // En développement, toutes les requêtes /api sont transmises au backend.
    // Le navigateur ne voit qu'une seule adresse : pas de souci de CORS.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  preview: {
    host: true,
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
