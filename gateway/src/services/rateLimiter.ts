import { CONFIG } from '../config';
import { KVNamespaceLike } from '../types';

/**
 * ============================================================================
 * GOVERNANÇA DE RATE LIMIT E LIMITAÇÃO ARQUITETURAL EM CLOUDFLARE WORKERS
 * ============================================================================
 * 
 * 1. LIMITAÇÃO DA MEMÓRIA VOLÁTIL (IN-MEMORY):
 *    No Cloudflare Workers, instâncias V8 (isolates) rodam distribuídas em centenas
 *    de edge data centers (PoPs). Variáveis de módulo (`Map`, objetos) NÃO são
 *    compartilhadas entre instâncias e são resetadas quando o isolate reinicia
 *    (cold start) ou quando o worker é reimplantado.
 * 
 * 2. SOLUÇÃO PERSISTENTE (CLOUDFLARE KV):
 *    Para ambientes de produção compartilhados globalmente, o Gateway suporta o
 *    binding `env.RATE_LIMIT_KV`. Quando presente, as contagens são registradas
 *    no Cloudflare KV com expiração automática (TTL), garantindo persistência e
 *    coordenação multi-região.
 * 
 * 3. FALLBACK LOCAL PARA DESENVOLVIMENTO:
 *    Quando `RATE_LIMIT_KV` não está configurado (ex: desenvolvimento local e testes
 *    automatizados), o módulo utiliza um Map em memória volátil, permitindo execução
 *    autocontida e sem custos de infraestrutura.
 */

interface RateRecord {
  timestamps: number[];
}

interface DailyQuotaRecord {
  date: string;
  count: number;
}

// Armazenamento em memória volátil (reiniciado conforme ciclo de vida do worker)
const inMemoryRateMap = new Map<string, RateRecord>();
let inMemoryDailyQuotaRecord: DailyQuotaRecord = {
  date: new Date().toISOString().slice(0, 10),
  count: 0
};

// Sal temporário diário para hash unidirecional (sem persistência permanente de IP)
const EPHEMERAL_SALT = 'f1k-salt-' + Math.random().toString(36).substring(2, 10);

export async function hashIp(clientIp: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${clientIp}-${today}-${EPHEMERAL_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function checkRateLimit(
  hashedClient: string,
  maxPerWindow: number = CONFIG.RATE_LIMIT_PER_WINDOW,
  windowSeconds: number = CONFIG.RATE_LIMIT_WINDOW_SECONDS,
  kv?: KVNamespaceLike
): Promise<{ allowed: boolean; remaining: number }> {
  // Se houver binding persistente Cloudflare KV, utilizar armazenamento compartilhado com TTL
  if (kv) {
    try {
      const windowSlot = Math.floor(Date.now() / (windowSeconds * 1000));
      const key = `ratelimit:${hashedClient}:${windowSlot}`;
      const rawCount = await kv.get(key);
      const current = rawCount ? parseInt(rawCount, 10) : 0;

      if (current >= maxPerWindow) {
        return { allowed: false, remaining: 0 };
      }

      await kv.put(key, String(current + 1), { expirationTtl: windowSeconds * 2 });
      return { allowed: true, remaining: maxPerWindow - (current + 1) };
    } catch {
      // Fallback gracioso para memória caso o KV apresente timeout temporário
    }
  }

  // Fallback em memória volátil local (isolado por edge node)
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const record = inMemoryRateMap.get(hashedClient) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= maxPerWindow) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  validTimestamps.push(now);
  inMemoryRateMap.set(hashedClient, { timestamps: validTimestamps });

  return {
    allowed: true,
    remaining: maxPerWindow - validTimestamps.length
  };
}

export async function checkGlobalDailyQuota(
  maxDaily: number = CONFIG.DAILY_GLOBAL_QUOTA,
  kv?: KVNamespaceLike
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10);

  // Se houver binding persistente Cloudflare KV
  if (kv) {
    try {
      const key = `quota:${today}`;
      const rawCount = await kv.get(key);
      const current = rawCount ? parseInt(rawCount, 10) : 0;

      if (current >= maxDaily) {
        return { allowed: false, remaining: 0 };
      }

      await kv.put(key, String(current + 1), { expirationTtl: 86400 * 2 });
      return { allowed: true, remaining: maxDaily - (current + 1) };
    } catch {
      // Fallback para memória em caso de falha transitória
    }
  }

  // Fallback em memória volátil local
  if (inMemoryDailyQuotaRecord.date !== today) {
    inMemoryDailyQuotaRecord = { date: today, count: 0 };
  }

  if (inMemoryDailyQuotaRecord.count >= maxDaily) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  inMemoryDailyQuotaRecord.count += 1;
  return {
    allowed: true,
    remaining: maxDaily - inMemoryDailyQuotaRecord.count
  };
}

export function getDailyQuotaStatus(): { count: number; date: string } {
  return { ...inMemoryDailyQuotaRecord };
}
