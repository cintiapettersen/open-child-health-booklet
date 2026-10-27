import React, { useState } from 'react';
import { UserProfile, UserPhase, MainNeed } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { getLocalizedStageLabel } from '../locales';
import { Baby, Heart, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { language, t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<UserPhase>('baby');
  const [stageValue, setStageValue] = useState<number>(2); // Padrão: 2 meses
  const [mainNeed, setMainNeed] = useState<MainNeed>('understand_baby');

  const handleSelectPhase = (selectedPhase: UserPhase) => {
    setPhase(selectedPhase);
    if (selectedPhase === 'pregnancy') {
      setStageValue(24);
    } else {
      setStageValue(2);
    }
    setStep(2);
  };

  const handleSelectStage = (val: number) => {
    setStageValue(val);
    setStep(3);
  };

  const handleFinish = (need: MainNeed) => {
    setMainNeed(need);
    const tempProfile: UserProfile = {
      phase,
      stageValue,
      stageLabel: '',
      mainNeed: need,
      preferredLanguage: language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tempProfile.stageLabel = getLocalizedStageLabel(tempProfile, language);
    onComplete(tempProfile);
  };

  return (
    <div className="content-area" style={{ paddingTop: '20px' }}>
      {/* Topo do Onboarding com seletor discreto de idioma */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '16px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                height: '4px',
                flex: 1,
                borderRadius: '2px',
                backgroundColor: s <= step ? 'var(--primary)' : 'var(--border-light)',
                transition: 'background-color 0.2s ease'
              }}
            />
          ))}
        </div>
        <LanguageSelector compact />
      </div>

      {step === 1 && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <span className="tag-badge tag-primary" style={{ marginBottom: '8px' }}>
              {t.onboarding.welcomeBadge}
            </span>
            <h1 className="card-title" style={{ fontSize: '1.45rem', marginTop: '6px' }}>
              {t.onboarding.step1Title}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.step1Subtitle}
            </p>
          </div>

          <div className="choice-list">
            <button
              onClick={() => handleSelectPhase('pregnancy')}
              className={`choice-option ${phase === 'pregnancy' ? 'selected' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="choice-icon-wrap">
                  <Heart size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.onboarding.phasePregnancyTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.onboarding.phasePregnancyDesc}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-soft)" />
            </button>

            <button
              onClick={() => handleSelectPhase('baby')}
              className={`choice-option ${phase === 'baby' ? 'selected' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="choice-icon-wrap">
                  <Baby size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.onboarding.phaseBabyTitle}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.onboarding.phaseBabyDesc}
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-soft)" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <span className="tag-badge tag-sage" style={{ marginBottom: '8px' }}>
              {t.onboarding.stageBadge}
            </span>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              {t.onboarding.step2Title}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.step2Subtitle}
            </p>
          </div>

          <div className="choice-list">
            {(phase === 'pregnancy' ? t.onboarding.pregnancyStages : t.onboarding.babyStages).map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelectStage(item.value)}
                className={`choice-option ${stageValue === item.value ? 'selected' : ''}`}
              >
                <span>{item.label}</span>
                <ChevronRight size={18} color="var(--text-soft)" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            style={{
              marginTop: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← {t.onboarding.backBtn}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <span className="tag-badge tag-warm" style={{ marginBottom: '8px' }}>
              {t.onboarding.focusBadge}
            </span>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              {t.onboarding.step3Title}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.step3Subtitle}
            </p>
          </div>

          <div className="choice-list">
            {(Object.keys(t.onboarding.needs) as MainNeed[]).map((key) => {
              const item = t.onboarding.needs[key];
              const isSelected = mainNeed === key;
              return (
                <button
                  key={key}
                  onClick={() => handleFinish(key)}
                  className={`choice-option ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  {isSelected ? (
                    <Check size={18} color="var(--primary)" />
                  ) : (
                    <ChevronRight size={18} color="var(--text-soft)" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(2)}
            style={{
              marginTop: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← {t.onboarding.backBtn}
          </button>
        </div>
      )}
    </div>
  );
};
