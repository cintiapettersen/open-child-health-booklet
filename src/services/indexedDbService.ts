import type { JourneyRecord, UserProfile, SupportedLanguage } from '../types/index.ts';

const DB_NAME = 'first_1000_days_db';
const DB_VERSION = 1;
const STORE_NAME = 'journey_records';

const getTodayISODate = () => new Date().toISOString().split('T')[0];
const getYesterdayISODate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const INITIAL_DEMO_RECORDS: JourneyRecord[] = [
  {
    id: 'rec-demo-1',
    subject: 'baby',
    tags: ['Dormiu bem', 'Mamou ou se alimentou normalmente'],
    note: 'Hoje o dia começou tranquilo. Conseguiu fazer uma soneca de 1h30 direto.',
    timestamp: new Date().toISOString(),
    eventDate: getTodayISODate(),
    dateLabel: 'Hoje, 10:30'
  },
  {
    id: 'rec-demo-2',
    subject: 'mom',
    tags: ['Consegui um tempo só para mim', 'Recebi apoio prático que fez a diferença'],
    note: 'Minha mãe ficou com o bebê na sala e consegui tomar um banho demorado e descansar.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    eventDate: getYesterdayISODate(),
    dateLabel: 'Ontem, 16:00'
  }
];

class IndexedDbService {
  private db: IDBDatabase | null = null;
  public isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;
  public initError: string | null = null;

