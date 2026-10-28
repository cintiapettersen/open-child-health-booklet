export const CONFIG = {
  DEFAULT_MODEL: 'gemini-3.5-flash-lite',
  MAX_QUESTION_LENGTH: 300,
  MIN_QUESTION_LENGTH: 4,
  RATE_LIMIT_PER_WINDOW: 15,
  RATE_LIMIT_WINDOW_SECONDS: 600, // 10 minutos
  DAILY_GLOBAL_QUOTA: 500,
  RAG_CONFIDENCE_THRESHOLD: 4.0,
  RAG_RELATIVE_CUTOFF_RATIO: 0.70,
  TOP_K_CHUNKS: 3,
  MOCK_DELAY_MS: 320,
  DEFAULT_LANG: 'pt-BR' as const,
  EMERGENCY_PHONE_BR: '192 (SAMU) ou 193 (Bombeiros)',
  EMERGENCY_PHONE_INTL: 'Local Emergency Medical Services (e.g., 911, 112, 999)',
  // Tarifas oficiais Google AI Studio (Plano Pago, Outubro 2026):
  // Gemini 3.5 Flash-Lite: Entrada $0.30 / 1M tokens | Saída $2.50 / 1M tokens (inclui raciocínio)
  PRICING_PER_1M_INPUT_USD: 0.30,
  PRICING_PER_1M_OUTPUT_USD: 2.50
};
