import { UserProfile } from '../types';
import { APP_CONFIG } from '../constants/appConfig';

/**
 * Armazenamento local das preferências de demonstração do onboarding.
 * NÃO armazena dados clínicos, biometria ou dados médicos reais.
 */
export const profileStorage = {
  getProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEMO_PROFILE);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch (err) {
      console.warn('Erro ao ler perfil demonstrativo do localStorage:', err);
      return null;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.DEMO_PROFILE, JSON.stringify(profile));
    } catch (err) {
      console.error('Erro ao salvar perfil demonstrativo:', err);
    }
  },

  clearProfile(): void {
    try {
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.DEMO_PROFILE);
    } catch (err) {
      console.error('Erro ao limpar perfil:', err);
    }
  }
};
