import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Dev server: serve index.html for all 404s (SPA fallback)
    fs: { strict: false },
  },
  preview: {
    // Allow your custom host for `vite preview`
    allowedHosts: ['plural.doughmination.win'],
  },
  appType: 'spa', // SPA fallback for unmatched routes
});
