import React, { useState } from 'react';
import { UserProfile, JourneyRecord, ActiveTab, ContentItem } from '../types';
import { getContentCatalog } from '../data/contents';
import { journeyStorage } from '../services/journeyStorage';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { Baby, Flower2, Milk, Sparkles, BookOpen, Check, ArrowRight, ShieldCheck, Shield, AlertCircle } from 'lucide-react';

interface CareViewProps {
  profile: UserProfile;
  onAddRecord: (record: JourneyRecord) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const CareView: React.FC<CareViewProps> = ({ profile, onAddRecord, onNavigate }) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activityNote, setActivityNote] = useState<string>('');
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: t.care.catAll },
    { id: 'safety_prevention', label: t.care.catSafety, icon: Shield },
    { id: 'wellbeing', label: t.care.catMom, icon: Flower2 },
    { id: 'development', label: t.care.catDevelopment, icon: Baby },
    { id: 'feeding', label: t.care.catFeeding, icon: Milk },
    { id: 'baby_care', label: t.care.catMonitoring, icon: Sparkles }
  ];

  // Catálogo no idioma ativo
  const catalog = getContentCatalog(language);

  // Filtra catálogo pela fase da usuária
  const phaseArticles = catalog.filter((item) => {
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
    const timeLabel = `${t.journey.dateTodayPrefix}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const defaultNote = language === 'en'
      ? `Practiced care guidance: "${art.title}"`
      : `Pratiquei a orientação de cuidados: "${art.title}"`;

    const newRecord: JourneyRecord = {
      id: `rec-care-${Date.now()}`,
      subject: art.audience === 'mom' ? 'mom' : 'baby',
      tags: [art.tagLabel || art.title],
      note: activityNote.trim() || defaultNote,
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

  const localizedStage = getLocalizedStageLabel(profile, language);

  return (
    <div className="content-area">
      <div style={{ marginBottom: '18px' }}>
        <span className="tag-badge tag-warm" style={{ marginBottom: '6px' }}>
          {t.care.badge}
        </span>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {t.care.title}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {language === 'en'
            ? `Recommended actions for ${localizedStage}. Once completed, you can log them to your Journey.`
            : `Ações recomendadas para ${localizedStage}. Ao concluir, você pode salvá-las na sua Jornada.`}
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
                {art.validationStatus === 'verified' && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--sage)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} color="var(--sage)" /> {language === 'en' ? 'Official Guideline' : 'Fonte Oficial'}
                  </span>
                )}
                {art.validationStatus === 'pending_review' && (
                  <span style={{ fontSize: '0.72rem', color: '#99631E', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <AlertCircle size={12} color="#99631E" /> {language === 'en' ? 'Under Clinical Review' : 'Em Revisão Clínica'}
                  </span>
                )}
                {art.validationStatus === 'demonstrative' && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {language === 'en' ? 'Demonstrative' : 'Demonstrativo'}
                  </span>
                )}
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
                  <strong>{language === 'en' ? 'Recommended practice:' : 'Prática recomendada:'}</strong> {art.practicalAction}
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
                          <span>{t.care.doActivityBtn}</span>
                        </button>
                      ) : (
                        <div style={{ backgroundColor: '#FAF7F2', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                            {t.care.modalDesc}
                          </div>
                          <textarea
                            value={activityNote}
                            onChange={(e) => setActivityNote(e.target.value)}
                            placeholder={t.care.modalPlaceholder}
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
                              {t.care.modalCancelBtn}
                            </button>
                            <button
                              onClick={() => handleConfirmActivity(art)}
                              className="btn btn-primary"
                              style={{ width: 'auto', minHeight: '36px', padding: '6px 14px', fontSize: '0.8rem' }}
                            >
                              {t.care.modalConfirmBtn}
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--sage)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> {t.care.activityDoneBadge}
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
                          {language === 'en' ? 'View in Journey' : 'Ver na Jornada'} <ArrowRight size={12} />
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
