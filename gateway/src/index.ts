import { Env, AskRequestBody, AskResponseBody } from './types';
import { CONFIG } from './config';
import { hashIp, checkRateLimit, checkGlobalDailyQuota, getDailyQuotaStatus } from './services/rateLimiter';
import { sanitizeUserInput } from './services/piiScrubber';
import { checkEmergencySafety } from './services/safetyService';
import { retrieveRelevantEvidence } from './services/ragService';
import { generateMockAnswer } from './services/mockEngine';
import { callGeminiFlashLite } from './services/geminiEngine';
import { EVIDENCE_CATALOG } from './data/evidenceCatalog';

function corsHeaders(origin: string = '*'): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';
    const url = new URL(request.url);

    // 1. Tratamento de CORS Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    // 2. Rota de Health Check / Status
    if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/api/health') {
      const isMock = env.MOCK_MODE !== 'false' || !env.GEMINI_API_KEY;
      const quota = getDailyQuotaStatus();
      const maxDaily = Number(env.DAILY_GLOBAL_QUOTA || CONFIG.DAILY_GLOBAL_QUOTA);

      return new Response(
        JSON.stringify({
          service: 'First 1,000 Days Edge Gateway & RAG',
          status: 'healthy',
          mode: isMock ? 'mock' : 'live',
          model: env.GEMINI_MODEL || CONFIG.DEFAULT_MODEL,
          evidenceChunksCount: EVIDENCE_CATALOG.length,
          dailyRequestsCount: quota.count,
          dailyQuotaLimit: maxDaily,
          quotaRemaining: Math.max(0, maxDaily - quota.count),
          governance: 'DPG Standard & UNICEF FemTech 2026 Compatible'
        }, null, 2),
        { status: 200, headers: corsHeaders(origin) }
      );
    }

    // 3. Rota de Consulta Educativa: POST /api/ask
    if (url.pathname === '/api/ask' && request.method === 'POST') {
      const startTime = Date.now();

      // Identificação efêmera por IP com hash salgado
      const clientIp = request.headers.get('cf-connecting-ip') ||
                       request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                       '127.0.0.1';
      const clientHash = await hashIp(clientIp);

      // Limites de requisições por janela (Rate Limit) com suporte a KV persistente
      const maxPerWindow = Number(env.RATE_LIMIT_PER_WINDOW || CONFIG.RATE_LIMIT_PER_WINDOW);
      const windowSec = Number(env.RATE_LIMIT_WINDOW_SECONDS || CONFIG.RATE_LIMIT_WINDOW_SECONDS);
      const rateCheck = await checkRateLimit(clientHash, maxPerWindow, windowSec, env.RATE_LIMIT_KV);

      if (!rateCheck.allowed) {
        const body: AskResponseBody = {
          status: 'rate_limited',
          answer: 'Limite de consultas temporárias atingido para este dispositivo. Por favor, aguarde alguns minutos antes de fazer nova pergunta.',
          citations: [],
          safetyDisclaimer: '',
          mode: 'mock',
          isEmergency: false,
          retrievedCount: 0,
          errorMessage: 'Rate limit exceeded (15 req/10min)'
        };
        return new Response(JSON.stringify(body), {
          status: 429,
          headers: corsHeaders(origin)
        });
      }

      // Limite global de consumo diário (Daily Quota Cap) com suporte a KV persistente
      const maxDaily = Number(env.DAILY_GLOBAL_QUOTA || CONFIG.DAILY_GLOBAL_QUOTA);
      const quotaCheck = await checkGlobalDailyQuota(maxDaily, env.RATE_LIMIT_KV);
      if (!quotaCheck.allowed) {
        const body: AskResponseBody = {
          status: 'rate_limited',
          answer: 'A cota global diária de consultas do assistente educativo foi atingida para proteger os recursos do projeto. Por favor, consulte a Biblioteca de Cuidados ou tente novamente amanhã.',
          citations: [],
          safetyDisclaimer: '',
          mode: 'mock',
          isEmergency: false,
          retrievedCount: 0,
          errorMessage: 'Daily global quota reached'
        };
        return new Response(JSON.stringify(body), {
          status: 429,
          headers: corsHeaders(origin)
        });
      }

      // Validação do corpo da requisição
      let reqBody: AskRequestBody;
      try {
        reqBody = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Formato JSON inválido.' }),
          { status: 400, headers: corsHeaders(origin) }
        );
      }

      const rawQuestion = reqBody.question?.trim() || '';
      const lang = reqBody.lang === 'en' ? 'en' : 'pt-BR';
      const phase = reqBody.phase;
      const maxLength = Number(env.MAX_QUESTION_LENGTH || CONFIG.MAX_QUESTION_LENGTH);

      if (rawQuestion.length < CONFIG.MIN_QUESTION_LENGTH) {
        return new Response(
          JSON.stringify({
            error: lang === 'pt-BR'
              ? `A pergunta deve conter pelo menos ${CONFIG.MIN_QUESTION_LENGTH} caracteres.`
              : `Question must contain at least ${CONFIG.MIN_QUESTION_LENGTH} characters.`
          }),
          { status: 400, headers: corsHeaders(origin) }
        );
      }

      if (rawQuestion.length > maxLength) {
        return new Response(
          JSON.stringify({
            error: lang === 'pt-BR'
              ? `A pergunta excede o limite máximo de ${maxLength} caracteres.`
              : `Question exceeds the maximum limit of ${maxLength} characters.`
          }),
          { status: 400, headers: corsHeaders(origin) }
        );
      }

      // Salvaguarda I: Detecção e anonimização de PII no servidor
      const { sanitized } = sanitizeUserInput(rawQuestion, lang);

      // Salvaguarda II: Verificação conservadora de emergência clínica aguda
      const emergencyCheck = checkEmergencySafety(sanitized, lang);
      if (emergencyCheck.isEmergency) {
        const emergencyResp: AskResponseBody = {
          status: 'emergency',
          answer: emergencyCheck.message || '',
          citations: [],
          safetyDisclaimer: 'AVISO: Situação potencialmente urgente. Assistência médica presencial imediata necessária.',
          mode: 'mock',
          isEmergency: true,
          emergencyPhone: emergencyCheck.emergencyPhone,
          retrievedCount: 0,
          remainingDailyQuota: quotaCheck.remaining,
          executionMs: Date.now() - startTime
        };
        return new Response(JSON.stringify(emergencyResp), {
          status: 200,
          headers: corsHeaders(origin)
        });
      }

      // RAG: Recuperação dos trechos relevantes no catálogo oficial
      const retrieved = retrieveRelevantEvidence(sanitized, phase, lang, CONFIG.TOP_K_CHUNKS);

      // Determinação do Modo de Execução: Mock vs API Real
      const isMock = env.MOCK_MODE !== 'false' || !env.GEMINI_API_KEY;

      if (isMock) {
        // Simulação de latência edge realista (300ms) sem custo
        await new Promise(res => setTimeout(res, CONFIG.MOCK_DELAY_MS));

        const mockResult = generateMockAnswer(sanitized, retrieved, lang);

        const responseBody: AskResponseBody = {
          status: mockResult.status,
          answer: mockResult.answer,
          citations: mockResult.citations,
          safetyDisclaimer: mockResult.safetyDisclaimer,
          mode: 'mock',
          isEmergency: false,
          retrievedCount: retrieved.length,
          remainingDailyQuota: quotaCheck.remaining,
          executionMs: Date.now() - startTime
        };

        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: corsHeaders(origin)
        });
      } else {
        // Chamada ao Gemini 3.5 Flash-Lite com credencial segura exclusivamente no servidor
        const model = env.GEMINI_MODEL || CONFIG.DEFAULT_MODEL;
        const geminiResult = await callGeminiFlashLite(
          env.GEMINI_API_KEY!,
          model,
          sanitized,
          retrieved,
          lang
        );

        if (geminiResult.status === 'error') {
          // Requisito Ético Estrito: NUNCA substituir silenciosamente uma falha real da API por uma resposta simulada
          const isPt = lang === 'pt-BR';
          const responseBody: AskResponseBody = {
            status: 'error',
            answer: isPt
              ? 'O serviço oficial de inteligência artificial está temporariamente indisponível. Não foi possível consultar o modelo Gemini no momento. Por favor, consulte as diretrizes na Biblioteca de Cuidados ou tente novamente em instantes.'
              : 'The official AI service is temporarily unavailable. Could not query the Gemini model at this time. Please refer to the Care Library guidelines or try again shortly.',
            citations: [],
            safetyDisclaimer: isPt
              ? 'Aviso Ético: Falha na conexão com a IA oficial. Nenhuma resposta simulada foi substituída.'
              : 'Ethical Notice: Official AI connection failure. No simulated response was substituted.',
            mode: 'gemini-3.5-flash-lite',
            isEmergency: false,
            retrievedCount: retrieved.length,
            remainingDailyQuota: quotaCheck.remaining,
            executionMs: Date.now() - startTime,
            errorMessage: geminiResult.errorMessage
          };
          return new Response(JSON.stringify(responseBody), {
            status: 502,
            headers: corsHeaders(origin)
          });
        }

        const isPt = lang === 'pt-BR';
        const responseBody: AskResponseBody = {
          status: geminiResult.status,
          answer: geminiResult.answer,
          citations: geminiResult.citations,
          safetyDisclaimer: isPt
            ? 'Aviso Educativo: Resposta gerada via IA Gemini 3.5 Flash-Lite fundamentada estritamente nos guias oficiais informados. Não substitui consulta médica.'
            : 'Educational Notice: Response generated via Gemini 3.5 Flash-Lite grounded strictly in official guidelines. Does not replace clinical evaluation.',
          mode: 'gemini-3.5-flash-lite',
          model,
          isEmergency: false,
          retrievedCount: retrieved.length,
          remainingDailyQuota: quotaCheck.remaining,
          executionMs: Date.now() - startTime,
          usage: geminiResult.usage,
          estimatedCost: geminiResult.estimatedCost
        };

        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: corsHeaders(origin)
        });
      }
    }

    // 4. Rota não encontrada
    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado.', path: url.pathname }),
      { status: 404, headers: corsHeaders(origin) }
    );
  }
};
