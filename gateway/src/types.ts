export type SupportedLang = 'pt-BR' | 'en';
export type UserPhase = 'pregnancy' | 'baby';

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  GEMINI_API_KEY?: string;
  MOCK_MODE?: string;
  GEMINI_MODEL?: string;
  MAX_QUESTION_LENGTH?: string | number;
  RATE_LIMIT_PER_WINDOW?: string | number;
  RATE_LIMIT_WINDOW_SECONDS?: string | number;
  DAILY_GLOBAL_QUOTA?: string | number;
  ALLOWED_ORIGIN?: string;
  RATE_LIMIT_KV?: KVNamespaceLike;
}

export interface AskRequestBody {
  question: string;
  phase?: UserPhase;
  stageValue?: number;
  lang?: SupportedLang;
}

export type CountryJurisdiction = 'BR' | 'GLOBAL' | 'WHO';

export interface Citation {
  id: string;
  sourceName: string;
  document: string;
  edition: string;
  sectionOrPage: string;
  url?: string;
  validationStatus: 'verified' | 'pending_review' | 'demonstrative';
  countryJurisdiction?: CountryJurisdiction;
}

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  thoughtsTokens?: number;
}

export interface EstimatedCost {
  promptCostUSD: number;
  candidatesCostUSD: number;
  totalCostUSD: number;
  currency: 'USD';
  isEstimate: true;
}

export interface AskResponseBody {
  status: 'success' | 'emergency' | 'out_of_catalog' | 'rate_limited' | 'error';
  answer: string;
  citations: Citation[];
  safetyDisclaimer: string;
  mode: 'mock' | 'gemini-3.5-flash-lite';
  model?: string;
  isEmergency: boolean;
  emergencyPhone?: string;
  retrievedCount: number;
  remainingDailyQuota?: number;
  executionMs?: number;
  errorMessage?: string;
  usage?: TokenUsage;
  estimatedCost?: EstimatedCost;
}

export interface EvidenceChunk {
  id: string;
  phase: 'pregnancy' | 'baby' | 'all';
  stageRange?: string;
  topic: 'safe_sleep' | 'sleep_duration' | 'breastfeeding' | 'maternal_rest' | 'nutrition' | 'development' | 'safety' | 'warning_signs';
  title_pt: string;
  title_en: string;
  summary_pt: string;
  summary_en: string;
  conversationalAnswer_pt?: string;
  conversationalAnswer_en?: string;
  keywords_pt: string[];
  keywords_en: string[];
  sourceName: string;
  document: string;
  edition: string;
  sectionOrPage: string;
  url: string;
  validationStatus: 'verified' | 'pending_review' | 'demonstrative';
  countryJurisdiction: CountryJurisdiction;
}

export interface RetrievalResult {
  chunk: EvidenceChunk;
  score: number;
}
