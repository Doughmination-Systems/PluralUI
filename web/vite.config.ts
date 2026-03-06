import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev server: serve index.html for all 404s (SPA fallback)
    fs: { strict: false },
  },
  appType: 'spa', // Tells Vite to serve index.html for unmatched routes in both dev + preview
});