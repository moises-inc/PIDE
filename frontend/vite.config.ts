import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function standaloneDemoFallback(): Plugin {
  return {
    name: 'standalone-demo-fallback',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: () => void) => {
        const url = (req.url as string) || '';
        if (url.startsWith('/api') || url.startsWith('/health')) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 120);
            const resp = await fetch(`http://127.0.0.1:8000${url}`, { signal: controller.signal });
            clearTimeout(timer);
            if (resp.ok) {
              const body = await resp.arrayBuffer();
              res.statusCode = resp.status;
              resp.headers.forEach((val, key) => res.setHeader(key, val));
              res.end(new Uint8Array(body));
              return;
            }
          } catch {
            // Backend offline: responder HTTP 503 silenciosamente sin logs en rojo
          }
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ offline: true, message: 'Modo Demo Activo (Backend offline)' }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), standaloneDemoFallback()],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});



