import React, { useState } from 'react';
import { UserProfile, UserPhase, MainNeed } from '../types';
import { NEED_LABELS } from '../constants/appConfig';
import { Baby, Heart, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<UserPhase>('baby');
  const [stageValue, setStageValue] = useState<number>(2); // Padrão: 2 meses
  const [stageLabel, setStageLabel] = useState<string>('Bebê de 2 meses');
  const [mainNeed, setMainNeed] = useState<MainNeed>('understand_baby');

  const handleSelectPhase = (selectedPhase: UserPhase) => {
    setPhase(selectedPhase);
    if (selectedPhase === 'pregnancy') {
      setStageValue(24);
      setStageLabel('24ª semana de gestação');
    } else {
      setStageValue(2);
      setStageLabel('Bebê de 2 meses');
    }
    setStep(2);
  };

  const pregnancyStages = [
    { value: 12, label: 'Início da gestação (até 12 sem.)' },
    { value: 24, label: 'Meio da gestação (20 a 28 sem.)' },
    { value: 36, label: 'Reta final (32 a 40 sem.)' }
  ];

  const babyStages = [
    { value: 0, label: 'Recém-nascido (primeiro mês)' },
    { value: 2, label: 'Bebê de 2 a 3 meses' },
    { value: 6, label: 'Bebê de 4 a 6 meses' },
    { value: 12, label: 'Bebê de 7 a 12 meses' },
    { value: 24, label: 'Criança de 1 a 2 anos' }
  ];

  const handleSelectStage = (val: number, label: string) => {
    setStageValue(val);
    setStageLabel(label);
    setStep(3);
  };

  const handleFinish = (need: MainNeed) => {
    setMainNeed(need);
    const newProfile: UserProfile = {
      phase,
      stageValue,
      stageLabel,
      mainNeed: need,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onComplete(newProfile);
  };

  return (
    <div className="content-area" style={{ paddingTop: '28px' }}>
      {/* Indicador de passos discreto */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
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

      {step === 1 && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <span className="tag-badge tag-primary" style={{ marginBottom: '8px' }}>
              Boas-vindas
            </span>
            <h1 className="card-title" style={{ fontSize: '1.45rem', marginTop: '6px' }}>
              Em qual momento você está agora?
            </h1>
            <p className="card-subtitle">
              Queremos oferecer orientações no momento certo, sem complicar o seu dia.
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
                  <div style={{ fontWeight: 600 }}>Estou grávida</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Acompanhando a gestação semana a semana
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
                  <div style={{ fontWeight: 600 }}>Meu bebê já nasceu</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Cuidado diário até os 2 anos
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
              {phase === 'pregnancy' ? 'Gestação' : 'Idade do Bebê'}
            </span>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              {phase === 'pregnancy' ? 'Em qual fase da gravidez você está?' : 'Qual a idade aproximada do bebê?'}
            </h1>
            <p className="card-subtitle">
              Isso nos ajuda a calibrar as sugestões práticas para hoje.
            </p>
          </div>

          <div className="choice-list">
            {(phase === 'pregnancy' ? pregnancyStages : babyStages).map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelectStage(item.value, item.label)}
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
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ← Voltar ao passo anterior
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <span className="tag-badge tag-warm" style={{ marginBottom: '8px' }}>
              Seu Foco
            </span>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              O que você mais precisa de apoio hoje?
            </h1>
            <p className="card-subtitle">
              Você poderá mudar isso quando quiser. Sem cobranças ou tarefas extras.
            </p>
          </div>

          <div className="choice-list">
            {(Object.keys(NEED_LABELS) as MainNeed[]).map((key) => {
              const item = NEED_LABELS[key];
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
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ← Voltar ao passo anterior
          </button>
        </div>
      )}
    </div>
  );
};
