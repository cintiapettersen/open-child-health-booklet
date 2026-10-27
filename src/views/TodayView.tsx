import React, { useState, useMemo } from 'react';
import { UserProfile, ActiveTab, CheckInMood, JourneyRecord } from '../types';
import { NEED_LABELS } from '../constants/appConfig';
import { ruleEngine } from '../services/ruleEngine';
import { journeyStorage } from '../services/journeyStorage';
import {
  Sparkles,
  MessageCircleQuestion,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Baby,
  Flower2,
  Check,
  X
} from 'lucide-react';

interface TodayViewProps {
  profile: UserProfile;
  records: JourneyRecord[];
  onNavigate: (tab: ActiveTab) => void;
  onAddRecord: (record: JourneyRecord) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ profile, records, onNavigate, onAddRecord }) => {
  // Check-in do dia selecionado pelo motor de regras
  const checkInQuestion = useMemo(() => ruleEngine.getDailyCheckIn(profile), [profile]);

  // Estados locais do check-in
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<CheckInMood | undefined>(undefined);
  const [isCheckInDismissed, setIsCheckInDismissed] = useState(false);

  // Registro de atividade direta da Home
  const [activityNote, setActivityNote] = useState('');
  const [showNoteModalFor, setShowNoteModalFor] = useState<string | null>(null);

  // Recomendações calculadas pelo motor de regras local
  const recommendations = useMemo(
    () => ruleEngine.getRecommendations(profile, currentMood),
    [profile, currentMood]
  );

  const selectedOption = checkInQuestion.options.find((o) => o.id === selectedOptionId);

  const handleSelectCheckIn = (optionId: string, mood: CheckInMood) => {
    setSelectedOptionId(optionId);
    setCurrentMood(mood);
  };

  const handleCompleteActivity = (contentItem: typeof recommendations.priorityActivity) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeLabel = `Hoje, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: JourneyRecord = {
      id: `rec-home-${Date.now()}`,
      subject: contentItem.audience === 'mom' ? 'mom' : 'baby',
      tags: [contentItem.tagLabel || contentItem.title],
      note: activityNote.trim() || `Pratiquei a orientação de hoje: "${contentItem.title}"`,
      sourceActivityTitle: contentItem.title,
      contentId: contentItem.id,
      timestamp: now.toISOString(),
      eventDate: todayStr,
      dateLabel: timeLabel
    };

    onAddRecord(newRecord);
    setShowNoteModalFor(null);
    setActivityNote('');
  };

  const isPriorityAlreadyRecorded = journeyStorage.hasActivityBeenRecorded(
    recommendations.priorityActivity.id
  );

  return (
    <div className="content-area">
      {/* Saudação Acolhedora */}
      <div style={{ marginBottom: '16px' }}>
        <span className="tag-badge tag-sage" style={{ marginBottom: '6px' }}>
          Hoje com você
        </span>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {profile.phase === 'pregnancy' ? 'Como você está hoje?' : 'Um dia de cada vez'}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Fase: <strong>{profile.stageLabel}</strong> • Foco: <em>{NEED_LABELS[profile.mainNeed]?.title}</em>
        </p>
      </div>

      {/* Resumo Semanal Leve (Sem tom de cobrança) */}
      {(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recent = records.filter((r) => new Date(r.timestamp) >= sevenDaysAgo);
        const babyCount = recent.filter((r) => r.subject === 'baby').length;
        const momCount = recent.filter((r) => r.subject === 'mom').length;
        const memoryCount = recent.filter((r) => r.subject === 'memory').length;

        if (recent.length === 0) return null;

        return (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Seu ritmo nos últimos 7 dias
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                <strong>{recent.length} {recent.length === 1 ? 'momento registrado' : 'momentos registrados'}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({babyCount > 0 ? `${babyCount} do bebê` : ''}
                  {babyCount > 0 && (momCount > 0 || memoryCount > 0) ? ', ' : ''}
                  {momCount > 0 ? `${momCount} seus` : ''}
                  {momCount > 0 && memoryCount > 0 ? ', ' : ''}
                  {memoryCount > 0 ? `${memoryCount} memórias` : ''})
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('journey')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              Ver <ArrowRight size={13} />
            </button>
          </div>
        );
      })()}

      {/* 1. PERGUNTA RÁPIDA DE CHECK-IN (Influencia as orientações) */}
      {!isCheckInDismissed && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}>
          {/* Botão de Pular Discreto */}
          {!selectedOption && (
            <button
              onClick={() => setIsCheckInDismissed(true)}
              title="Pular pergunta por enquanto"
              aria-label="Pular check-in"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>Pular</span>
              <X size={14} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1.08rem', fontWeight: 600, margin: 0 }}>
              {checkInQuestion.question}
            </h2>
          </div>

          {!selectedOption ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {checkInQuestion.subtitle}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {checkInQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectCheckIn(opt.id, opt.mood)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.84rem',
                      padding: '10px 8px',
                      minHeight: '44px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 500
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                <CheckCircle2 size={16} />
                <span>Obrigado por compartilhar</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '6px', lineHeight: 1.45 }}>
                {selectedOption.feedback}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setSelectedOptionId(null);
                    setCurrentMood(undefined);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Alterar resposta
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--sage)', fontWeight: 600 }}>
                  Orientações de hoje ajustadas
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CARD: ORIENTAÇÃO / ATIVIDADE PARA O BEBÊ */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="tag-badge tag-sage">
            <Baby size={13} /> Para o Bebê ({profile.stageLabel})
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
            {recommendations.babyGuidance.categoryLabel}
          </span>
        </div>

        <h3 className="card-title" style={{ fontSize: '1.1rem', marginTop: '4px' }}>
          {recommendations.babyGuidance.title}
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '10px' }}>
          {recommendations.babyGuidance.educationalText}
        </p>

        {recommendations.babyGuidance.practicalAction && (
          <div
            style={{
              backgroundColor: 'var(--sage-light)',
              borderLeft: '3px solid var(--sage)',
              padding: '8px 10px',
              borderRadius: '4px',
              fontSize: '0.82rem',
              color: '#2F4F3E',
              marginBottom: '10px'
            }}
          >
            <strong>Ideia prática:</strong> {recommendations.babyGuidance.practicalAction}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-soft)' }}>
          <BookOpen size={12} />
          <span>{recommendations.babyGuidance.source}</span>
        </div>
      </div>

      {/* 3. CARD: CUIDADO / BEM-ESTAR PARA A MÃE (Ajustado pelo check-in) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="tag-badge tag-primary">
            <Flower2 size={13} /> Cuidado para Você
          </span>
          {currentMood && (
            <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
              Calibrado ao seu momento
            </span>
          )}
        </div>

        <h3 className="card-title" style={{ fontSize: '1.1rem', marginTop: '4px' }}>
          {recommendations.momGuidance.title}
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '10px' }}>
          {recommendations.momGuidance.educationalText}
        </p>

        {recommendations.momGuidance.practicalAction && (
          <div
            style={{
              backgroundColor: 'var(--primary-light)',
              borderLeft: '3px solid var(--primary)',
              padding: '8px 10px',
              borderRadius: '4px',
              fontSize: '0.82rem',
              color: '#703A28',
              marginBottom: '10px'
            }}
          >
            <strong>Para hoje:</strong> {recommendations.momGuidance.practicalAction}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-soft)' }}>
          <BookOpen size={12} />
          <span>{recommendations.momGuidance.source}</span>
        </div>
      </div>

      {/* 4. CARD: ATIVIDADE PRÁTICA VINCULADA AO FOCO DO ONBOARDING COM INTEGRAÇÃO À JORNADA */}
      <div className="card" style={{ border: '1.5px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="tag-badge tag-warm">
            <Sparkles size={13} /> Atividade Prática do seu Foco
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
            Sem cobranças
          </span>
        </div>

        <h3 className="card-title" style={{ fontSize: '1.1rem', marginTop: '4px' }}>
          {recommendations.priorityActivity.title}
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '12px' }}>
          {recommendations.priorityActivity.educationalText}
        </p>

        {recommendations.priorityActivity.practicalAction && (
          <div
            style={{
              backgroundColor: 'var(--warm-gold-light)',
              borderLeft: '3px solid var(--warm-gold)',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#65481E',
              marginBottom: '12px'
            }}
          >
            <strong>Sugestão simples:</strong> {recommendations.priorityActivity.practicalAction}
          </div>
        )}

        {/* Integração com a Jornada: Botão com Modal de Nota Opcional */}
        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
          {!isPriorityAlreadyRecorded ? (
            showNoteModalFor !== recommendations.priorityActivity.id ? (
              <button
                onClick={() => setShowNoteModalFor(recommendations.priorityActivity.id)}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.84rem',
                  minHeight: '42px',
                  padding: '8px 14px',
                  color: 'var(--primary)',
                  borderColor: 'var(--primary)'
                }}
              >
                <Check size={16} />
                <span>Fiz essa atividade hoje</span>
              </button>
            ) : (
              <div style={{ backgroundColor: '#FAF7F2', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Quer adicionar uma observação? (opcional)
                </div>
                <textarea
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  placeholder="Ex: O bebê respondeu bem e se acalmou..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.84rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowNoteModalFor(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleCompleteActivity(recommendations.priorityActivity)}
                    className="btn btn-primary"
                    style={{ width: 'auto', minHeight: '36px', padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Confirmar e Salvar na Jornada
                  </button>
                </div>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--sage)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={15} /> Atividade registrada na Jornada hoje!
              </span>
              <button
                onClick={() => onNavigate('journey')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                Ver na Linha do Tempo <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card de Acesso Rápido ao Assistente */}
      <div
        className="card"
        onClick={() => onNavigate('ask')}
        style={{
          cursor: 'pointer',
          backgroundColor: '#FFFFFF',
          border: '1.5px dashed var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--sage-light)',
            color: 'var(--sage)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <MessageCircleQuestion size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
            Dúvidas sobre os cuidados?
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Consulte respostas baseadas em fontes oficiais (MS / OMS)
          </div>
        </div>
        <ArrowRight size={18} color="var(--text-soft)" />
      </div>
    </div>
  );
};
