import { RetrievalResult, SupportedLang, UserPhase } from '../types';
import { EVIDENCE_CATALOG } from '../data/evidenceCatalog';
import { CONFIG } from '../config';

const STOP_WORDS = new Set([
  'como', 'para', 'com', 'que', 'uma', 'um', 'dos', 'das', 'seu', 'sua', 'meu', 'minha',
  'por', 'mais', 'tem', 'ter', 'fazer', 'quando', 'onde', 'qual', 'quais', 'pode', 'devo',
  'posso', 'dar', 'daria', 'dia', 'dias', 'semana', 'semanas', 'mes', 'meses', 'ano', 'anos',
  'estou', 'esta', 'estao', 'estar', 'sobre', 'muito', 'muita', 'algo', 'tudo', 'nesse', 'nessa',
  'bebe', 'baby', 'crianca', 'child', 'infant', 'recem', 'nascido',
  'what', 'how', 'when', 'where', 'with', 'from', 'this', 'that', 'should', 'could', 'have',
  'can', 'give', 'days', 'weeks', 'months', 'years', 'very', 'much', 'about'
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

export function retrieveRelevantEvidence(
  query: string,
  phase?: UserPhase,
  lang: SupportedLang = 'pt-BR',
  topK: number = CONFIG.TOP_K_CHUNKS
): RetrievalResult[] {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0 || normalizedQuery.length < CONFIG.MIN_QUESTION_LENGTH) {
    return [];
  }

  const queryWordSet = new Set(normalizedQuery.split(' '));

  // 1. Identificação precisa de intenções clínicas principais e desambiguação estrita
  const hasSleepDurationIntent =
    normalizedQuery.includes('horas de sono') ||
    normalizedQuery.includes('quantas horas') ||
    normalizedQuery.includes('duracao do sono') ||
    normalizedQuery.includes('duracao sono') ||
    normalizedQuery.includes('tempo de sono') ||
    normalizedQuery.includes('quanto tempo dorme') ||
    normalizedQuery.includes('rotina de sono') ||
    normalizedQuery.includes('sonecas') ||
    normalizedQuery.includes('hours of sleep') ||
    normalizedQuery.includes('how many hours') ||
    normalizedQuery.includes('sleep duration');

  const hasSafeSleepIntent =
    normalizedQuery.includes('posicao') ||
    normalizedQuery.includes('barriga para cima') ||
    normalizedQuery.includes('berco') ||
    normalizedQuery.includes('travesseiro') ||
    normalizedQuery.includes('onde dormir') ||
    normalizedQuery.includes('morte subita') ||
    normalizedQuery.includes('smsl') ||
    normalizedQuery.includes('sufocamento') ||
    normalizedQuery.includes('dormir de lado') ||
    normalizedQuery.includes('dormir de brucos') ||
    normalizedQuery.includes('safe sleep') ||
    normalizedQuery.includes('crib') ||
    normalizedQuery.includes('supine') ||
    normalizedQuery.includes('back to sleep');

  const hasMaternalRestIntent =
    normalizedQuery.includes('mae') ||
    normalizedQuery.includes('puerpera') ||
    normalizedQuery.includes('puerperio') ||
    normalizedQuery.includes('descanso') ||
    normalizedQuery.includes('sono picado') ||
    normalizedQuery.includes('sono fragmentado') ||
    normalizedQuery.includes('rede de apoio') ||
    normalizedQuery.includes('pos parto') ||
    normalizedQuery.includes('cansaco materno') ||
    normalizedQuery.includes('mother') ||
    normalizedQuery.includes('maternal rest') ||
    normalizedQuery.includes('postpartum sleep');

  // Intenção estrita de Soluços (NÃO misturar com cólica)
  const hasHiccupsIntent =
    normalizedQuery.includes('soluco') ||
    normalizedQuery.includes('solucos') ||
    normalizedQuery.includes('solucando') ||
    normalizedQuery.includes('soluca') ||
    normalizedQuery.includes('hiccup') ||
    normalizedQuery.includes('hiccups') ||
    normalizedQuery.includes('hiccuping');

  // Intenção estrita de Cólicas (NÃO misturar com soluço)
  const hasColicIntent =
    normalizedQuery.includes('colica') ||
    normalizedQuery.includes('colicas') ||
    normalizedQuery.includes('dor de colica') ||
    normalizedQuery.includes('gases bebe') ||
    normalizedQuery.includes('como lidar com colica') ||
    normalizedQuery.includes('como lidar com colicas') ||
    normalizedQuery.includes('aliviar colica') ||
    normalizedQuery.includes('barriga dura colica') ||
    normalizedQuery.includes('colic') ||
    normalizedQuery.includes('infant colic') ||
    normalizedQuery.includes('gas pain');

  // Intenção estrita de Choro Persistente / Inconsolável / Como Acalmar
  const hasCryingIntent =
    normalizedQuery.includes('chora muito') ||
    normalizedQuery.includes('choro persistente') ||
    normalizedQuery.includes('nao consigo acalmar') ||
    normalizedQuery.includes('como acalmar') ||
    normalizedQuery.includes('choro inconsolavel') ||
    normalizedQuery.includes('acalmar o bebe') ||
    normalizedQuery.includes('acalmar choro') ||
    normalizedQuery.includes('bebe chora sem parar') ||
    normalizedQuery.includes('bebe chorando muito') ||
    normalizedQuery.includes('crying a lot') ||
    normalizedQuery.includes('persistent crying') ||
    normalizedQuery.includes('cannot calm') ||
    normalizedQuery.includes('inconsolable');

  // Intenção estrita de Pega da Amamentação
  const hasLatchBreastfeedingIntent =
    normalizedQuery.includes('pega') ||
    normalizedQuery.includes('abocanhar') ||
    normalizedQuery.includes('fissura') ||
    normalizedQuery.includes('rachadura') ||
    normalizedQuery.includes('dor ao amamentar') ||
    normalizedQuery.includes('dor no peito') ||
    normalizedQuery.includes('dor para mamar') ||
    normalizedQuery.includes('bico machucado') ||
    normalizedQuery.includes('areola') ||
    normalizedQuery.includes('boquinha de peixe') ||
    normalizedQuery.includes('como amamentar') ||
    normalizedQuery.includes('latch') ||
    normalizedQuery.includes('nipple pain') ||
    normalizedQuery.includes('suckling');

  const scoredResults: RetrievalResult[] = [];

  for (const chunk of EVIDENCE_CATALOG) {
    let phaseMultiplier = 1.0;
    if (phase && chunk.phase !== 'all') {
      if (chunk.phase !== phase) {
        phaseMultiplier = 0.4;
      } else {
        phaseMultiplier = 1.2;
      }
    }

    const titleNorm = normalizeText(lang === 'pt-BR' ? chunk.title_pt : chunk.title_en);
    const summaryNorm = normalizeText(lang === 'pt-BR' ? chunk.summary_pt : chunk.summary_en);
    const keywords = (lang === 'pt-BR' ? chunk.keywords_pt : chunk.keywords_en).map(k => normalizeText(k));

    const titleWords = new Set(tokenize(titleNorm));
    const summaryWords = new Set(tokenize(summaryNorm));

    let score = 0;

    // 2. Pontuação por palavras-chave com prioridade para n-grams e termos compostos
    for (const kw of keywords) {
      if (kw.includes(' ')) {
        // Multi-word phrase (ex: "horas de sono", "como lidar com colicas")
        if (normalizedQuery.includes(kw)) {
          score += 8.0;
        }
      } else {
        // Single word
        if (queryWordSet.has(kw)) {
          score += 3.5;
        } else if (normalizedQuery.includes(kw) && kw.length >= 4) {
          score += 1.5;
        }
      }
    }

    // 3. Pontuação por termos do título
    for (const token of queryTokens) {
      if (titleWords.has(token)) {
        score += 3.0;
      } else if (titleNorm.includes(token) && token.length >= 5) {
        score += 1.5;
      }

      if (summaryWords.has(token)) {
        score += 0.8;
      }
    }

    // 4. Bônus por alinhamento semântico direto de intenção
    if (chunk.topic === 'sleep_duration' && hasSleepDurationIntent) {
      score += 8.0;
    }
    if (chunk.topic === 'safe_sleep' && hasSafeSleepIntent) {
      score += 8.0;
    }
    if (chunk.topic === 'maternal_rest' && hasMaternalRestIntent) {
      score += 8.0;
    }
    if (chunk.id === 'ev-infant-hiccups-03' && hasHiccupsIntent) {
      score += 10.0;
    }
    if (chunk.id === 'ev-infant-colic-14' && hasColicIntent) {
      score += 10.0;
    }
    if (chunk.id === 'ev-infant-crying-15' && hasCryingIntent) {
      score += 10.0;
    }
    if (chunk.topic === 'breastfeeding' && hasLatchBreastfeedingIntent) {
      score += 8.0;
    }

    // 5. Penalidades estritas de desambiguação para evitar misturar temas próximos
    // Se a dúvida for sobre cólicas:
    if (hasColicIntent) {
      if (chunk.id === 'ev-infant-hiccups-03' && !hasHiccupsIntent) {
        score -= 12.0; // Nunca trazer soluços para pergunta de cólica!
      }
      if (chunk.id === 'ev-infant-crying-15' && !hasCryingIntent) {
        score -= 6.0;
      }
      if (chunk.topic === 'breastfeeding' && !hasLatchBreastfeedingIntent) {
        score -= 8.0;
      }
    }

    // Se a dúvida for sobre soluços:
    if (hasHiccupsIntent) {
      if (chunk.id === 'ev-infant-colic-14' && !hasColicIntent) {
        score -= 12.0; // Nunca trazer cólica para pergunta de soluço!
      }
      if (chunk.id === 'ev-infant-crying-15' && !hasCryingIntent) {
        score -= 8.0;
      }
      if (chunk.topic === 'breastfeeding' && !hasLatchBreastfeedingIntent) {
        score -= 8.0; // Mesmo que mencione "depois de mamar", não trazer técnica de pega!
      }
    }

    // Se a dúvida for sobre choro excessivo / como acalmar:
    if (hasCryingIntent) {
      if (chunk.id === 'ev-infant-hiccups-03' && !hasHiccupsIntent) {
        score -= 12.0;
      }
      if (chunk.id === 'ev-infant-colic-14' && !hasColicIntent) {
        score -= 6.0; // Prioriza o acolhimento do choro em vez de presumir cólica
      }
    }

    // Se a dúvida for sobre amamentação / pega:
    if (hasLatchBreastfeedingIntent) {
      if (chunk.id === 'ev-infant-hiccups-03' && !hasHiccupsIntent) {
        score -= 12.0;
      }
      if (chunk.id === 'ev-infant-colic-14' && !hasColicIntent) {
        score -= 10.0;
      }
    }

    // Desambiguação de sono:
    if (hasSleepDurationIntent) {
      if (chunk.topic === 'maternal_rest' && !hasMaternalRestIntent) {
        score -= 10.0;
      }
      if (chunk.topic === 'safe_sleep' && !hasSafeSleepIntent) {
        score -= 6.0;
      }
    }

    if (hasSafeSleepIntent && !hasSleepDurationIntent) {
      if (chunk.topic === 'sleep_duration') {
        score -= 6.0;
      }
      if (chunk.topic === 'maternal_rest' && !hasMaternalRestIntent) {
        score -= 8.0;
      }
    }

    if (hasMaternalRestIntent && !hasSleepDurationIntent && !hasSafeSleepIntent) {
      if (chunk.topic === 'sleep_duration' || chunk.topic === 'safe_sleep') {
        score -= 6.0;
      }
    }

    score *= phaseMultiplier;

    if (score >= CONFIG.RAG_CONFIDENCE_THRESHOLD) {
      scoredResults.push({
        chunk,
        score
      });
    }
  }

  // Ordenação decrescente por relevância
  scoredResults.sort((a, b) => b.score - a.score);

  if (scoredResults.length === 0) {
    return [];
  }

  // 6. Corte relativo dinâmico (Dynamic Relative Cutoff):
  // Não forçar a inclusão de 3 fontes quando apenas uma é suficientemente relevante.
  const topResult = scoredResults[0];
  const filteredResults: RetrievalResult[] = [topResult];

  if (scoredResults.length > 1) {
    const candidate2 = scoredResults[1];
    const relativeScoreRatio = candidate2.score / topResult.score;

    // Critério estrito para documento secundário:
    // Deve atingir pelo menos 70% da pontuação do melhor resultado E possuir coerência temática
    const isSameTopic = candidate2.chunk.topic === topResult.chunk.topic;
    const hasExplicitSecondaryIntent =
      (candidate2.chunk.topic === 'safe_sleep' && hasSafeSleepIntent) ||
      (candidate2.chunk.topic === 'sleep_duration' && hasSleepDurationIntent) ||
      (candidate2.chunk.topic === 'maternal_rest' && hasMaternalRestIntent) ||
      (candidate2.chunk.topic === 'breastfeeding' && hasLatchBreastfeedingIntent) ||
      (candidate2.chunk.id === 'ev-infant-colic-14' && hasColicIntent) ||
      (candidate2.chunk.id === 'ev-infant-hiccups-03' && hasHiccupsIntent) ||
      (candidate2.chunk.id === 'ev-infant-crying-15' && hasCryingIntent);

    if (relativeScoreRatio >= CONFIG.RAG_RELATIVE_CUTOFF_RATIO && (isSameTopic || hasExplicitSecondaryIntent)) {
      filteredResults.push(candidate2);

      // Avaliação para terceiro documento (apenas se o segundo foi aceito e tiver alta coerência)
      if (scoredResults.length > 2) {
        const candidate3 = scoredResults[2];
        const ratio3 = candidate3.score / topResult.score;
        if (ratio3 >= 0.75 && candidate3.chunk.topic === candidate2.chunk.topic) {
          filteredResults.push(candidate3);
        }
      }
    }
  }

  return filteredResults.slice(0, topK);
}
