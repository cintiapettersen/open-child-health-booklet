import fs from 'node:fs';
import path from 'node:path';
import { retrieveRelevantEvidence } from '../src/services/ragService';
import { callGeminiFlashLite } from '../src/services/geminiEngine';
import { CONFIG } from '../src/config';

interface DevVars {
  GEMINI_API_KEY?: string;
  MOCK_MODE?: string;
  GEMINI_MODEL?: string;
}

function parseDevVars(filePath: string): DevVars {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars: DevVars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim() as keyof DevVars;
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  }
  return vars;
}

async function verifyModelAvailability(apiKey: string, targetModel: string): Promise<{ available: boolean; availableModels?: string[]; error?: string }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      return { available: false, error: `HTTP ${res.status}: ${errText.slice(0, 150)}` };
    }
    const data: any = await res.json();
    const models: any[] = data?.models || [];
    const modelNames = models.map((m: any) => m.name.replace(/^models\//, ''));
    
    const isTargetAvailable = modelNames.includes(targetModel);
    return {
      available: isTargetAvailable,
      availableModels: modelNames
    };
  } catch (err: any) {
    return { available: false, error: err.message };
  }
}

async function main() {
  console.log('🔒 ========================================================');
  console.log('🔒 First 1,000 Days | Teste Controlado Gemini (Etapa 4C)');
  console.log('🔒 ========================================================\n');

  // 1. Localização e leitura de gateway/.dev.vars
  const devVarsPath = path.resolve(process.cwd(), 'gateway/.dev.vars');
  if (!fs.existsSync(devVarsPath)) {
    console.error('❌ ERRO: Arquivo gateway/.dev.vars não encontrado!');
    console.error('👉 Por favor, configure gateway/.dev.vars com sua chave exclusiva do First 1,000 Days:');
    console.error('   GEMINI_API_KEY=sua_chave');
    console.error('   MOCK_MODE=false');
    console.error('   GEMINI_MODEL=gemini-3.5-flash-lite\n');
    process.exit(1);
  }

  const devVars = parseDevVars(devVarsPath);
  const apiKey = devVars.GEMINI_API_KEY;
  const targetModel = devVars.GEMINI_MODEL || CONFIG.DEFAULT_MODEL;

  if (!apiKey || apiKey === 'coloque_sua_chave_aqui' || apiKey === 'sua_chave_do_google_ai_studio_aqui') {
    console.error('❌ ERRO: GEMINI_API_KEY não foi configurada em gateway/.dev.vars!');
    process.exit(1);
  }

  console.log('✅ Arquivo gateway/.dev.vars detectado (protegido pelo .gitignore).');
  console.log('✅ Chave da API carregada na memória (NÃO exibida por segurança).');
  console.log(`🎯 Modelo alvo solicitado: ${targetModel}\n`);

  // 2. Verificação de disponibilidade do modelo na conta/projeto
  console.log(`🔍 Verificando disponibilidade de "${targetModel}" no projeto Google AI Studio...`);
  const check = await verifyModelAvailability(apiKey, targetModel);

  if (check.error) {
    console.error(`❌ Falha na autenticação ou consulta ao Google AI Studio: ${check.error}`);
    process.exit(1);
  }

  if (!check.available) {
    console.warn(`\n⚠️  ATENÇÃO: O modelo "${targetModel}" NÃO foi listado entre os modelos disponíveis para esta chave.`);
    console.warn('📋 Modelos Flash disponíveis encontrados no seu projeto:');
    const flashModels = (check.availableModels || []).filter(m => m.includes('flash'));
    if (flashModels.length > 0) {
      flashModels.forEach(m => console.warn(`   - ${m}`));
    } else {
      (check.availableModels || []).slice(0, 10).forEach(m => console.warn(`   - ${m}`));
    }
    console.warn('\n🛑 INTERRUPÇÃO SEGURA: Conforme a diretriz da Etapa 4C, nenhuma substituição automática foi realizada.');
    console.warn('👉 Por favor, selecione qual dos modelos acima deve ser adotado.');
    process.exit(2);
  }

  console.log(`✅ Modelo "${targetModel}" confirmado e disponível para esta chave!\n`);

  // 3. Execução do teste único autorizado
  const authorizedQuestion = 'Quantas horas de sono são recomendadas para um bebê de 2 meses?';
  const phase = 'baby';
  const stageValue = 2;
  const lang = 'pt-BR';

  console.log('🧪 Executando a chamada única autorizada:');
  console.log(`   Pergunta: "${authorizedQuestion}"`);
  console.log(`   Contexto: phase=${phase}, stageValue=${stageValue}, lang=${lang}`);

  // Recuperação RAG
  const retrieved = retrieveRelevantEvidence(authorizedQuestion, phase, lang, CONFIG.TOP_K_CHUNKS);
  console.log(`📚 Trechos oficiais recuperados do catálogo: ${retrieved.length}`);
  retrieved.forEach((r, idx) => {
    console.log(`   [${idx + 1}] ID: ${r.chunk.id} | Fonte: ${r.chunk.sourceName} | Doc: ${r.chunk.document} (${r.chunk.edition})`);
  });

  console.log('\n⏳ Enviando requisição real à API do Google AI Studio...');
  const startTime = Date.now();
  const response = await callGeminiFlashLite(apiKey, targetModel, authorizedQuestion, retrieved, lang);
  const latencyMs = Date.now() - startTime;

  if (response.status === 'error') {
    console.error(`\n❌ Falha na chamada da API: ${response.errorMessage}`);
    console.error(`⏱️ Latência registrada: ${latencyMs}ms`);
    process.exit(1);
  }

  console.log('\n================ RESULTADO DA EXECUÇÃO REAL ================');
  console.log(`Status: ${response.status.toUpperCase()}`);
  console.log(`Modelo Utilizado: ${targetModel}`);
  console.log(`Latência: ${latencyMs}ms`);
  
  if (response.usage) {
    const promptTokens = response.usage.promptTokens;
    const candidatesTokens = response.usage.candidatesTokens;
    const thoughtsTokens = response.usage.thoughtsTokens || 0;
    const totalTokens = response.usage.totalTokens;
    const outputTokens = candidatesTokens + thoughtsTokens;

    // Tabela oficial Gemini 3.5 Flash-Lite no plano pago (Google AI Studio):
    // Entrada: $0.30 / 1,000,000 tokens
    // Saída: $2.50 / 1,000,000 tokens (inclui tokens de resposta e raciocínio/thoughts)
    // Fonte: https://ai.google.dev/gemini-api/docs/pricing
    const promptCost = (promptTokens / 1_000_000) * 0.30;
    const outputCost = (outputTokens / 1_000_000) * 2.50;
    const estimatedCostUSD = promptCost + outputCost;

    console.log(`Tokens de Entrada (Prompt): ${promptTokens}`);
    console.log(`Tokens de Saída (Resposta): ${candidatesTokens}`);
    if (thoughtsTokens > 0) {
      console.log(`Tokens de Raciocínio (Thoughts): ${thoughtsTokens}`);
    }
    console.log(`Tokens Totais: ${totalTokens}`);
    console.log(`Custo Estimado Teórico: $${estimatedCostUSD.toFixed(7)} USD (~R$ ${(estimatedCostUSD * 5.7).toFixed(5)})`);
    console.log('Nota de Faturamento: Valor acima é uma estimativa calculada pela tabela oficial do Google AI Studio; o valor real faturado dependerá do relatório do Google Cloud Console.');
  } else {
    console.log('Metadados de consumo: Não reportados pelo endpoint.');
  }

  console.log('\n--- TEXTO COMPLETO DA RESPOSTA GERADA ---');
  console.log(response.answer);
  console.log('-----------------------------------------');

  console.log('\n--- FONTES EFETIVAMENTE CITADAS ---');
  response.citations.forEach((c, idx) => {
    console.log(`[${idx + 1}] ${c.sourceName} - ${c.document} (${c.edition}) | ${c.sectionOrPage}`);
    if (c.url) console.log(`    URL: ${c.url}`);
    console.log(`    Status: ${c.validationStatus} | Jurisdição: ${c.countryJurisdiction || 'N/A'}`);
  });
  console.log('============================================================\n');

  console.log('🔒 Teste único concluído com sucesso.');
  console.log('🔒 Garantia de segurança: Nenhuma outra chamada foi disparada.');

  // 4. Reversão estrita para modo Mock
  try {
    const rawContent = fs.readFileSync(devVarsPath, 'utf-8');
    const updatedContent = rawContent.replace(/MOCK_MODE\s*=\s*false/i, 'MOCK_MODE=true');
    fs.writeFileSync(devVarsPath, updatedContent, 'utf-8');
    console.log('🔄 Modo Mock reativado com sucesso em gateway/.dev.vars (MOCK_MODE=true).\n');
  } catch (err: any) {
    console.warn('Aviso: Não foi possível reescrever MOCK_MODE=true automaticamente:', err.message);
  }
}

main().catch(err => {
  console.error('Erro inesperado durante o teste:', err.message);
  process.exit(1);
});
