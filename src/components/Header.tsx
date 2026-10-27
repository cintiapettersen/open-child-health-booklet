import React from 'react';
import { UserProfile } from '../types';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getLocalizedStageLabel } from '../locales';

interface HeaderProps {
  profile: UserProfile | null;
  onResetProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onResetProfile }) => {
  const { language, t } = useLanguage();

  return (
    <header className="app-header">
      <div className="brand-badge">
        <span className="brand-dot" aria-hidden="true"></span>
        <span>{t.app.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LanguageSelector compact />

        {profile && (
          <>
            <span className="profile-pill">
              {getLocalizedStageLabel(profile, language)}
            </span>
            <button
              onClick={onResetProfile}
              title={t.header.changePhaseTitle}
              aria-label={t.header.changePhaseAria}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-soft)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <RotateCcw size={15} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
