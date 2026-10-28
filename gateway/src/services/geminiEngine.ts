import { Citation, RetrievalResult, SupportedLang, TokenUsage, EstimatedCost } from '../types';
import { CONFIG } from '../config';

export interface GeminiEngineResponse {
  answer: string;
  citations: Citation[];
  status: 'success' | 'out_of_catalog' | 'error';
  errorMessage?: string;
  usage?: TokenUsage;
  estimatedCost?: EstimatedCost;
}

/**
 * Calcula o custo estimado com base na tabela oficial do Google AI Studio (Plano Pago):
 * - Gemini 3.5 Flash-Lite:
 *   - Entrada: US$ 0,30 por milhão de tokens
 *   - Saída: US$ 2,50 por milhão de tokens (inclui tokens de resposta e raciocínio/thoughts)
 * Fonte: https://ai.google.dev/gemini-api/docs/pricing
 */
export function calculateEstimatedCost(usage?: TokenUsage): EstimatedCost | undefined {
  if (!usage) return undefined;

  const promptTokens = usage.promptTokens;
  // A tarifa de saída da Google inclui candidatesTokens e thoughtsTokens
  const outputTokens = usage.candidatesTokens + (usage.thoughtsTokens || 0);

  const promptCostUSD = (promptTokens / 1_000_000) * CONFIG.PRICING_PER_1M_INPUT_USD;
  const candidatesCostUSD = (outputTokens / 1_000_000) * CONFIG.PRICING_PER_1M_OUTPUT_USD;
  const totalCostUSD = promptCostUSD + candidatesCostUSD;

  return {
    promptCostUSD,
    candidatesCostUSD,
    totalCostUSD,
    currency: 'USD',
    isEstimate: true
  };
}

export async function callGeminiFlashLite(
  apiKey: string,
  model: string = CONFIG.DEFAULT_MODEL,
  question: string,
  retrievedResults: RetrievalResult[],
  lang: SupportedLang = 'pt-BR'
): Promise<GeminiEngineResponse> {
  const isPt = lang === 'pt-BR';

  if (retrievedResults.length === 0) {
    return {
      answer: isPt
        ? 'Não encontramos orientações oficiais específicas em nosso catálogo para responder com segurança a esta dúvida. Por responsabilidade ética, recomendamos consultar seu médico ou equipe de saúde.'
        : 'We did not find verified official evidence in our catalog to answer this specific question. We recommend consulting your healthcare team.',
      citations: [],
      status: 'out_of_catalog'
    };
  }

  const citations: Citation[] = retrievedResults.map(r => ({
    id: r.chunk.id,
    sourceName: r.chunk.sourceName,
    document: r.chunk.document,
    edition: r.chunk.edition,
    sectionOrPage: r.chunk.sectionOrPage,
    url: r.chunk.url,
    validationStatus: r.chunk.validationStatus,
    countryJurisdiction: r.chunk.countryJurisdiction
  }));

  // Context formatting
  const contextText = retrievedResults.map((r, i) => {
    const c = r.chunk;
    const summary = isPt ? c.summary_pt : c.summary_en;
    const title = isPt ? c.title_pt : c.title_en;
    return `[FONTE ${i + 1}] ID: ${c.id}\nTítulo: ${title}\nDocumento: ${c.document} (${c.edition}), ${c.sectionOrPage}\nConteúdo Verificado: ${summary}`;
  }).join('\n\n');

  // Instruções de sistema refinadas: resposta direta, acolhedora, sem saudações longas e sem citações redundantes no corpo
  const systemInstruction = isPt
    ? `Você é o assistente educativo de saúde materno-infantil "Primeiros 1.000 Dias".
SUAS REGRAS ESTRITAS DE CONDUTA:
1. Priorize respostas objetivas: comece respondendo DIRETAMENTE ao que foi perguntado logo no primeiro parágrafo, trazendo primeiro as orientações práticas e relevantes de cuidado, acolhimento e suporte. Deixe explicações contextuais ou causas para os parágrafos seguintes.
2. NUNCA use saudações longas (como "Olá! Que alegria falar com você..."), introduções prolixas ou agradecimentos repetitivos.
3. Responda à dúvida baseando-se ESTRITAMENTE nos trechos de contexto oficial fornecidos abaixo. NUNCA atribua causas exclusivas ou invente explicações que não constem comprovadamente do contexto oficial.
4. Mantenha um tom acolhedor, empático, claro e respeitoso para as famílias, organizado em parágrafos curtos. Ao listar sugestões práticas, coloque cada item em sua própria linha iniciando com "• ".
5. NUNCA faça diagnósticos clínicos e NUNCA prescreva remédios ou dosagens.
6. NUNCA invente informações. Se o contexto oficial fornecido não responder à pergunta com segurança, diga com gentileza que o catálogo oficial não cobre esse detalhe e recomende avaliação médica presencial.
7. NÃO inclua listas de referências bibliográficas, números de página ou nomes de documentos no corpo do texto (a interface do aplicativo já exibe as fontes estruturadas na seção recolhível "Consultar fontes").
8. Responda em português brasileiro.`
    : `You are the "First 1,000 Days" maternal-infant educational assistant.
YOUR STRICT CODE OF CONDUCT:
1. Prioritize objective answers: begin by answering the question DIRECTLY in the first paragraph, presenting practical and relevant comfort and care guidance first. Leave additional background explanations or causes for subsequent paragraphs.
2. NEVER use long greetings, excessive pleasantries, or robotic intros.
3. Base your answer STRICTLY on the official context snippets provided below. NEVER assert exclusive unverified causes not found in the official context.
4. Maintain a warm, empathetic, clear, and reassuring tone with short, readable paragraphs. When listing practical suggestions, place each item on its own separate line starting with "• ".
5. NEVER provide clinical diagnoses and NEVER prescribe medications or dosages.
6. NEVER fabricate information. If the provided context does not address the question safely, state with transparency that the verified catalog does not contain this specific guidance and recommend in-person healthcare evaluation.
7. DO NOT include bibliographic citations, page numbers, or document lists in the body text (the UI displays sources separately in a collapsible "View sources" section).
8. Respond in English.`;

  const userPrompt = `CONTEXTO OFICIAL RECUPERADO:\n${contextText}\n\nPERGUNTA DO USUÁRIO:\n"${question}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2, // Baixa temperatura para maximizar fidelidade às fontes
      maxOutputTokens: 600
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      return {
        answer: '',
        citations: [],
        status: 'error',
        errorMessage: `Google AI Studio API error (${res.status}): ${errText.slice(0, 100)}`
      };
    }

    const data: any = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        answer: '',
        citations: [],
        status: 'error',
        errorMessage: 'Resposta vazia retornada pelo modelo de IA.'
      };
    }

    const usageMetadata = data?.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
    const thoughtsTokens = usageMetadata?.thoughtsTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + candidatesTokens + thoughtsTokens);

    const usage: TokenUsage | undefined = usageMetadata ? {
      promptTokens,
      candidatesTokens,
      totalTokens,
      thoughtsTokens
    } : undefined;

    const estimatedCost = calculateEstimatedCost(usage);

    return {
      answer: candidateText.trim(),
      citations,
      status: 'success',
      usage,
      estimatedCost
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      answer: '',
      citations: [],
      status: 'error',
      errorMessage: err.name === 'AbortError' ? 'Timeout ao consultar API do Gemini.' : err.message
    };
  }
}
