import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths so the build also works under GitHub Pages (/SAPMM_Demo/).
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks (cached across demo updates) separate from app code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@ui5')) return 'vendor-ui5';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|zustand)\//.test(id)) return 'vendor-react';
        },
      },
    },
  },
});
