import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: https://rd-k9.github.io/TaylorAI/
// Local / Docker: base '/'
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
