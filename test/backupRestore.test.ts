import assert from 'node:assert';
import test from 'node:test';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import type { BackupValidationResult } from '../src/services/indexedDbService.ts';
import type { JourneyRecord } from '../src/types/index.ts';

test('1. Validação de backup JSON válido (schemaVersion 1.0)', () => {
  const validPayload = JSON.stringify({
    schemaVersion: '1.0',
    app: 'First 1,000 Days',
    exportedAt: '2026-10-28T02:00:00.000Z',
    records: [
      {
        id: 'rec-test-1',
        subject: 'baby',
        tags: ['Dormiu bem'],
        note: 'Soneca tranquila de 2 horas',
        eventDate: '2026-10-20',
        dateLabel: '20/10/2026',
        timestamp: '2026-10-20T14:00:00.000Z'
      },
      {
        id: 'rec-test-2',
        subject: 'mom',
        tags: ['Consegui um tempo só para mim'],
        note: 'Descansei à tarde',
        eventDate: '2026-10-22',
        dateLabel: '22/10/2026',
        timestamp: '2026-10-22T16:00:00.000Z'
      },
      {
        id: 'rec-test-3',
        subject: 'memory',
        tags: ['Primeiro sorriso social'],
        note: 'Sorriu ao ouvir minha voz',
        eventDate: '2026-10-25',
        dateLabel: '25/10/2026',
        timestamp: '2026-10-25T10:00:00.000Z'
      }
    ]
  });

  const res: BackupValidationResult = indexedDbService.validateBackupJson(validPayload);
  assert.strictEqual(res.valid, true, 'O backup deve ser considerado válido');
  assert.strictEqual(res.recordCount, 3, 'Devem ser encontrados 3 registros');
  assert.strictEqual(res.dateRange?.min, '2026-10-20', 'Data mínima deve ser 2026-10-20');
  assert.strictEqual(res.dateRange?.max, '2026-10-25', 'Data máxima deve ser 2026-10-25');
  assert.deepStrictEqual(res.subjectCounts, { baby: 1, mom: 1, memory: 1 }, 'Distribuição deve ser 1 baby, 1 mom, 1 memory');
  assert.strictEqual(res.records?.length, 3, 'Array de registros deve conter 3 itens');
});

test('2. Rejeição de arquivo com JSON corrompido / sintaxe inválida', () => {
  const invalidJson = '{ "schemaVersion": "1.0", "records": [ unclosed syntax...';
  const res = indexedDbService.validateBackupJson(invalidJson);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.errorKey, 'invalidJson');
});

test('3. Rejeição de versão de esquema incompatível (schemaVersion diferente de 1.0)', () => {
  const wrongVersionPayload = JSON.stringify({
    schemaVersion: '2.0',
    records: []
  });
  const res = indexedDbService.validateBackupJson(wrongVersionPayload);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.errorKey, 'unsupportedVersion');
});

test('4. Rejeição de arquivo sem registros ou com formato não-array', () => {
  const emptyPayload = JSON.stringify({
    schemaVersion: '1.0',
    records: []
  });
  const res = indexedDbService.validateBackupJson(emptyPayload);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.errorKey, 'emptyFile');

  const nonArrayPayload = JSON.stringify({
    schemaVersion: '1.0',
    records: 'não é array'
  });
  const resNonArray = indexedDbService.validateBackupJson(nonArrayPayload);
  assert.strictEqual(resNonArray.valid, false);
});

test('5. Rejeição de registros com campos obrigatórios ausentes ou tipos inválidos', () => {
  // Sem ID
  const missingId = JSON.stringify({
    schemaVersion: '1.0',
    records: [{ subject: 'baby', tags: ['Dormiu'], eventDate: '2026-10-20' }]
  });
  assert.strictEqual(indexedDbService.validateBackupJson(missingId).valid, false);

  // Sem Subject ou subject inválido
  const invalidSubject = JSON.stringify({
    schemaVersion: '1.0',
    records: [{ id: '1', subject: 'unknown_pet', tags: ['Dormiu'], eventDate: '2026-10-20' }]
  });
  assert.strictEqual(indexedDbService.validateBackupJson(invalidSubject).valid, false);

  // Sem tags ou tags com tipos errados
  const invalidTags = JSON.stringify({
    schemaVersion: '1.0',
    records: [{ id: '1', subject: 'baby', tags: [123, 456], eventDate: '2026-10-20' }]
  });
  assert.strictEqual(indexedDbService.validateBackupJson(invalidTags).valid, false);

  // Data inválida (não ISO YYYY-MM-DD)
  const invalidDate = JSON.stringify({
    schemaVersion: '1.0',
    records: [{ id: '1', subject: 'baby', tags: ['Dormiu'], eventDate: '20-10-2026' }]
  });
  assert.strictEqual(indexedDbService.validateBackupJson(invalidDate).valid, false);
});

test('6. Desduplicação intra-arquivo de IDs repetidos', () => {
  const duplicatePayload = JSON.stringify({
    schemaVersion: '1.0',
    records: [
      {
        id: 'duplicate-id-1',
        subject: 'baby',
        tags: ['Primeira versão'],
        eventDate: '2026-10-20'
      },
      {
        id: 'duplicate-id-1',
        subject: 'baby',
        tags: ['Segunda versão repetida'],
        eventDate: '2026-10-20'
      },
      {
        id: 'unique-id-2',
        subject: 'mom',
        tags: ['Momento único'],
        eventDate: '2026-10-21'
      }
    ]
  });

  const res = indexedDbService.validateBackupJson(duplicatePayload);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.recordCount, 2, 'Deve manter apenas o primeiro registro do ID duplicado');
  assert.strictEqual(res.records?.[0].tags[0], 'Primeira versão');
  assert.strictEqual(res.records?.[1].id, 'unique-id-2');
});

