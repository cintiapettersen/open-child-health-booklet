import React from 'react';
import { UserProfile } from '../types';
import { APP_CONFIG } from '../constants/appConfig';
import { RotateCcw } from 'lucide-react';

interface HeaderProps {
  profile: UserProfile | null;
  onResetProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onResetProfile }) => {
  return (
    <header className="app-header">
      <div className="brand-badge">
        <span className="brand-dot" aria-hidden="true"></span>
        <span>{APP_CONFIG.TEMP_NAME}</span>
      </div>

      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="profile-pill">
            {profile.stageLabel}
          </span>
          <button
            onClick={onResetProfile}
            title="Alterar fase ou reiniciar introdução"
            aria-label="Reiniciar introdução"
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
        </div>
      )}
    </header>
  );
};
