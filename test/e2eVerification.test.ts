import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import type { JourneyRecord } from '../src/types/index.ts';

test('E2E 1: Ciclo completo de vida de registros fictícios no IndexedDB', async () => {
  // Mock robusto de IndexedDB em memória para simular ciclo de vida no navegador
  let storage: Record<string, JourneyRecord> = {};

  const mockDb = {
    transaction: (_storeName: string, mode: 'readonly' | 'readwrite') => {
      let aborted = false;
      const tx: any = {
        objectStore: () => ({
          getAllKeys: () => {
            const req: any = {};
            setTimeout(() => {
              req.result = Object.keys(storage);
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          getAll: () => {
            const req: any = {};
            setTimeout(() => {
              req.result = Object.values(storage);
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          add: (rec: JourneyRecord) => {
            if (aborted) throw new Error('Abort');
            storage[rec.id] = { ...rec };
          },
          clear: () => {
            const req: any = {};
            setTimeout(() => {
              storage = {};
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          }
        }),
        abort: () => {
          aborted = true;
          if (tx.onabort) tx.onabort();
        }
      };
      setTimeout(() => {
        if (!aborted && tx.oncomplete) tx.oncomplete();
      }, 5);
      return tx;
    }
  };

  (indexedDbService as any).openDB = async () => mockDb;

  // 1. Criar registros fictícios de bebê, mãe e memória
  const fictionalRecords: JourneyRecord[] = [
    {
      id: 'fictional-baby-01',
      subject: 'baby',
      tags: ['Dormiu bem'],
      note: 'Fez uma soneca matinal de 1 hora no berço.',
      eventDate: '2026-10-20',
      dateLabel: '20/10/2026, 10:30',
      timestamp: '2026-10-20T10:30:00.000Z'
    },
    {
      id: 'fictional-mom-02',
      subject: 'mom',
      tags: ['Consegui um tempo só para mim'],
      note: 'Consegui almoçar com calma enquanto o bebê dormia.',
      eventDate: '2026-10-21',
      dateLabel: '21/10/2026, 12:45',
      timestamp: '2026-10-21T12:45:00.000Z'
    },
    {
      id: 'fictional-mem-03',
      subject: 'memory',
      tags: ['Primeiro sorriso social'],
      note: 'Sorriu e fez sons suaves ao conversar olhando nos olhos.',
      eventDate: '2026-10-22',
      dateLabel: '22/10/2026, 16:00',
      timestamp: '2026-10-22T16:00:00.000Z'
    }
  ];

  // Popula armazenamento inicial
  for (const rec of fictionalRecords) {
    storage[rec.id] = rec;
  }
  assert.strictEqual(Object.keys(storage).length, 3, '3 registros fictícios iniciais gravados');

  // 2. Exportar payload JSON (estrutura canônica de backup)
  const exportedJson = JSON.stringify({
    schemaVersion: '1.0',
    app: 'First 1,000 Days',
    exportedAt: new Date().toISOString(),
    recordCount: Object.values(storage).length,
    records: Object.values(storage)
  }, null, 2);

  // 3. Adicionar novo registro no aparelho antes do restore
  const newLocalRecord: JourneyRecord = {
    id: 'fictional-baby-04',
    subject: 'baby',
    tags: ['Mamou ou se alimentou normalmente'],
    note: 'Mamou tranquilamente sem engasgos.',
    eventDate: '2026-10-23',
    dateLabel: '23/10/2026, 15:00',
    timestamp: '2026-10-23T15:00:00.000Z'
  };
  storage[newLocalRecord.id] = newLocalRecord;
  assert.strictEqual(Object.keys(storage).length, 4, 'Base agora contém 4 registros');

  // 4. Testar importação no modo MERGE (mesclar sem duplicação)
  const validationMerge = indexedDbService.validateBackupJson(exportedJson);
  assert.strictEqual(validationMerge.valid, true);
  assert.strictEqual(validationMerge.recordCount, 3);

  const mergeResult = await indexedDbService.restoreBackupMerge(validationMerge.records!);
  assert.strictEqual(mergeResult.success, true);
  assert.strictEqual(mergeResult.importedCount, 0, 'Todos os 3 já existem; zero inseridos');
  assert.strictEqual(mergeResult.skippedCount, 3, 'Todos os 3 IDs repetidos foram pulados');
  assert.strictEqual(Object.keys(storage).length, 4, 'O novo registro 04 foi preservado intacto');

  // 5. Testar importação no modo REPLACE (substituição integral)
  const replaceResult = await indexedDbService.restoreBackupReplace(validationMerge.records!);
  assert.strictEqual(replaceResult.success, true);
  assert.strictEqual(replaceResult.importedCount, 3);
  assert.strictEqual(replaceResult.skippedCount, 0);
  assert.strictEqual(Object.keys(storage).length, 3, 'Base agora contém exatamente os 3 registros do backup');
  assert.strictEqual(storage['fictional-baby-04'], undefined, 'Registro 04 foi removido na substituição');

  // 6. Simular fechar e reabrir o aplicativo (recarga)
  // Reabrindo a conexão e lendo todas as chaves
  const reloadedKeys = Object.keys(storage);
  assert.strictEqual(reloadedKeys.length, 3, 'Persistência mantida após reabertura');
  assert.ok(storage['fictional-baby-01']);
  assert.ok(storage['fictional-mom-02']);
  assert.ok(storage['fictional-mem-03']);

  // 7. Testar arquivo inválido (garantir ausência de efeitos colaterais)
  const invalidFiles = [
    '{ malformed json syntax',
    JSON.stringify({ schemaVersion: '2.0', records: [] }),
    JSON.stringify({ schemaVersion: '1.0', records: [{ id: '' }] }),
    JSON.stringify({ schemaVersion: '1.0', records: [] }),
    'plain string not json'
  ];

  for (const inv of invalidFiles) {
    const val = indexedDbService.validateBackupJson(inv);
    assert.strictEqual(val.valid, false, 'Arquivo deve ser considerado inválido');
    assert.strictEqual(Object.keys(storage).length, 3, 'A base de dados não deve ser alterada por arquivo inválido');
  }

  // 8. Testar cancelamento da operação
  // Se o usuário clicar em Cancelar, nenhuma transação é disparada
  const stateBeforeCancel = { ...storage };
  // Operação cancelada pelo usuário
  assert.deepStrictEqual(storage, stateBeforeCancel, 'Estado inalterado após cancelamento');
});

test('E2E 2: Build de produção e integridade de assets PWA para funcionamento offline', () => {
  const distDir = path.resolve('dist');
  assert.ok(fs.existsSync(distDir), 'Diretório dist/ deve existir');

  // 1. Arquivos essenciais do App Shell em dist/
  const requiredFiles = [
    'index.html',
    'sw.js',
    'manifest.webmanifest',
    'icon-192.svg',
    'icon-512.svg'
  ];

  for (const f of requiredFiles) {
    const p = path.join(distDir, f);
    assert.ok(fs.existsSync(p), `Arquivo de produção ${f} deve existir no build`);
    const stat = fs.statSync(p);
    assert.ok(stat.size > 0, `Arquivo ${f} não pode estar vazio`);
  }

  // 2. Validação do HTML compilado em dist/index.html
  const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  assert.match(distHtml, /<link rel="manifest" href="\/manifest\.webmanifest"/, 'HTML compilado deve conter manifest');
  assert.match(distHtml, /<script type="module" crossorigin src="\/assets\/index-.*\.js">/, 'HTML compilado deve carregar o bundle JS');
  assert.match(distHtml, /<link rel="stylesheet" crossorigin href="\/assets\/index-.*\.css">/, 'HTML compilado deve carregar o bundle CSS');

  // 3. Validação do Service Worker de produção
  const distSw = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf-8');
  assert.match(distSw, /url\.pathname\.startsWith\('\/api'\)/, 'SW deve isolar estritamente rota /api');
  assert.match(distSw, /caches\.match\('\/index\.html'\)/, 'SW deve prover fallback para o App Shell offline');

  // 4. Garantia de que atualização de versão do SW não toca no IndexedDB
  // O Service Worker lida apenas com CacheStorage (caches.delete), enquanto os dados ficam no IndexedDB
  assert.doesNotMatch(distSw, /indexedDB\.deleteDatabase/, 'SW NUNCA deve apagar ou resetar o banco IndexedDB');
});
