import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { translations, TranslationDictionary } from '../locales';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
}

const STORAGE_KEY = 'first_1000_days_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'pt-BR') {
        return saved;
      }
      // Detecção inteligente inicial pelo navegador
      if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')) {
        return 'en';
      }
    } catch {
      // Falha silenciosa de leitura local
    }
    return 'pt-BR'; // Padrão brasileiro
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignora falha de escrita local
    }
  };

  useEffect(() => {
    // Atualiza o atributo lang do HTML para acessibilidade e leitores de tela
    document.documentElement.lang = language === 'pt-BR' ? 'pt-BR' : 'en';
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language]
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
};
