import React, { useState } from 'react';
import { UserProfile, JourneyRecord, ActiveTab, ContentItem } from '../types';
import { CONTENTS_CATALOG } from '../data/contents';
import { journeyStorage } from '../services/journeyStorage';
import { Baby, Flower2, Milk, Sparkles, BookOpen, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface CareViewProps {
  profile: UserProfile;
  onAddRecord: (record: JourneyRecord) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const CareView: React.FC<CareViewProps> = ({ profile, onAddRecord, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activityNote, setActivityNote] = useState<string>('');
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Tudo' },
    { id: 'wellbeing', label: 'Mãe & Bem-estar', icon: Flower2 },
    { id: 'development', label: 'Bebê & Estímulos', icon: Baby },
    { id: 'feeding', label: 'Nutrição & Amamentação', icon: Milk },
    { id: 'baby_care', label: 'Acompanhamento', icon: Sparkles }
  ];

  // Filtra catálogo pela fase da usuária
  const phaseArticles = CONTENTS_CATALOG.filter((item) => {
    if (item.phase !== 'both' && item.phase !== profile.phase) return false;
    if (profile.phase === 'baby') {
      const min = item.minStageMonths ?? 0;
      const max = item.maxStageMonths ?? 24;
      return profile.stageValue >= min && profile.stageValue <= max;
    }
    return true;
  });

  const filteredArticles = selectedCategory === 'all'
    ? phaseArticles
    : phaseArticles.filter((a) => a.category === selectedCategory);

  const handleOpenNoteModal = (artId: string) => {
    setActiveModalId(artId);
    setActivityNote('');
  };

  const handleConfirmActivity = (art: ContentItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeLabel = `Hoje, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: JourneyRecord = {
      id: `rec-care-${Date.now()}`,
      subject: art.audience === 'mom' ? 'mom' : 'baby',
      tags: [art.tagLabel || art.title],
      note: activityNote.trim() || `Pratiquei a orientação de cuidados: "${art.title}"`,
      sourceActivityTitle: art.title,
      contentId: art.id,
      timestamp: now.toISOString(),
      eventDate: todayStr,
      dateLabel: timeLabel
    };

    onAddRecord(newRecord);
    setActiveModalId(null);
    setActivityNote('');
  };

  return (
    <div className="content-area">
      <div style={{ marginBottom: '18px' }}>
        <span className="tag-badge tag-warm" style={{ marginBottom: '6px' }}>
          Biblioteca de Cuidados
        </span>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Orientações Práticas
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Ações recomendadas para {profile.stageLabel}. Ao concluir, você pode salvá-las na sua Jornada.
        </p>
      </div>

      {/* Filtros em Pílulas */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px' }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--border-light)',
                backgroundColor: isSelected ? 'var(--primary)' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Artigos e Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredArticles.map((art) => {
          const isRecordedToday = journeyStorage.hasActivityBeenRecorded(art.id);
          const isModalOpen = activeModalId === art.id;

          return (
            <div key={art.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="tag-badge tag-sage" style={{ fontSize: '0.72rem' }}>
                  {art.categoryLabel}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldCheck size={12} color="var(--sage)" /> Fonte Oficial
                </span>
              </div>

              <h2 className="card-title" style={{ fontSize: '1.1rem', marginTop: '4px' }}>
                {art.title}
              </h2>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.45 }}>
                {art.educationalText}
              </p>

              {art.practicalAction && (
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
                  <strong>Prática recomendada:</strong> {art.practicalAction}
                </div>
              )}

              {/* Botão de Registro com Observação Opcional e Prevenção de Toques Repetidos */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-soft)', marginBottom: '10px' }}>
                  <BookOpen size={12} />
                  <span>{art.source}</span>
                </div>

                {art.practicalAction && (
                  <div>
                    {!isRecordedToday ? (
                      !isModalOpen ? (
                        <button
                          onClick={() => handleOpenNoteModal(art.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            border: '1px solid var(--primary)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Check size={14} />
                          <span>Fiz essa atividade hoje</span>
                        </button>
                      ) : (
                        <div style={{ backgroundColor: '#FAF7F2', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                            Quer adicionar uma observação? (opcional)
                          </div>
                          <textarea
                            value={activityNote}
                            onChange={(e) => setActivityNote(e.target.value)}
                            placeholder="Como foi a experiência? O bebê curtiu?"
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
                              onClick={() => setActiveModalId(null)}
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
                              onClick={() => handleConfirmActivity(art)}
                              className="btn btn-primary"
                              style={{ width: 'auto', minHeight: '36px', padding: '6px 14px', fontSize: '0.8rem' }}
                            >
                              Confirmar na Jornada
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--sage)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> Atividade já registrada na Jornada hoje!
                        </span>
                        <button
                          onClick={() => onNavigate('journey')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          Ver na Jornada <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
