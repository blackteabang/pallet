// 개발 서버 설정 파일입니다.
// - /api/pallets 라우트로 파일 저장/읽기
// - p-data 폴더 변경 시 화면이 자동 새로고침되지 않도록 예외 처리
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs/promises';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        watch: {
          ignored: ['**/p-data/**'],
        },
      },
      plugins: [
        react(),
        tailwindcss(),
        {
          name: 'pallet-api',
          configureServer(server) {
            // 간단한 파일 API: GET(읽기), POST(저장)
            server.middlewares.use('/api/pallets', async (req, res, next) => {
              try {
                const method = (req.method || 'GET').toUpperCase();
                const dataDir = path.resolve(process.cwd(), 'p-data');
                const filePath = path.join(dataDir, 'pallets.json');

                if (method === 'GET') {
                  try {
                    const raw = await fs.readFile(filePath, 'utf8');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(raw);
                  } catch {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ pallets: [] }));
                  }
                  return;
                }

                if (method === 'POST') {
                  const chunks: Buffer[] = [];
                  req.on('data', (c) => chunks.push(Buffer.from(c)));
                  req.on('end', async () => {
                    try {
                      const body = Buffer.concat(chunks).toString('utf8');
                      const parsed = body ? JSON.parse(body) : {};
                      const pallets = Array.isArray(parsed?.pallets) ? parsed.pallets.slice(0, 300) : [];
                      const payload = JSON.stringify(
                        { updatedAt: new Date().toISOString(), pallets },
                        null,
                        2
                      );

                      await fs.mkdir(dataDir, { recursive: true });
                      const tmpPath = `${filePath}.tmp`;
                      await fs.writeFile(tmpPath, payload, 'utf8');
                      await fs.rename(tmpPath, filePath);

                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json; charset=utf-8');
                      res.end(JSON.stringify({ ok: true }));
                    } catch {
                      res.statusCode = 400;
                      res.setHeader('Content-Type', 'application/json; charset=utf-8');
                      res.end(JSON.stringify({ ok: false }));
                    }
                  });
                  return;
                }

                next();
              } catch {
                next();
              }
            });
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
