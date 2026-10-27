/**
 * Configurações e Nomes Provisórios
 * Totalmente desacoplados e facilmente configuráveis.
 */
export const APP_CONFIG = {
  // Nome provisório editável a qualquer momento
  TEMP_NAME: 'Primeiros 1.000 Dias',
  TAGLINE: 'Seu companheiro de cuidado, apoio e orientação',
  SUBTITLE: 'Da gestação aos dois anos de vida',
  VERSION: '0.1.0-mvp',
  STORAGE_KEYS: {
    DEMO_PROFILE: 'p1000_demo_profile_v1'
  }
};

export const NEED_LABELS: Record<string, { title: string; subtitle: string; icon: string }> = {
  understand_baby: {
    title: 'Entender o bebê',
    subtitle: 'Choro, sono, sinais e rotinas do dia a dia',
    icon: 'HeartHandshake'
  },
  self_care: {
    title: 'Cuidar de mim',
    subtitle: 'Descanso, emoções, autocuidado e apoio materno',
    icon: 'Flower2'
  },
  feeding: {
    title: 'Amamentação e Alimentação',
    subtitle: 'Pega, livre demanda, introdução alimentar e nutrição',
    icon: 'Milk'
  },
  development: {
    title: 'Acompanhar o desenvolvimento',
    subtitle: 'Estímulos, marcos motores e conquistas de cada fase',
    icon: 'Sparkles'
  },
  all: {
    title: 'Um pouco de tudo',
    subtitle: 'Orientações equilibradas para cada momento',
    icon: 'Compass'
  }
};
