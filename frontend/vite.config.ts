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
            const timer = setTimeout(() => controller.abort(), 3000);

            let body: Buffer | undefined = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
              const chunks: Uint8Array[] = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              body = Buffer.concat(chunks);
            }

            const headers: Record<string, string> = {};
            if (req.headers['content-type']) {
              headers['content-type'] = req.headers['content-type'];
            }
            if (req.headers['accept']) {
              headers['accept'] = req.headers['accept'];
            }

            const resp = await fetch(`http://127.0.0.1:8000${url}`, {
              method: req.method || 'GET',
              headers,
              body,
              signal: controller.signal,
            });
            clearTimeout(timer);
            if (resp.ok) {
              const respBody = await resp.arrayBuffer();
              res.statusCode = resp.status;
              resp.headers.forEach((val: string, key: string) => res.setHeader(key, val));
              res.end(new Uint8Array(respBody));
              return;
            }
          } catch {
            // Backend offline: responder HTTP 200 silenciosamente en modo offline sin alertas en consola
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          if (url.startsWith('/api/elements')) {
            res.end(JSON.stringify([]));
          } else {
            res.end(JSON.stringify({ offline: true, demo: true, message: 'Modo offline activo' }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
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
