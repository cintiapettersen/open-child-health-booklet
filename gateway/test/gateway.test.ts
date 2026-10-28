import worker from '../src/index';
import { Env } from '../src/types';
import { calculateEstimatedCost } from '../src/services/geminiEngine';

const mockEnv: Env = {
  MOCK_MODE: 'true',
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
  MAX_QUESTION_LENGTH: 300,
  RATE_LIMIT_PER_WINDOW: 100,
  RATE_LIMIT_WINDOW_SECONDS: 600,
  DAILY_GLOBAL_QUOTA: 500,
  ALLOWED_ORIGIN: '*'
};

async function runTests() {
  console.log('🧪 Iniciando Testes Automatizados do Edge Gateway & RAG (Etapa 4A)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // Teste 1: Health check
  {
    const req = new Request('http://localhost:8787/health');
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'GET /health retorna HTTP 200');
    assert(data.status === 'healthy', 'Status do gateway é "healthy"');
    assert(data.mode === 'mock', 'Modo padrão é "mock" (sem custo externo)');
    assert(data.evidenceChunksCount >= 10, `Catálogo oficial carregado com ${data.evidenceChunksCount} trechos verificados`);
  }

  // Teste 2: Consulta Verificada em Português (Sono Seguro)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Qual a posição correta para colocar o bebê para dormir?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Sono Seguro PT) retorna HTTP 200');
    assert(data.status === 'success', 'Status da resposta é "success"');
    assert(data.citations.length > 0, 'Resposta possui citações verificadas');
    assert(data.citations[0].id === 'ev-safe-sleep-01', 'Cita evidência oficial ev-safe-sleep-01');
    assert(data.citations[0].document.includes('Caderneta da Criança'), 'Documento é a Caderneta da Criança');
    assert(data.citations[0].validationStatus === 'verified', 'Status de validação da citação é "verified"');
    assert(data.mode === 'mock', 'Modo retornado é "mock"');
  }

  // Teste 3: Consulta Verificada em Inglês (Amamentação / Pega)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'How do I know if the baby has a proper latch during breastfeeding?',
        phase: 'baby',
        lang: 'en'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Breastfeeding EN) retorna HTTP 200');
    assert(data.status === 'success', 'Status da resposta em inglês é "success"');
    assert(data.citations.length > 0, 'Possui citações');
    assert(data.citations[0].id === 'ev-breastfeeding-latch-02', 'Cita ev-breastfeeding-latch-02');
    assert(data.answer.toLowerCase().includes('latch'), 'Resposta sintetizada em inglês aborda a pega da amamentação');
    assert(!data.answer.includes('Based on verified official guidance'), 'Não utiliza introdução robótica');
    assert(data.citations[0].countryJurisdiction === 'BR', 'Citação preserva indicação da jurisdição nacional');
  }

  // Teste 4: Salvaguarda Conservadora de Emergência (Febre em recém-nascido)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Meu recém-nascido de 15 dias está com febre de 39 graus e gemendo muito',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Emergência) retorna HTTP 200');
    assert(data.status === 'emergency', 'Status identificado como "emergency"');
    assert(data.isEmergency === true, 'Flag isEmergency é true');
    assert(data.emergencyPhone.includes('192'), 'Indica telefone do SAMU 192');
    assert(data.retrievedCount === 0, 'Zero tokens de IA gastos em caso de emergência');
  }

  // Teste 5: Pergunta Fora do Catálogo / Sem Diretriz Verificada
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Posso dar chá de picão preto com bicarbonato para o bebê de 1 semana?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Fora de catálogo) retorna HTTP 200');
    assert(data.status === 'out_of_catalog', 'Status identificado como "out_of_catalog"');
    assert(data.citations.length === 0, 'Zero citações para pergunta sem base comprovada');
    assert(data.answer.includes('Não encontramos uma orientação oficial específica'), 'Recusa responsável e orientação médica');
  }

  // Teste 6: Validação de Entrada (Tamanho Máximo)
  {
    const longQuestion = 'a'.repeat(350);
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: longQuestion,
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    assert(res.status === 400, 'Pergunta excedendo 300 caracteres retorna HTTP 400');
  }

  // Teste 7: Consulta de Gestação (Sono e Cansaço no 1º Trimestre)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'É normal sentir muito sono e cansaço no primeiro trimestre de gravidez?',
        phase: 'pregnancy',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Gestação) retorna HTTP 200');
    assert(data.status === 'success', 'Status da gestação é "success"');
    assert(data.citations.some((c: any) => c.id === 'ev-pregnancy-sleep-fatigue-07'), 'Cita ev-pregnancy-sleep-fatigue-07');
    assert(data.citations[0].document.includes('Caderneta da Gestante'), 'Documento é a Caderneta da Gestante');
  }

  // Teste 8: Emergência em Inglês (Struggling to breathe / blue lips)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'My baby is choking and has blue lips and struggling to breathe',
        phase: 'baby',
        lang: 'en'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Emergency EN) retorna HTTP 200');
    assert(data.status === 'emergency', 'Status é "emergency" em inglês');
    assert(data.isEmergency === true, 'isEmergency flag é true');
    assert(data.answer.includes('URGENT MEDICAL NOTICE'), 'Mensagem de alerta em inglês');
  }

  // Teste 9: Anonimização de PII e aviso de limitação
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Meu nome é Maria Silva e meu CPF é 123.456.789-00. Qual a temperatura da água do banho?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (PII) retorna HTTP 200');
    assert(!data.answer.includes('123.456.789-00'), 'CPF não vazou na resposta');
    assert(data.status === 'success', 'Consulta responde normalmente sobre temperatura do banho');
    assert(data.citations.some((c: any) => c.id === 'ev-bath-water-temp-05'), 'Cita ev-bath-water-temp-05');
  }

  // Teste 10: Requisito Ético Estrito - SEM substituição silenciosa de Mock quando em Live Mode com erro de API
  {
    const liveEnvWithError: Env = {
      ...mockEnv,
      MOCK_MODE: 'false', // Live mode explicitamente ativado
      GEMINI_API_KEY: 'invalid_or_unreachable_key'
    };
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Qual a posição correta para colocar o bebê para dormir?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, liveEnvWithError);
    const data = await res.json();
    assert(res.status === 502, 'Falha real na API do Gemini em Live Mode retorna HTTP 502 (Bad Gateway)');
    assert(data.status === 'error', 'Status é explicitamente "error" (nunca "success")');
    assert(data.mode === 'gemini-3.5-flash-lite', 'Modo permanece identificado como gemini-3.5-flash-lite');
    assert(data.answer.includes('temporariamente indisponível'), 'Explica indisponibilidade sem inventar resposta simulada');
  }

  // Teste 11: Rate Limiting com simulação de Cloudflare KV persistente
  {
    const kvStore = new Map<string, string>();
    const mockKv = {
      async get(key: string) { return kvStore.get(key) || null; },
      async put(key: string, val: string) { kvStore.set(key, val); }
    };

    const kvEnv: Env = {
      ...mockEnv,
      RATE_LIMIT_PER_WINDOW: 2, // Limite baixo para teste
      RATE_LIMIT_KV: mockKv
    };

    const req1 = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '198.51.100.1' },
      body: JSON.stringify({ question: 'Qual a posição para dormir?', lang: 'pt-BR' })
    });
    const res1 = await worker.fetch(req1, kvEnv);
    assert(res1.status === 200, '1ª requisição no KV permitida (HTTP 200)');

    const req2 = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '198.51.100.1' },
      body: JSON.stringify({ question: 'Qual a posição para dormir?', lang: 'pt-BR' })
    });
    const res2 = await worker.fetch(req2, kvEnv);
    assert(res2.status === 200, '2ª requisição no KV permitida (HTTP 200)');

    const req3 = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '198.51.100.1' },
      body: JSON.stringify({ question: 'Qual a posição para dormir?', lang: 'pt-BR' })
    });
    const res3 = await worker.fetch(req3, kvEnv);
    assert(res3.status === 429, '3ª requisição no KV bloqueada por Rate Limit persistente (HTTP 429)');
  }

  // Teste 12: Relevância de Tópico - Duração do sono do bebê (deve recuperar somente 1 fonte relevante)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Quantas horas de sono são recomendadas para um bebê de 2 meses?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Duração do Sono) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante (não força 3 fontes quando apenas 1 é relevante)');
    assert(data.citations[0].id === 'ev-infant-sleep-duration-13', 'Recupera especificamente o trecho de horas de sono do lactente');
    assert(data.citations[0].sourceName.includes('OMS') || data.citations[0].sourceName.includes('WHO'), 'Citação referencia OMS / WHO');
    assert(data.citations[0].edition.includes('2019'), 'Edição é a Diretriz Global de 2019');
    assert(data.citations[0].countryJurisdiction === 'GLOBAL', 'Jurisdição da evidência é GLOBAL');
    assert(!data.citations[0].document.includes('Caderneta da Criança'), 'Não atribui erroneamente à Caderneta da Criança');
    assert(!data.citations.some((c: any) => c.id === 'ev-postpartum-shared-rest-12'), 'NÃO mistura com descanso pós-parto da mãe');
    assert(!data.citations.some((c: any) => c.id === 'ev-safe-sleep-01'), 'NÃO mistura com sono seguro quando o foco é duração');
    assert(data.answer.includes('14') && data.answer.includes('17'), 'Responde diretamente a faixa esperada de horas');
    assert(!data.answer.includes('Com base nas diretrizes oficiais'), 'Resposta em tom acolhedor sem introdução robótica');
  }

  // Teste 13: Sono Seguro (deve distinguir de duração e sono materno)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Qual a posição correta para colocar o bebê para dormir no berço?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Sono Seguro) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante de sono seguro');
    assert(data.citations[0].id === 'ev-safe-sleep-01', 'Cita ev-safe-sleep-01 (Posição e Ambiente Seguro)');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-sleep-duration-13'), 'NÃO traz duração do sono quando a dúvida é posição');
    assert(!data.citations.some((c: any) => c.id === 'ev-postpartum-shared-rest-12'), 'NÃO traz descanso materno');
    assert(data.answer.includes('barriga para cima'), 'Orienta dormir de barriga para cima');
  }

  // Teste 14: Descanso Materno no Pós-Parto (deve distinguir de sono do bebê)
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Como a mãe pode descansar com o sono picado no pós-parto e puerpério?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Descanso Materno) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante de descanso materno');
    assert(data.citations[0].id === 'ev-postpartum-shared-rest-12', 'Cita ev-postpartum-shared-rest-12 (Sono no Pós-Parto)');
    assert(!data.citations.some((c: any) => c.id === 'ev-safe-sleep-01'), 'NÃO traz berço seguro');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-sleep-duration-13'), 'NÃO traz tabela de sono da OMS');
  }

  // Teste 15: Cólicas do Lactente ("Como lidar com cólicas?")
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Como lidar com cólicas?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Cólicas) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante para cólicas');
    assert(data.citations[0].id === 'ev-infant-colic-14', 'Cita especificamente ev-infant-colic-14 (Cólicas do Lactente)');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-hiccups-03'), 'NÃO mistura com soluços');
    assert(!data.citations.some((c: any) => c.id === 'ev-breastfeeding-latch-02'), 'NÃO mistura com técnica de pega');
    assert(!data.answer.includes('Pode ficar tranquila'), 'Evita tranquilizações prematuras ou absolutas');
    assert(data.answer.includes('Não existe um tratamento único ou cura garantida'), 'Esclarece ausência de cura milagrosa garantida');
    assert(data.answer.toLowerCase().includes('cólicas') || data.answer.toLowerCase().includes('colica'), 'Aborda cólicas de forma empática e orientativa');
  }

  // Teste 16: Soluços após a mamada ("Meu bebê soluça depois de mamar. É normal?")
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Meu bebê soluça depois de mamar. É normal?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Soluços pós-mamada) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante para soluços');
    assert(data.citations[0].id === 'ev-infant-hiccups-03', 'Cita especificamente ev-infant-hiccups-03 (Soluços Fisiológicos)');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-colic-14'), 'NÃO mistura com cólicas');
    assert(!data.citations.some((c: any) => c.id === 'ev-breastfeeding-latch-02'), 'NÃO traz amamentação e pega indevidamente');
    assert(!data.answer.includes('Pode ficar tranquila'), 'Evita tranquilizações prematuras ou absolutas');
    assert(data.answer.toLowerCase().includes('soluço') || data.answer.toLowerCase().includes('solucos'), 'Aborda soluços de forma acolhedora e direta');
  }

  // Teste 17: Choro excessivo e como acalmar ("Meu bebê chora muito e não consigo acalmá-lo.")
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Meu bebê chora muito e não consigo acalmá-lo.',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Choro do Bebê) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante para acolhimento do choro');
    assert(data.citations[0].id === 'ev-infant-crying-15', 'Cita especificamente ev-infant-crying-15 (Compreensão do Choro do Bebê)');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-hiccups-03'), 'NÃO mistura com soluços');
    assert(!data.answer.includes('Pode ficar tranquila'), 'Evita tranquilizações prematuras');
    assert(data.answer.includes('comunicação do bebê'), 'Explica o choro como forma primária de comunicação');
  }

  // Teste 18: Pega da Amamentação ("Como melhorar a pega durante a amamentação?")
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Como melhorar a pega durante a amamentação?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Melhorar a Pega) retorna HTTP 200');
    assert(data.status === 'success', 'Status é "success"');
    assert(data.citations.length === 1, 'Recupera EXATAMENTE 1 fonte relevante para pega');
    assert(data.citations[0].id === 'ev-breastfeeding-latch-02', 'Cita ev-breastfeeding-latch-02 (Técnica de Pega Correta)');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-hiccups-03'), 'NÃO mistura com soluços');
    assert(!data.citations.some((c: any) => c.id === 'ev-infant-colic-14'), 'NÃO mistura com cólicas');
  }

  // Teste 19: Pergunta Fora do Catálogo com Resposta Transparente
  {
    const req = new Request('http://localhost:8787/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Posso furar a orelha do bebê com quantos meses?',
        phase: 'baby',
        lang: 'pt-BR'
      })
    });
    const res = await worker.fetch(req, mockEnv);
    const data = await res.json();
    assert(res.status === 200, 'POST /api/ask (Fora de Catálogo) retorna HTTP 200');
    assert(data.status === 'out_of_catalog', 'Status é "out_of_catalog"');
    assert(data.citations.length === 0, 'Zero citações para tema sem evidência cadastrada');
    assert(data.answer.includes('Não encontramos uma orientação oficial específica'), 'Resposta transparente sobre limitação do catálogo');
  }

  // Teste 20: Validação da Fórmula Corrigida de Custos (Gemini 3.5 Flash-Lite)
  {
    const usage = {
      promptTokens: 922,
      candidatesTokens: 288,
      totalTokens: 1210,
      thoughtsTokens: 0
    };
    const cost = calculateEstimatedCost(usage);
    assert(cost !== undefined, 'Estimador de custos retorna objeto de custo');
    assert(cost?.isEstimate === true, 'Custo é explicitamente marcado como isEstimate: true (estimativa teórica)');
    assert(cost?.currency === 'USD', 'Moeda calculada é USD');
    const expected = (922 / 1_000_000) * 0.30 + (288 / 1_000_000) * 2.50;
    assert(Math.abs(cost!.totalCostUSD - expected) < 0.0000001, 'Custo estimado de 922 in / 288 out é ~$0.000997 USD (fórmula oficial)');
    assert(Math.abs(cost!.promptCostUSD - 0.0002766) < 0.0000001, 'Custo de entrada calculado com $0.30 / 1M');
    assert(Math.abs(cost!.candidatesCostUSD - 0.0007200) < 0.0000001, 'Custo de saída calculado com $2.50 / 1M');
  }

  console.log(`\n📊 Resultado dos Testes: ${passed} passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
