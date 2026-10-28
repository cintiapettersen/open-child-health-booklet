import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../src/index';
import { Env } from '../src/types';
import { CONFIG } from '../src/config';

const PORT = 8787;
const HOST = '127.0.0.1';

function parseDevVars(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  }
  return vars;
}

const devVarsPath = path.resolve(process.cwd(), 'gateway/.dev.vars');
const devVars = parseDevVars(devVarsPath);

const env: Env = {
  MOCK_MODE: devVars.MOCK_MODE ?? 'true',
  GEMINI_API_KEY: devVars.GEMINI_API_KEY,
  GEMINI_MODEL: devVars.GEMINI_MODEL ?? CONFIG.DEFAULT_MODEL,
  MAX_QUESTION_LENGTH: Number(devVars.MAX_QUESTION_LENGTH || CONFIG.MAX_QUESTION_LENGTH),
  RATE_LIMIT_PER_WINDOW: Number(devVars.RATE_LIMIT_PER_WINDOW || CONFIG.RATE_LIMIT_PER_WINDOW),
  RATE_LIMIT_WINDOW_SECONDS: Number(devVars.RATE_LIMIT_WINDOW_SECONDS || CONFIG.RATE_LIMIT_WINDOW_SECONDS),
  DAILY_GLOBAL_QUOTA: Number(devVars.DAILY_GLOBAL_QUOTA || CONFIG.DAILY_GLOBAL_QUOTA),
  ALLOWED_ORIGIN: '*'
};

console.log('🚀 ========================================================');
console.log('🚀 First 1,000 Days | Local Edge Gateway Server');
console.log(`🚀 Host: http://${HOST}:${PORT}`);
console.log(`🚀 Mode: ${env.MOCK_MODE === 'false' ? '🔴 LIVE (Gemini 3.5 Flash-Lite)' : '🟢 MOCK (Simulação Local Segura)'}`);
console.log(`🚀 Key Present: ${env.GEMINI_API_KEY ? 'Sim (em gateway/.dev.vars protegido)' : 'Não'}`);
console.log(`🚀 Rate Limit: ${env.RATE_LIMIT_PER_WINDOW} req / ${env.RATE_LIMIT_WINDOW_SECONDS}s`);
console.log('🚀 ========================================================\n');

const server = http.createServer((req, res) => {
  const fullUrl = `http://${HOST}:${PORT}${req.url}`;
  const chunks: Buffer[] = [];

  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const body =
        req.method !== 'GET' && req.method !== 'HEAD' && chunks.length > 0
          ? Buffer.concat(chunks)
          : undefined;

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      }

      const webReq = new Request(fullUrl, {
        method: req.method,
        headers,
        body
      });

      const webRes = await worker.fetch(webReq, env);

      res.statusCode = webRes.status;
      webRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const arrayBuffer = await webRes.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));

      const statusColor = webRes.status === 200 ? '✅' : webRes.status === 429 ? '⚠️' : '❌';
      console.log(`${statusColor} [${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url} -> HTTP ${webRes.status}`);
    } catch (err: any) {
      console.error('❌ Erro no gateway local:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro interno no gateway local', details: err?.message }));
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Gateway local ouvindo exclusivamente em http://${HOST}:${PORT}`);
  console.log(`   Health check disponível em: http://${HOST}:${PORT}/health\n`);
});
