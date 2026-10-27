import { SupportedLanguage, UserProfile } from '../types';
import { TranslationDictionary } from './types';
import { ptBR } from './pt-BR';
import { en } from './en';

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  'pt-BR': ptBR,
  en
};

export const getLocalizedStageLabel = (
  profile: UserProfile,
  lang: SupportedLanguage
): string => {
  const isEn = lang === 'en';
  if (profile.phase === 'pregnancy') {
    return isEn
      ? `Week ${profile.stageValue} of pregnancy`
      : `${profile.stageValue}ª semana de gestação`;
  }

  // Fase Bebê
  if (profile.stageValue === 0) {
    return isEn ? 'Newborn (first month)' : 'Recém-nascido (primeiro mês)';
  }
  if (profile.stageValue === 24) {
    return isEn ? 'Toddler (1 to 2 years)' : 'Criança de 1 a 2 anos';
  }
  return isEn
    ? `${profile.stageValue}-month-old baby`
    : `Bebê de ${profile.stageValue} meses`;
};

export * from './types';
export { ptBR, en };