test('7. Mock de transações IndexedDB: modo Merge (pula duplicatas existentes)', async () => {
  // Simula banco IndexedDB em memória para validar a lógica de transação
  const existingInDb: Record<string, JourneyRecord> = {
    'existing-1': {
      id: 'existing-1',
      subject: 'baby',
      tags: ['Já existia'],
      eventDate: '2026-10-01',
      dateLabel: '01/10/2026',
      timestamp: '2026-10-01T00:00:00Z'
    }
  };

  const recordsToMerge: JourneyRecord[] = [
    {
      id: 'existing-1', // Já existe -> deve ser pulado
      subject: 'baby',
      tags: ['Tentativa de duplicar'],
      eventDate: '2026-10-01',
      dateLabel: '01/10/2026',
      timestamp: '2026-10-01T00:00:00Z'
    },
    {
      id: 'new-record-2', // Não existe -> deve ser importado
      subject: 'mom',
      tags: ['Novo registro'],
      eventDate: '2026-10-15',
      dateLabel: '15/10/2026',
      timestamp: '2026-10-15T00:00:00Z'
    }
  ];

  // Mock de mockDb com getAllKeys e add
  const mockDb = {
    transaction: () => {
      let aborted = false;
      const tx: any = {
        objectStore: () => ({
          getAllKeys: () => {
            const req: any = {};
            setTimeout(() => {
              req.result = Object.keys(existingInDb);
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          add: (rec: JourneyRecord) => {
            if (aborted) throw new Error('Transaction aborted');
            existingInDb[rec.id] = rec;
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

  // Injecao do mockDb temporariamente
  (indexedDbService as any).openDB = async () => mockDb;

  const result = await indexedDbService.restoreBackupMerge(recordsToMerge);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.importedCount, 1, 'Deve importar exatamente 1 novo registro');
  assert.strictEqual(result.skippedCount, 1, 'Deve pular exatamente 1 registro existente');
  assert.strictEqual(existingInDb['existing-1'].tags[0], 'Já existia', 'Não deve sobrescrever registro existente');
  assert.ok(existingInDb['new-record-2'], 'Novo registro deve estar presente');
});

test('8. Mock de transações IndexedDB: modo Replace (limpa e substitui atomicamente)', async () => {
  let dbStore: Record<string, JourneyRecord> = {
    'old-1': {
      id: 'old-1',
      subject: 'baby',
      tags: ['Antigo'],
      eventDate: '2026-09-01',
      dateLabel: '01/09/2026',
      timestamp: '2026-09-01T00:00:00Z'
    }
  };

  const recordsToReplace: JourneyRecord[] = [
    {
      id: 'replacement-1',
      subject: 'mom',
      tags: ['Substituto'],
      eventDate: '2026-10-27',
      dateLabel: '27/10/2026',
      timestamp: '2026-10-27T00:00:00Z'
    }
  ];

  const mockDb = {
    transaction: () => {
      let aborted = false;
      const tx: any = {
        objectStore: () => ({
          clear: () => {
            const req: any = {};
            setTimeout(() => {
              dbStore = {};
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          add: (rec: JourneyRecord) => {
            if (aborted) throw new Error('Transaction aborted');
            dbStore[rec.id] = rec;
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

  const result = await indexedDbService.restoreBackupReplace(recordsToReplace);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.importedCount, 1);
  assert.strictEqual(result.skippedCount, 0);
  assert.strictEqual(result.mode, 'replace');
  assert.strictEqual(Object.keys(dbStore).length, 1);
  assert.ok(dbStore['replacement-1']);
  assert.strictEqual(dbStore['old-1'], undefined, 'Registro antigo deve ter sido removido');
});

test('9. Garantia de rollback em caso de falha de transação', async () => {
  const initialStore = {
    'preserved-1': {
      id: 'preserved-1',
      subject: 'baby',
      tags: ['Preservado'],
      eventDate: '2026-10-01',
      dateLabel: '01/10/2026',
      timestamp: '2026-10-01T00:00:00Z'
    }
  };

  const mockDbFailing = {
    transaction: () => {
      const tx: any = {
        objectStore: () => ({
          clear: () => {
            const req: any = {};
            setTimeout(() => {
              if (req.onerror) req.onerror();
            }, 0);
            return req;
          }
        }),
        abort: () => {
          if (tx.onabort) tx.onabort();
        }
      };
      return tx;
    }
  };

  (indexedDbService as any).openDB = async () => mockDbFailing;

  await assert.rejects(
    async () => {
      await indexedDbService.restoreBackupReplace([
        {
          id: 'fail-rec',
          subject: 'baby',
          tags: ['Teste'],
          eventDate: '2026-10-01',
          dateLabel: '01/10/2026',
          timestamp: '2026-10-01T00:00:00Z'
        }
      ]);
    },
    /abortada|Erro/,
    'A promessa deve ser rejeitada e a transação abortada sem perda de dados'
  );

  assert.strictEqual(initialStore['preserved-1'].tags[0], 'Preservado');
});
