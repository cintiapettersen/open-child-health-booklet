import { UserProfile, SupportedLanguage } from '../types';
import { sanitizeUserInput } from '../../gateway/src/services/piiScrubber';
import { checkEmergencySafety } from '../../gateway/src/services/safetyService';
import { retrieveRelevantEvidence } from '../../gateway/src/services/ragService';
import { generateMockAnswer } from '../../gateway/src/services/mockEngine';

export interface AskCitation {
  id: string;
  sourceName: string;
  document: string;
  edition: string;
  sectionOrPage: string;
  url?: string;
  validationStatus: 'verified' | 'pending_review' | 'demonstrative';
  countryJurisdiction?: 'BR' | 'GLOBAL' | 'WHO';
}

export interface AskResponse {
  status: 'success' | 'emergency' | 'out_of_catalog' | 'rate_limited' | 'error';
  answer: string;
  citations: AskCitation[];
  safetyDisclaimer: string;
  mode: 'mock' | 'gemini-3.5-flash-lite';
  model?: string;
  isEmergency: boolean;
  emergencyPhone?: string;
  retrievedCount: number;
  errorMessage?: string;
  piiWarning?: string;
  executionMs?: number;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  estimatedCost?: {
    totalCostUSD: number;
    promptCostUSD: number;
    candidatesCostUSD: number;
    currency: 'USD';
    isEstimate: boolean;
  };
}

export interface GatewayHealthStatus {
  online: boolean;
  mode?: 'mock' | 'live';
  model?: string;
  evidenceChunksCount?: number;
  dailyRequestsCount?: number;
  dailyQuotaLimit?: number;
  quotaRemaining?: number;
}

const GATEWAY_URL = (import.meta as any).env?.VITE_GATEWAY_URL || 'http://localhost:8787/api/ask';

export async function checkGatewayHealth(): Promise<GatewayHealthStatus> {
  try {
    const healthUrl = GATEWAY_URL.replace(/\/api\/ask$/, '/health');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        mode: data.mode,
        model: data.model,
        evidenceChunksCount: data.evidenceChunksCount,
        dailyRequestsCount: data.dailyRequestsCount,
        dailyQuotaLimit: data.dailyQuotaLimit,
        quotaRemaining: data.quotaRemaining
      };
    }
  } catch {
    // Gateway offline / inalcançável
  }
  return { online: false };
}

export async function consultEducationalAssistant(
  question: string,
  profile: UserProfile,
  lang: SupportedLanguage,
  forceLocalMock: boolean = false
): Promise<AskResponse> {
  const isPt = lang === 'pt-BR';

  // 1. Sanitização local preventiva de PII no cliente (zero envio de dados sensíveis)
  const { sanitized, piiDetected, warning: piiWarning } = sanitizeUserInput(question, lang);

  // 2. Salvaguarda local imediata de emergência (não depende de rede)
  const emergencyCheck = checkEmergencySafety(sanitized, lang);
  if (emergencyCheck.isEmergency) {
    return {
      status: 'emergency',
      answer: emergencyCheck.message || '',
      citations: [],
      safetyDisclaimer: isPt
        ? 'AVISO: Situação potencialmente urgente. Assistência médica presencial necessária.'
        : 'NOTICE: Potentially acute situation. In-person emergency care required.',
      mode: 'mock',
      isEmergency: true,
      emergencyPhone: emergencyCheck.emergencyPhone,
      retrievedCount: 0,
      piiWarning
    };
  }

  // 3. Se o desenvolvedor escolheu explicitamente forçar simulação local no navegador
  if (!forceLocalMock) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      // Disparo estrito de apenas question + phase + stageValue + lang (zero histórico de Jornada)
      const res = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: sanitized,
          phase: profile.phase,
          stageValue: profile.stageValue,
          lang
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Respeitar rigorosamente o status retornado pelo servidor (200, 429, 502, 400)
      const data: AskResponse = await res.json();
      return {
        ...data,
        piiWarning: piiDetected ? piiWarning : undefined
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Se a chamada falhou por aborto ou erro de rede e o gateway não respondeu:
      // Apenas se o endpoint estiver offline reportamos o fallback de simulação local.
    }
  }

  // 4. Fallback Resiliente Local (RAG local in-app em Modo Mock)
  // Permite demonstração contínua e confiável mesmo sem o worker rodando em segundo plano
  await new Promise(r => setTimeout(r, 350));

  const retrieved = retrieveRelevantEvidence(sanitized, profile.phase, lang, 3);
  const mockResult = generateMockAnswer(sanitized, retrieved, lang);

  return {
    status: mockResult.status,
    answer: mockResult.answer,
    citations: mockResult.citations,
    safetyDisclaimer: mockResult.safetyDisclaimer,
    mode: 'mock',
    isEmergency: false,
    retrievedCount: retrieved.length,
    piiWarning
  };
}
