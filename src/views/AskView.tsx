import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { Send, ShieldAlert, BookOpen, Sparkles } from 'lucide-react';

interface AskViewProps {
  profile: UserProfile;
}

export const AskView: React.FC<AskViewProps> = ({ profile }) => {
  const { language, t } = useLanguage();
  const [question, setQuestion] = useState('');

  const sampleQuestions = profile.phase === 'pregnancy'
    ? t.ask.sampleQuestionsPregnancy
    : t.ask.sampleQuestionsBaby;

  const localizedStage = getLocalizedStageLabel(profile, language);

  return (
    <div className="content-area">
      <div style={{ marginBottom: '16px' }}>
        <span className="tag-badge tag-sage" style={{ marginBottom: '6px' }}>
          {t.ask.badge}
        </span>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {t.ask.title}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {t.ask.subtitle}
        </p>
      </div>

      {/* Alerta Ético de Segurança */}
      <div
        style={{
          backgroundColor: '#FFF9F2',
          border: '1px solid #F5E6D3',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          marginBottom: '18px'
        }}
      >
        <ShieldAlert size={18} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8rem', color: '#6A5647', lineHeight: 1.4 }}>
          <strong>{t.ask.disclaimerTitle}</strong> {t.ask.disclaimerText}
        </div>
      </div>

      {/* Sugestões de Perguntas Rápidas */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          {t.ask.commonQuestionsTitle} ({localizedStage})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuestion(q)}
              className="btn btn-secondary"
              style={{
                textAlign: 'left',
                justifyContent: 'flex-start',
                padding: '10px 14px',
                minHeight: '44px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <Sparkles size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Caixa de Entrada */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
          {t.ask.inputTitle}
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.ask.inputPlaceholder}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border-light)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            marginBottom: '12px'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-soft)' }}>
            <BookOpen size={14} />
            <span>{t.ask.sourcesNotice}</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 18px', minHeight: '42px', fontSize: '0.88rem' }}
            onClick={() => {
              alert(t.ask.alertComingSoon);
            }}
          >
            <span>{t.ask.consultBtn}</span>
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Nota da Etapa de Implementação */}
      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-soft)', fontSize: '0.78rem' }}>
        🔌 <strong>{t.ask.statusNoticeTitle}</strong> {t.ask.statusNoticeDesc}
      </div>
    </div>
  );
};
