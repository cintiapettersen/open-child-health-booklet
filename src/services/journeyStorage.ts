import { JourneyRecord } from '../types';

const STORAGE_KEY = 'p1000_journey_records_v1';

const getTodayISODate = () => new Date().toISOString().split('T')[0];
const getYesterdayISODate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const INITIAL_RECORDS: JourneyRecord[] = [
  {
    id: 'rec-1',
    subject: 'baby',
    tags: ['Dormiu bem', 'Mamou ou se alimentou normalmente'],
    note: 'Hoje o dia começou tranquilo. Conseguiu fazer uma soneca de 1h30 direto.',
    timestamp: new Date().toISOString(),
    eventDate: getTodayISODate(),
    dateLabel: 'Hoje, 10:30'
  },
  {
    id: 'rec-2',
    subject: 'mom',
    tags: ['Consegui um tempo só para mim', 'Recebi apoio prático que fez a diferença'],
    note: 'Minha mãe ficou com o bebê na sala e consegui tomar um banho demorado e descansar.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    eventDate: getYesterdayISODate(),
    dateLabel: 'Ontem, 16:00'
  }
];

export const journeyStorage = {
  getRecords(): JourneyRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return INITIAL_RECORDS;
      }
      return JSON.parse(data) as JourneyRecord[];
    } catch (err) {
      console.warn('Erro ao carregar registros da jornada:', err);
      return INITIAL_RECORDS;
    }
  },

  // Verifica se uma atividade de cuidados já foi registrada na data especificada
  hasActivityBeenRecorded(contentId: string, dateStr = getTodayISODate()): boolean {
    const records = this.getRecords();
    return records.some((r) => r.contentId === contentId && r.eventDate === dateStr);
  },

  saveRecord(record: JourneyRecord): JourneyRecord[] {
    try {
      const current = this.getRecords();
      // Insere no topo ordenado
      const updated = [record, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      return [];
    }
  }
};
