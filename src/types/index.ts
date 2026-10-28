export type UserPhase = 'pregnancy' | 'baby';

export type MainNeed = 
  | 'understand_baby'
  | 'self_care'
  | 'feeding'
  | 'development'
  | 'all';

export type SupportedLanguage = 'pt-BR' | 'en';

export interface UserProfile {
  phase: UserPhase;
  stageValue: number;
  stageLabel: string;
  mainNeed: MainNeed;
  preferredLanguage?: SupportedLanguage;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordSubject = 'baby' | 'mom' | 'memory';

export interface JourneyRecord {
  id: string;
  subject: RecordSubject;
  tags: string[];
  note?: string;
  sourceActivityTitle?: string;
  contentId?: string; // Evita registros duplicados de atividades de Cuidados
  timestamp: string; // ISO string do momento em que o registro foi criado
  eventDate: string; // Data real do acontecimento (permite datas anteriores: YYYY-MM-DD)
  dateLabel: string;
}

export type ActiveTab = 'today' | 'ask' | 'journey' | 'care';

// Tipos para o Catálogo de Conteúdos e Motor de Regras
export type ContentCategory = 
  | 'baby_care'
  | 'mom_care'
  | 'feeding'
  | 'development'
  | 'wellbeing'
  | 'safety_prevention';

export interface ContentItem {
  id: string;
  title: string;
  category: ContentCategory;
  categoryLabel: string;
  audience: 'mom' | 'baby' | 'both';
  phase: 'pregnancy' | 'baby' | 'both';
  minStageMonths?: number;
  maxStageMonths?: number;
  theme: string;
  educationalText: string;
  practicalAction?: string;
  tagLabel?: string;
  source: string;
  validationStatus: 'verified' | 'demonstrative' | 'pending_review';
}

// Tipos para Perguntas Rápidas de Check-in na Home
export type CheckInMood = 'good' | 'neutral' | 'tired' | 'struggling';

export interface CheckInOption {
  id: string;
  label: string;
  feedback: string;
  mood: CheckInMood;
}

export interface CheckInQuestion {
  id: string;
  phase: 'pregnancy' | 'baby' | 'both';
  question: string;
  subtitle: string;
  options: CheckInOption[];
}
