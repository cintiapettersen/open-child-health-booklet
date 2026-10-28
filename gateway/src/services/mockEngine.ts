import { Citation, RetrievalResult, SupportedLang } from '../types';

export interface MockAnswerResult {
  answer: string;
  citations: Citation[];
  status: 'success' | 'out_of_catalog';
  safetyDisclaimer: string;
}

export function generateMockAnswer(
  question: string,
  results: RetrievalResult[],
  lang: SupportedLang = 'pt-BR'
): MockAnswerResult {
  const isPt = lang === 'pt-BR';

  const defaultDisclaimer = isPt
    ? 'Aviso Educativo: Esta resposta foi gerada localmente em modo de demonstração com base nas diretrizes oficiais cadastradas. Ela não substitui consulta médica presencial ou acompanhamento pediátrico.'
    : 'Educational Notice: This response was generated locally in demonstration mode based on official guidelines. It does not replace in-person medical evaluation or pediatric care.';

  if (results.length === 0) {
    const outOfCatalogMsg = isPt
      ? `Não encontramos uma orientação oficial específica em nosso catálogo para responder com segurança a esta dúvida ("${question}").\n\nPor responsabilidade clínica, nosso assistente não gera suposições sobre temas sem diretriz oficial cadastrada. Recomendamos conversar com seu pediatra, obstetra ou equipe da Unidade Básica de Saúde (SUS).`
      : `We did not locate specific verified official guidance in our catalog to safely answer this question ("${question}").\n\nOut of clinical responsibility, this assistant does not extrapolate beyond verified guidelines. We recommend consulting your pediatrician, obstetrician, or local primary healthcare team.`;

    return {
      answer: outOfCatalogMsg,
      citations: [],
      status: 'out_of_catalog',
      safetyDisclaimer: defaultDisclaimer
    };
  }

  // Trecho principal com maior pontuação de relevância
  const topResult = results[0];
  const topChunk = topResult.chunk;

  // Filtrar trecho secundário: SOMENTE incluir se for do mesmo tema e tiver pontuação alta
  // Isso impede misturar sono materno com sono do bebê, por exemplo
  let secondaryChunk = null;
  if (results.length > 1) {
    const candidate = results[1];
    if (candidate.chunk.topic === topChunk.topic && candidate.score >= topResult.score * 0.75) {
      secondaryChunk = candidate.chunk;
    }
  }

  // Montar lista de citações precisas para a seção recolhível
  const matchedChunks = secondaryChunk ? [topChunk, secondaryChunk] : [topChunk];
  const citations: Citation[] = matchedChunks.map(c => ({
    id: c.id,
    sourceName: c.sourceName,
    document: c.document,
    edition: c.edition,
    sectionOrPage: c.sectionOrPage,
    url: c.url,
    validationStatus: c.validationStatus,
    countryJurisdiction: c.countryJurisdiction
  }));

  // Resposta conversacional, acolhedora e direta (sem introduções robóticas e sem repetir páginas no corpo)
  let answer = '';

  if (isPt) {
    if (topChunk.conversationalAnswer_pt) {
      answer = topChunk.conversationalAnswer_pt;
    } else {
      answer = topChunk.summary_pt;
    }

    if (secondaryChunk && secondaryChunk.conversationalAnswer_pt) {
      answer += `\n\n${secondaryChunk.conversationalAnswer_pt}`;
    }
  } else {
    if (topChunk.conversationalAnswer_en) {
      answer = topChunk.conversationalAnswer_en;
    } else {
      answer = topChunk.summary_en;
    }

    if (secondaryChunk && secondaryChunk.conversationalAnswer_en) {
      answer += `\n\n${secondaryChunk.conversationalAnswer_en}`;
    }
  }

  return {
    answer,
    citations,
    status: 'success',
    safetyDisclaimer: defaultDisclaimer
  };
}
