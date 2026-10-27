import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Selecionar idioma / Select language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        border: '1.5px solid var(--border-light)',
        borderRadius: 'var(--radius-full)',
        padding: compact ? '2px' : '3px 4px',
        gap: '2px'
      }}
    >
      <button
        type="button"
        onClick={() => setLanguage('pt-BR')}
        aria-pressed={language === 'pt-BR'}
        style={{
          border: 'none',
          cursor: 'pointer',
          padding: compact ? '2px 8px' : '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: compact ? '0.72rem' : '0.78rem',
          fontWeight: 700,
          fontFamily: 'inherit',
          backgroundColor: language === 'pt-BR' ? 'var(--primary)' : 'transparent',
          color: language === 'pt-BR' ? '#FFFFFF' : 'var(--text-muted)',
          transition: 'all 0.15s ease'
        }}
      >
        PT
      </button>

      <span
        style={{
          color: 'var(--border-light)',
          fontSize: '0.75rem',
          userSelect: 'none'
        }}
      >
        |
      </span>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        style={{
          border: 'none',
          cursor: 'pointer',
          padding: compact ? '2px 8px' : '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: compact ? '0.72rem' : '0.78rem',
          fontWeight: 700,
          fontFamily: 'inherit',
          backgroundColor: language === 'en' ? 'var(--primary)' : 'transparent',
          color: language === 'en' ? '#FFFFFF' : 'var(--text-muted)',
          transition: 'all 0.15s ease'
        }}
      >
        EN
      </button>
    </div>
  );
};
