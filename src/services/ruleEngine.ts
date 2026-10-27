import { ContentItem, UserProfile, CheckInMood, SupportedLanguage } from '../types';
import { getContentCatalog } from '../data/contents';
import { getCheckinQuestions } from '../data/checkins';

const VIEWED_STORAGE_KEY = 'p1000_viewed_content_ids_v1';

export interface DailyRecommendations {
  babyGuidance: ContentItem;
  momGuidance: ContentItem;
  priorityActivity: ContentItem;
}

export const ruleEngine = {
  // Histórico local de conteúdos visualizados recentemente
  getViewedIds(): string[] {
    try {
      const data = localStorage.getItem(VIEWED_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  markAsViewed(id: string): void {
    try {
      const current = this.getViewedIds();
      // Guarda até os últimos 15 IDs para evitar repetição recente sem bloquear reaparecimento futuro
      const updated = [id, ...current.filter((item) => item !== id)].slice(0, 15);
      localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignora erro de escrita silenciosamente
    }
  },

  // Seleciona a pergunta de check-in do dia (rotativa conforme o dia da semana ou fase)
  getDailyCheckIn(profile: UserProfile, dayOffset = 0, lang: SupportedLanguage = 'pt-BR') {
    const questions = getCheckinQuestions(lang);
    const applicable = questions.filter(
      (q) => q.phase === 'both' || q.phase === profile.phase
    );
    const dayIndex = (new Date().getDay() + dayOffset) % applicable.length;
    return applicable[dayIndex];
  },

  // Seleciona as 3 orientações do dia combinando fase, prioridade, check-in e histórico
  getRecommendations(
    profile: UserProfile,
    currentMood?: CheckInMood,
    lang: SupportedLanguage = 'pt-BR'
  ): DailyRecommendations {
    const viewedIds = this.getViewedIds();
    const catalog = getContentCatalog(lang);

    // 1. Filtra catálogo pela fase da usuária (pregnancy vs baby)
    const phaseCatalog = catalog.filter((c) => {
      if (c.phase !== 'both' && c.phase !== profile.phase) return false;
      if (profile.phase === 'baby') {
        const min = c.minStageMonths ?? 0;
        const max = c.maxStageMonths ?? 24;
        return profile.stageValue >= min && profile.stageValue <= max;
      }
      return true;
    });

    // Função auxiliar com ponderação por frescor (não vistos recentemente têm prioridade)
    const pickBest = (candidates: ContentItem[]): ContentItem => {
      if (candidates.length === 0) {
        return catalog[0];
      }
      // Prioriza itens não vistos recentemente
      const unviewed = candidates.filter((c) => !viewedIds.includes(c.id));
      if (unviewed.length > 0) {
        return unviewed[0];
      }
      return candidates[0];
    };

    // --- CARD 1: ORIENTAÇÃO / ATIVIDADE PARA O BEBÊ ---
    const babyCandidates = phaseCatalog.filter(
      (c) => c.audience === 'baby' || c.category === 'development' || c.category === 'baby_care'
    );
    const babyGuidance = pickBest(babyCandidates);

    // --- CARD 2: CUIDADO / BEM-ESTAR PARA A MÃE (INFLUENCIADO PELO CHECK-IN) ---
    let momCandidates = phaseCatalog.filter(
      (c) => c.audience === 'mom' || c.category === 'wellbeing' || c.category === 'mom_care'
    );

    // Se a mãe relatou cansaço ou dificuldade no check-in, prioriza conteúdos de descanso e autocompaixão
    if (currentMood === 'tired' || currentMood === 'struggling') {
      const restOriented = momCandidates.filter(
        (c) => c.id === 'mom-rest-fragmented' || c.id === 'mom-self-compassion'
      );
      if (restOriented.length > 0) {
        momCandidates = restOriented;
      }
    } else if (currentMood === 'good') {
      // Se relatou boa disposição, pode sugerir movimento suave ou nutrição
      const activeOriented = momCandidates.filter(
        (c) => c.id === 'mom-gentle-movement' || c.id === 'mom-hydration-energy'
      );
      if (activeOriented.length > 0) {
        momCandidates = activeOriented;
      }
    }
    const momGuidance = pickBest(momCandidates);

    // --- CARD 3: ATIVIDADE PRÁTICA VINCULADA À PRIORIDADE DO ONBOARDING ---
    let priorityCandidates = phaseCatalog.filter((c) => c.practicalAction);

    switch (profile.mainNeed) {
      case 'understand_baby':
        priorityCandidates = priorityCandidates.filter(
          (c) => c.category === 'development' || c.category === 'baby_care'
        );
        break;
      case 'self_care':
        priorityCandidates = priorityCandidates.filter(
          (c) => c.category === 'wellbeing' || c.category === 'mom_care'
        );
        break;
      case 'feeding':
        priorityCandidates = priorityCandidates.filter((c) => c.category === 'feeding');
        break;
      case 'development':
        priorityCandidates = priorityCandidates.filter((c) => c.category === 'development');
        break;
      case 'all':
      default:
        // Mantém todos com ação prática
        break;
    }

    // Garante que não repete exatamente os cards 1 e 2
    priorityCandidates = priorityCandidates.filter(
      (c) => c.id !== babyGuidance.id && c.id !== momGuidance.id
    );

    const priorityActivity = pickBest(
      priorityCandidates.length > 0 ? priorityCandidates : phaseCatalog
    );

    return {
      babyGuidance,
      momGuidance,
      priorityActivity
    };
  }
};
