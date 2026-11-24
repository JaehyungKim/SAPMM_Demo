import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build also works under GitHub Pages (/SAPMM_Demo/).
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { chunkSizeWarningLimit: 4000 },
});
