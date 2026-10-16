import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'PNGTuber Recorder',
          short_name: 'PNGTuber',
          description: 'Grave a tela do celular ou PC com avatar PNGTuber 2D reativo à voz em tempo real.',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'github-export-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/github-push', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', async () => {
              try {
                const { repoUrl, token, branch = 'main' } = JSON.parse(body || '{}');
                if (!repoUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'A URL do repositório do GitHub é obrigatória.' }));
                  return;
                }

                let targetUrl = repoUrl.trim();
                if (token && token.trim()) {
                  const cleanedToken = token.trim();
                  if (targetUrl.startsWith('https://')) {
                    targetUrl = targetUrl.replace('https://', `https://${cleanedToken}@`);
                  }
                }

                const { execSync } = await import('child_process');
                execSync('git config user.name "PNGTuber Developer"');
                execSync('git config user.email "bolacha.amantegada.244@gmail.com"');
                execSync('git add .');
                try {
                  execSync('git commit -m "feat: Exportação completa com workflow de APK do GitHub Actions"');
                } catch (_) {}
                execSync(`git branch -M ${branch}`);
                try {
                  execSync('git remote remove origin');
                } catch (_) {}
                execSync(`git remote add origin ${targetUrl}`);
                const output = execSync(`git push -u origin ${branch} --force`, { encoding: 'utf8' });

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Repositório exportado com sucesso para o GitHub!', output }));
              } catch (err: unknown) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                const errMsg = err instanceof Error ? err.message : String(err);
                res.end(JSON.stringify({ error: errMsg }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