  // Abre ou inicializa a conexão com o IndexedDB
  public async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    if (!this.isSupported) {
      this.initError = 'IndexedDB não é suportado por este navegador.';
      throw new Error(this.initError);
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by_eventDate', 'eventDate', { unique: false });
          store.createIndex('by_subject', 'subject', { unique: false });
          store.createIndex('by_timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;

        // Se o banco acabou de ser criado e está vazio, insere registros demonstrativos iniciais
        try {
          const count = await this.countRecords(this.db);
          if (count === 0) {
            await this.seedInitialRecords(this.db);
          }
        } catch (e) {
          console.warn('Aviso ao checar registros iniciais do IndexedDB:', e);
        }

        resolve(this.db);
      };

      request.onerror = (event) => {
        const err = (event.target as IDBOpenDBRequest).error;
        this.initError = err ? err.message : 'Falha ao abrir IndexedDB no navegador.';
        reject(new Error(this.initError));
      };
    });
  }

  private countRecords(db: IDBDatabase): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private seedInitialRecords(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      INITIAL_DEMO_RECORDS.forEach((r) => store.add(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Retorna todos os registros ordenados do mais recente para o mais antigo
  public async getRecords(): Promise<JourneyRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as JourneyRecord[];
        // Ordena por eventDate decrescente e timestamp decrescente
        results.sort((a, b) => {
          if (a.eventDate === b.eventDate) {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
          return b.eventDate.localeCompare(a.eventDate);
        });
        resolve(results);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // Salva um registro e retorna a lista atualizada
  public async saveRecord(record: JourneyRecord): Promise<JourneyRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);

      tx.oncomplete = async () => {
        try {
          const all = await this.getRecords();
          resolve(all);
        } catch (err) {
          reject(err);
        }
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  // Verifica se uma atividade de cuidados já foi registrada na data especificada
  public async hasActivityBeenRecorded(contentId: string, eventDate = getTodayISODate()): Promise<boolean> {
    try {
      const records = await this.getRecords();
      return records.some((r) => r.contentId === contentId && r.eventDate === eventDate);
    } catch {
      return false;
    }
  }

  // Limpa todos os registros do IndexedDB de forma explícita
  public async clearAllRecords(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Exportação em formato aberto JSON (Soberania e backup dos dados)
  public exportAsJson(records: JourneyRecord[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(
        {
          schemaVersion: '1.0',
          exportedAt: new Date().toISOString(),
          totalRecords: records.length,
          records
        },
        null,
        2
      )
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `primeiros_1000_dias_backup_${getTodayISODate()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Exportação em resumo de texto legível (para levar ao pediatra ou consulta médica)
  public exportAsTextSummary(
    records: JourneyRecord[],
    profile: UserProfile,
    lang: SupportedLanguage = 'pt-BR'
  ): void {
    const isEn = lang === 'en';
    let summary = isEn
      ? `MONITORING SUMMARY - FIRST 1,000 DAYS\n`
      : `RELATÓRIO DE ACOMPANHAMENTO - PRIMEIROS 1.000 DIAS\n`;
    summary += `${isEn ? 'Export Date' : 'Data de Exportação'}: ${new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR')}\n`;
    summary += `${isEn ? 'Current Stage' : 'Fase Atual'}: ${profile.stageLabel}\n`;
    summary += `${isEn ? 'Total Records' : 'Total de Registros'}: ${records.length}\n`;
    summary += `------------------------------------------------------------\n\n`;

    records.forEach((rec, idx) => {
      let subjectLabel = '';
      if (isEn) {
        subjectLabel = rec.subject === 'baby' ? 'BABY' : rec.subject === 'mom' ? 'MOTHER' : 'MEMORY';
      } else {
        subjectLabel = rec.subject === 'baby' ? 'BEBÊ' : rec.subject === 'mom' ? 'MÃE' : 'MEMÓRIA';
      }

      summary += `[${idx + 1}] ${isEn ? 'Date' : 'Data'}: ${rec.dateLabel} (${rec.eventDate}) | ${isEn ? 'Type' : 'Tipo'}: ${subjectLabel}\n`;
      if (rec.tags && rec.tags.length > 0) {
        summary += `    ${isEn ? 'Tags' : 'Marcações'}: ${rec.tags.join(', ')}\n`;
      }
      if (rec.note) {
        summary += `    ${isEn ? 'Note' : 'Anotação'}: "${rec.note}"\n`;
      }
      if (rec.sourceActivityTitle) {
        summary += `    ${isEn ? 'Practiced Care' : 'Atividade Praticada'}: ${rec.sourceActivityTitle}\n`;
      }
      summary += `\n`;
    });

    summary += isEn
      ? `\n* Document generated locally by the First 1,000 Days application.\n* Not an official medical record. For informational support during pediatric and clinical visits.\n`
      : `\n* Documento gerado localmente pelo aplicativo Primeiros 1.000 Dias.\n* Não constitui prontuário médico oficial. Uso informativo para suporte às consultas de puericultura.\n`;

    const filename = isEn
      ? `pediatric_summary_${getTodayISODate()}.txt`
      : `resumo_puericultura_${getTodayISODate()}.txt`;

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(summary);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Validação estrita de backup JSON antes de qualquer gravação
  public validateBackupJson(rawText: string): BackupValidationResult {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return { valid: false, recordCount: 0, errorKey: 'emptyFile', errorMessage: 'O arquivo está vazio.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { valid: false, recordCount: 0, errorKey: 'invalidJson', errorMessage: 'Arquivo JSON inválido ou corrompido.' };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: 'Estrutura de dados raiz inválida.' };
    }

    if (parsed.schemaVersion !== '1.0') {
      return {
        valid: false,
        recordCount: 0,
        errorKey: 'unsupportedVersion',
        errorMessage: `Versão de esquema "${parsed.schemaVersion || 'desconhecida'}" incompatível (esperado: 1.0).`
      };
    }

    if (!Array.isArray(parsed.records)) {
      return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: 'Campo "records" deve ser uma lista.' };
    }

    if (parsed.records.length === 0) {
      return {
        valid: false,
        recordCount: 0,
        errorKey: 'emptyFile',
        errorMessage: 'O arquivo de backup não contém nenhum registro para restauração.'
      };
    }

    const validRecords: JourneyRecord[] = [];
    const seenIds = new Set<string>();
    const subjects = { baby: 0, mom: 0, memory: 0 };
    let minDate = '';
    let maxDate = '';

    for (let i = 0; i < parsed.records.length; i++) {
      const rec = parsed.records[i];
      if (!rec || typeof rec !== 'object') {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro na posição ${i + 1} inválido.` };
      }

      if (typeof rec.id !== 'string' || !rec.id.trim()) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} sem ID válido.` };
      }

      const cleanId = rec.id.trim();
      if (seenIds.has(cleanId)) {
        // Ignora duplicata interna preservando o primeiro
        continue;
      }
      seenIds.add(cleanId);

      if (!['baby', 'mom', 'memory'].includes(rec.subject)) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} com categoria inválida ("${rec.subject}").` };
      }

      if (!Array.isArray(rec.tags) || !rec.tags.every((t: any) => typeof t === 'string')) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} com tags inválidas.` };
      }

      if (typeof rec.eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rec.eventDate)) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} com data inválida (esperado YYYY-MM-DD).` };
      }

      const dateLabel = typeof rec.dateLabel === 'string' && rec.dateLabel.trim() ? rec.dateLabel.trim() : rec.eventDate;
      const timestamp = typeof rec.timestamp === 'string' && rec.timestamp.trim() ? rec.timestamp.trim() : new Date().toISOString();

      subjects[rec.subject as 'baby' | 'mom' | 'memory']++;

      if (!minDate || rec.eventDate < minDate) minDate = rec.eventDate;
      if (!maxDate || rec.eventDate > maxDate) maxDate = rec.eventDate;

      validRecords.push({
        id: cleanId,
        subject: rec.subject,
        tags: rec.tags,
        note: typeof rec.note === 'string' ? rec.note : '',
        sourceActivityTitle: typeof rec.sourceActivityTitle === 'string' ? rec.sourceActivityTitle : undefined,
        contentId: typeof rec.contentId === 'string' ? rec.contentId : undefined,
        timestamp,
        eventDate: rec.eventDate,
        dateLabel
      });
    }

    return {
      valid: true,
      version: parsed.schemaVersion,
      recordCount: validRecords.length,
      dateRange: validRecords.length > 0 ? { min: minDate, max: maxDate } : undefined,
      subjectCounts: subjects,
      records: validRecords
    };
  }

  // Restauração atômica com Mesclagem (Adicionar sem duplicar IDs existentes)
  public async restoreBackupMerge(recordsToImport: JourneyRecord[]): Promise<RestoreResult> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getAllKeysReq = store.getAllKeys();

      getAllKeysReq.onerror = () => {
        const err = getAllKeysReq.error || new Error('Erro ao consultar chaves existentes no IndexedDB');
        try { tx.abort(); } catch (_) {}
        reject(err);
      };

      getAllKeysReq.onsuccess = () => {
        const existingKeys = new Set((getAllKeysReq.result as string[]).map(String));
        let importedCount = 0;
        let skippedCount = 0;

        for (const rec of recordsToImport) {
          if (existingKeys.has(rec.id)) {
            skippedCount++;
          } else {
            store.add(rec);
            existingKeys.add(rec.id);
            importedCount++;
          }
        }

        tx.oncomplete = () => {
          resolve({
            success: true,
            importedCount,
            skippedCount,
            totalInDb: existingKeys.size,
            mode: 'merge'
          });
        };

        tx.onerror = () => {
          reject(tx.error || new Error('Erro na transação de mesclagem do backup'));
        };

        tx.onabort = () => {
          reject(new Error('Transação de mesclagem abortada. Nenhum dado foi alterado.'));
        };
      };
    });
  }

  // Restauração atômica com Substituição Integral (Sobrescrever histórico)
  public async restoreBackupReplace(recordsToImport: JourneyRecord[]): Promise<RestoreResult> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const clearReq = store.clear();

      clearReq.onerror = () => {
        const err = clearReq.error || new Error('Erro ao limpar a base antes da substituição');
        try { tx.abort(); } catch (_) {}
        reject(err);
      };

      clearReq.onsuccess = () => {
        let importedCount = 0;
        for (const rec of recordsToImport) {
          store.add(rec);
          importedCount++;
        }

        tx.oncomplete = () => {
          resolve({
            success: true,
            importedCount,
            skippedCount: 0,
            totalInDb: importedCount,
            mode: 'replace'
          });
        };

        tx.onerror = () => {
          reject(tx.error || new Error('Erro na transação de substituição do backup'));
        };

        tx.onabort = () => {
          reject(new Error('Transação de substituição abortada. O estado anterior foi preservado.'));
        };
      };
    });
  }
}

export interface BackupValidationResult {
  valid: boolean;
  version?: string;
  recordCount: number;
  dateRange?: { min: string; max: string };
  subjectCounts?: { baby: number; mom: number; memory: number };
  records?: JourneyRecord[];
  errorKey?: 'invalidJson' | 'unsupportedVersion' | 'corruptedRecord' | 'emptyFile';
  errorMessage?: string;
}

export interface RestoreResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  totalInDb: number;
  mode: 'merge' | 'replace';
  errorMessage?: string;
}

export const indexedDbService = new IndexedDbService();
