import fs from 'node:fs';
import path from 'node:path';

function parseDevVars(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  }
  return vars;
}

async function main() {
  const devVarsPath = path.resolve(process.cwd(), 'gateway/.dev.vars');
  if (!fs.existsSync(devVarsPath)) {
    console.error('❌ ERRO: gateway/.dev.vars não encontrado.');
    process.exit(1);
  }

  const vars = parseDevVars(devVarsPath);
  const apiKey = vars.GEMINI_API_KEY;
  const targetModel = vars.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (!apiKey) {
    console.error('❌ ERRO: GEMINI_API_KEY está vazia ou ausente no arquivo.');
    process.exit(1);
  }

  console.log('✅ Arquivo gateway/.dev.vars carregado.');
  console.log('🔒 Chave lida com segurança (ocultada por sigilo).');
  console.log(`🎯 Modelo alvo pesquisado: "${targetModel}"`);
  console.log('🌐 Consultando exclusivamente o endpoint de metadados: GET /v1beta/models...\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Erro HTTP da API do Google AI Studio (${res.status}): ${errText.slice(0, 200)}`);
    process.exit(1);
  }

  const data: any = await res.json();
  const rawModels: any[] = data?.models || [];
  const modelEntries = rawModels.map((m: any) => ({
    name: m.name.replace(/^models\//, ''),
    displayName: m.displayName || '',
    description: m.description || '',
    supportedGenerationMethods: m.supportedGenerationMethods || []
  }));

  const modelNames = modelEntries.map(m => m.name);
  const isTargetFound = modelNames.includes(targetModel);

  console.log(`📊 Total de modelos ativos listados para esta chave: ${modelNames.length}`);

  if (isTargetFound) {
    const targetEntry = modelEntries.find(m => m.name === targetModel);
    console.log(`\n🎉 SUCESSO: O modelo "${targetModel}" ESTÁ DISPONÍVEL!`);
    console.log(`   Nome Oficial: ${targetEntry?.name}`);
    console.log(`   Display Name: ${targetEntry?.displayName}`);
    console.log(`   Métodos suportados: ${targetEntry?.supportedGenerationMethods.join(', ')}`);
  } else {
    console.log(`\n⚠️  O identificador exato "${targetModel}" NÃO foi retornado na listagem da API.`);
  }

  // Filtrando todos os modelos Flash disponíveis
  const flashModels = modelEntries.filter(m => m.name.toLowerCase().includes('flash'));
  console.log('\n📋 Modelos da família Flash disponíveis para esta chave e projeto:');
  if (flashModels.length > 0) {
    flashModels.forEach(m => {
      console.log(`   • ${m.name} (${m.displayName})`);
    });
  } else {
    console.log('   (Nenhum modelo Flash encontrado na listagem)');
  }

  console.log('\n🛑 Fim da verificação. Nenhuma chamada de geração de conteúdo (generateContent) foi realizada.');
}

main().catch(err => {
  console.error('Erro na verificação:', err.message);
  process.exit(1);
});
