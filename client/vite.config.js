import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api calls to the Express server:
// on the React side we write fetch('/api/...') without worrying about the port.
// /sitemap.xml and /robots.txt are also served by the server (routes/seoFiles.js).
// Ports 5176 / 5004: Inkspire, I Love Verticals and Voices of Verticals can run at the same time.
const CLIENT_PORT = Number(process.env.CLIENT_PORT ?? 5176);
const API_PORT = Number(process.env.API_PORT ?? 5004);

export default defineConfig({
  plugins: [react()],
  server: {
    port: CLIENT_PORT,
    strictPort: true,
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
      '/sitemap.xml': { target: `http://localhost:${API_PORT}`, changeOrigin: false },
      '/robots.txt': { target: `http://localhost:${API_PORT}`, changeOrigin: false },
    },
  },
});
