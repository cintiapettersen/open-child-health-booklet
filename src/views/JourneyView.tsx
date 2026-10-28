import React, { useState, useMemo } from 'react';
import { UserProfile, JourneyRecord, RecordSubject } from '../types';
import { indexedDbService } from '../services/indexedDbService';
import { useLanguage } from '../context/LanguageContext';
import {
  Baby,
  Heart,
  Camera,
  Check,
  Plus,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Calendar,
  AlertCircle,
  Search,
  Download,
  FileText,
  Trash2,
  X,
  AlertTriangle,
  Upload,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { BackupValidationResult } from '../services/indexedDbService';

interface JourneyViewProps {
  profile: UserProfile;
  records: JourneyRecord[];
  onAddRecord: (record: JourneyRecord) => void;
  onClearRecords: () => void;
  onRestoreRecords?: (updated: JourneyRecord[]) => void;
  storageError?: string | null;
}

interface MemorySuggestion {
  id: string;
  label: string;
  prompt: string;
}

export const JourneyView: React.FC<JourneyViewProps> = ({
  profile,
  records,
  onAddRecord,
  onClearRecords,
  onRestoreRecords,
  storageError
}) => {
  const { language, t } = useLanguage();

  const [isFormOpen, setIsFormOpen] = useState(true);
  const [subject, setSubject] = useState<RecordSubject>('baby');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMemoryPrompt, setSelectedMemoryPrompt] = useState<MemorySuggestion | null>(null);
  const [note, setNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filtros e Busca na Linha do Tempo
  const [activeFilterSubject, setActiveFilterSubject] = useState<'all' | RecordSubject>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de Exportação, Restauração e Limpeza
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFileName, setRestoreFileName] = useState<string | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleOpenRestoreModal = () => {
    setIsExportMenuOpen(false);
    setRestoreFileName(null);
    setRestoreValidation(null);
    setRestoreMode('merge');
    setConfirmReplace(false);
    setRestoreError(null);
    setRestoreSuccessMsg(null);
    setIsRestoreModalOpen(true);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreSuccessMsg(null);
    setRestoreValidation(null);
    setConfirmReplace(false);

    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validation = indexedDbService.validateBackupJson(text);
        if (!validation.valid) {
          setRestoreError(validation.errorMessage || 'Arquivo inválido.');
        } else {
          setRestoreValidation(validation);
        }
      } catch (err: any) {
        setRestoreError(err?.message || 'Erro ao processar arquivo.');
      }
    };
    reader.onerror = () => {
      setRestoreError('Falha ao ler o arquivo local.');
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreValidation?.records) return;
    if (restoreMode === 'replace' && !confirmReplace) return;

    setIsRestoring(true);
    setRestoreError(null);

    try {
      let result;
      if (restoreMode === 'replace') {
        result = await indexedDbService.restoreBackupReplace(restoreValidation.records);
      } else {
        result = await indexedDbService.restoreBackupMerge(restoreValidation.records);
      }

      const updatedRecords = await indexedDbService.getRecords();
      if (onRestoreRecords) {
        onRestoreRecords(updatedRecords);
      }

      setRestoreSuccessMsg(t.journey.restoreSuccessMsg(result.importedCount, result.skippedCount));
      setRestoreValidation(null);
      setRestoreFileName(null);
    } catch (err: any) {
      setRestoreError(err?.message || 'Erro durante a restauração no IndexedDB.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Seleção de Data do Acontecimento (Permite datas anteriores)
  const todayISO = new Date().toISOString().split('T')[0];
  const [eventDateType, setEventDateType] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customEventDate, setCustomEventDate] = useState(todayISO);

  // Navegação da Linha do Tempo por Mês/Ano (Inicia no mês atual)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const subjectOptions: { id: RecordSubject; label: string; icon: React.ReactNode }[] = [
    { id: 'baby', label: t.journey.subjectOptions.baby, icon: <Baby size={18} /> },
    { id: 'mom', label: t.journey.subjectOptions.mom, icon: <Heart size={18} /> },
    { id: 'memory', label: t.journey.subjectOptions.memory, icon: <Camera size={18} /> }
  ];

  const currentTagsConfig = subject === 'baby' ? t.journey.babyTags : t.journey.momTags;
  const activeDetailConfig = currentTagsConfig
    .slice()
    .reverse()
    .find((c) => selectedTags.includes(c.tag));

  const handleToggleTag = (tag: string) => {
    setValidationError(null);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const calculateTargetDate = (): { isoDate: string; label: string } => {
    if (eventDateType === 'today') {
      const now = new Date();
      return {
        isoDate: todayISO,
        label: `${t.journey.dateTodayPrefix}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      };
    } else if (eventDateType === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterdayISO = y.toISOString().split('T')[0];
      return {
        isoDate: yesterdayISO,
        label: t.journey.dateYesterdayPrefix
      };
    } else {
      const parts = customEventDate.split('-');
      let formattedLabel = customEventDate;
      if (parts.length === 3) {
        formattedLabel = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return {
        isoDate: customEventDate,
        label: formattedLabel
      };
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validação suave
    if (subject === 'memory') {
      if (!note || note.trim().length === 0) {
        setValidationError(
          language === 'en'
            ? 'Please write a brief note to preserve this memory.'
            : 'Por favor, escreva um breve relato para guardar essa memória.'
        );
        return;
      }
    } else {
      if (selectedTags.length === 0 && (!note || note.trim().length === 0)) {
        setValidationError(t.journey.validationChooseOption);
        return;
      }

      const requiresDescription = currentTagsConfig.some(
        (c) => c.isRequired && selectedTags.includes(c.tag)
      );

      if (requiresDescription && (!note || note.trim().length < 3)) {
        setValidationError(
          t.journey.validationDescribeBriefly(activeDetailConfig?.tag || '')
        );
        return;
      }
    }

    const { isoDate, label: dateLabel } = calculateTargetDate();

    const tagsToSave = subject === 'memory'
      ? (selectedMemoryPrompt ? [selectedMemoryPrompt.label] : [language === 'en' ? 'Affective Memory' : 'Memória Afetiva'])
      : selectedTags;

    const newRecord: JourneyRecord = {
      id: `rec-${Date.now()}`,
      subject,
      tags: tagsToSave,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
      eventDate: isoDate,
      dateLabel
    };

    onAddRecord(newRecord);
    setSaveSuccess(true);
    setSelectedTags([]);
    setSelectedMemoryPrompt(null);
    setNote('');

    const recordParts = isoDate.split('-');
    if (recordParts.length === 3) {
      setCurrentDate(new Date(parseInt(recordParts[0]), parseInt(recordParts[1]) - 1, 1));
    }

    setTimeout(() => {
      setSaveSuccess(false);
      setIsFormOpen(false);
    }, 1200);
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  // Filtro combinado: Mês/Ano + Filtro de Sujeito + Busca Textual
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Filtro temporal (mês/ano)
      if (!rec.eventDate) return false;
      const parts = rec.eventDate.split('-');
      if (parts.length < 2) return false;
      const recYear = parseInt(parts[0]);
      const recMonth = parseInt(parts[1]) - 1;
      if (recYear !== selectedYear || recMonth !== selectedMonth) return false;

      // 2. Filtro de sujeito
      if (activeFilterSubject !== 'all' && rec.subject !== activeFilterSubject) {
        return false;
      }

      // 3. Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNote = rec.note?.toLowerCase().includes(query) ?? false;
        const matchesTags = rec.tags?.some((t) => t.toLowerCase().includes(query)) ?? false;
        const matchesActivity = rec.sourceActivityTitle?.toLowerCase().includes(query) ?? false;
        if (!matchesNote && !matchesTags && !matchesActivity) return false;
      }

      return true;
    });
  }, [records, selectedYear, selectedMonth, activeFilterSubject, searchQuery]);

  const isCurrentMonthView = (() => {
    const today = new Date();
    return today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;
  })();

  const monthCountLabel = filteredRecords.length === 1 ? t.journey.countSingle : t.journey.countPlural;

  return (
    <div className="content-area">
      {/* Aviso de erro se IndexedDB falhar */}
      {storageError && (
        <div
          style={{
            backgroundColor: '#FFF2F2',
            border: '1.5px solid #F5C2C2',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <AlertCircle size={18} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: '#7A2E2E', lineHeight: 1.4 }}>
            <strong>{t.common.dbErrorTitle}:</strong> {storageError}. {t.common.dbErrorDesc}
          </div>
        </div>
      )}

      {/* Cabeçalho da Seção com Botão de Exportação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <span className="tag-badge tag-warm" style={{ marginBottom: '6px' }}>
            {t.journey.badge}
          </span>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {t.journey.title}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {t.journey.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsExportMenuOpen(true)}
          className="btn btn-secondary"
          title={t.journey.exportMenuBtn}
          aria-label={t.journey.exportMenuBtn}
          style={{
            width: 'auto',
            padding: '8px 12px',
            minHeight: '38px',
            fontSize: '0.82rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          <Download size={15} />
          <span>{language === 'en' ? 'Backup' : 'Exportar'}</span>
        </button>
      </div>

      {/* Botão para Abrir/Fechar Formulário de Novo Registro */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setValidationError(null);
          }}
          className="btn btn-primary"
          style={{ justifyContent: 'center', gap: '8px' }}
        >
          {isFormOpen ? <X size={18} /> : <Plus size={18} />}
          <span>{isFormOpen ? t.journey.closeBtn : t.journey.newRecordBtn}</span>
        </button>
      </div>

      {/* FORMULÁRIO DE NOVO REGISTRO */}
      {isFormOpen && (
        <form onSubmit={handleSave} className="card" style={{ border: '2px solid var(--primary-light)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '12px' }}>
            {t.journey.newRecordTitle}
          </h2>

          {/* 1. QUANDO ACONTECEU? (Seletor de Datas Anteriores) */}
          <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              {t.journey.dateSectionTitle}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setEventDateType('today')}
                className={`tag-badge ${eventDateType === 'today' ? 'tag-primary' : ''}`}
                style={{
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: eventDateType === 'today' ? 'var(--primary-light)' : '#FFFFFF'
                }}
              >
                {t.journey.dateToday}
              </button>
              <button
                type="button"
                onClick={() => setEventDateType('yesterday')}
                className={`tag-badge ${eventDateType === 'yesterday' ? 'tag-primary' : ''}`}
                style={{
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: eventDateType === 'yesterday' ? 'var(--primary-light)' : '#FFFFFF'
                }}
              >
                {t.journey.dateYesterday}
              </button>
              <button
                type="button"
                onClick={() => setEventDateType('custom')}
                className={`tag-badge ${eventDateType === 'custom' ? 'tag-primary' : ''}`}
                style={{
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: eventDateType === 'custom' ? 'var(--primary-light)' : '#FFFFFF'
                }}
              >
                {t.journey.dateOther}
              </button>

              {eventDateType === 'custom' && (
                <input
                  type="date"
                  value={customEventDate}
                  max={todayISO}
                  onChange={(e) => setCustomEventDate(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.82rem',
                    fontFamily: 'inherit'
                  }}
                />
              )}
            </div>
          </div>

          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
            {t.journey.subjectSectionTitle}
          </div>

          {/* Seletor de 3 Colunas: Bebê / Mãe / Memória */}
          <div className="subject-selector">
            {subjectOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSubject(opt.id);
                  setSelectedTags([]);
                  setSelectedMemoryPrompt(null);
                  setValidationError(null);
                }}
                className={`subject-btn ${subject === opt.id ? 'active' : ''}`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* CASO 1: BEBÊ ou MÃE */}
          {(subject === 'baby' || subject === 'mom') && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-title)' }}>
                {subject === 'baby' ? t.journey.babyPromptTitle : t.journey.momPromptTitle}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '8px' }}>
                {t.journey.optionsSubtitle}
              </div>

              <div className="quick-tags-list">
                {currentTagsConfig.map((item) => {
                  const isSelected = selectedTags.includes(item.tag);
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => handleToggleTag(item.tag)}
                      className={`quick-tag-chip ${isSelected ? 'selected' : ''}`}
                    >
                      {isSelected && <Check size={13} style={{ marginRight: '4px' }} />}
                      <span>{item.tag}</span>
                      {item.isRequired && (
                        <span style={{ fontSize: '0.72rem', color: '#B23B3B', marginLeft: '3px' }}>*</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pergunta inspiradora de apoio se uma opção estiver marcada */}
              {activeDetailConfig && (
                <div
                  style={{
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    marginTop: '12px',
                    marginBottom: '10px',
                    borderLeft: '3px solid var(--primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                    <Lightbulb size={14} />
                    <span>{activeDetailConfig.question}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASO 2: MEMÓRIA */}
          {subject === 'memory' && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-title)' }}>
                {t.journey.memoryPromptTitle}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '8px' }}>
                {t.journey.memorySuggestionsSubtitle}
              </div>

              <div className="quick-tags-list">
                {t.journey.memorySuggestions.map((sug) => {
                  const isSelected = selectedMemoryPrompt?.id === sug.id;
                  return (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemoryPrompt(isSelected ? null : sug);
                        setValidationError(null);
                      }}
                      className={`quick-tag-chip ${isSelected ? 'selected' : ''}`}
                    >
                      {isSelected && <Check size={13} style={{ marginRight: '4px' }} />}
                      <span>{sug.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedMemoryPrompt && (
                <div
                  style={{
                    backgroundColor: 'var(--warm-gold-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    marginTop: '12px',
                    marginBottom: '10px',
                    borderLeft: '3px solid var(--warm-gold)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#65481E' }}>
                    <Sparkles size={14} />
                    <span>{selectedMemoryPrompt.prompt}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campo de Texto para Contexto / Relato */}
          <div style={{ marginTop: '12px' }}>
            <label
              htmlFor="journey-note"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}
            >
              {subject === 'memory'
                ? (language === 'en' ? 'Describe this moment:' : 'Descreva esse momento:')
                : (activeDetailConfig ? (language === 'en' ? 'Add context (optional or brief):' : 'Adicione contexto (opcional ou breve):') : t.journey.noteLabel)}
            </label>
            <textarea
              id="journey-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setValidationError(null);
              }}
              placeholder={
                activeDetailConfig
                  ? activeDetailConfig.placeholder
                  : selectedMemoryPrompt
                  ? selectedMemoryPrompt.prompt
                  : t.journey.noteGeneralPlaceholder
              }
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-light)',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* Mensagem de Erro / Orientação Suave */}
          {validationError && (
            <div
              style={{
                backgroundColor: '#FFF2F2',
                border: '1px solid #F5C2C2',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                fontSize: '0.8rem',
                color: '#B23B3B',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Ações do Formulário */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setSelectedTags([]);
                setSelectedMemoryPrompt(null);
                setNote('');
                setValidationError(null);
              }}
              className="btn btn-secondary"
              style={{ width: 'auto', minHeight: '38px', padding: '8px 14px', fontSize: '0.84rem' }}
            >
              {t.journey.closeBtn}
            </button>
            <button
              type="submit"
              disabled={saveSuccess}
              className="btn btn-primary"
              style={{ width: 'auto', minHeight: '38px', padding: '8px 18px', fontSize: '0.84rem' }}
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>{t.journey.savedSuccessMsg}</span>
                </>
              ) : (
                <span>{t.journey.saveRecordBtn}</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* BARRA DE FILTROS E BUSCA NA LINHA DO TEMPO */}
      <div style={{ marginBottom: '14px' }}>
        {/* Campo de Busca Textual */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search size={15} color="var(--text-soft)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.journey.searchPlaceholder}
            style={{
              width: '100%',
              padding: '9px 34px 9px 34px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              fontSize: '0.84rem',
              backgroundColor: '#FFFFFF',
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title={t.journey.clearSearchBtn}
              aria-label={t.journey.clearSearchBtn}
              style={{
                position: 'absolute',
                right: '12px',
                top: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--text-soft)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros em Pílulas: Todos | Bebê | Mãe | Memória */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: t.journey.allFilter },
            { id: 'baby', label: t.journey.babyFilter },
            { id: 'mom', label: t.journey.momFilter },
            { id: 'memory', label: t.journey.memoryFilter }
          ].map((f) => {
            const isSelected = activeFilterSubject === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilterSubject(f.id as typeof activeFilterSubject)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'var(--primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LINHA DO TEMPO ORGANIZADA POR MÊS E ANO */}
      <div>
        <div className="month-selector-bar">
          <button
            onClick={handlePrevMonth}
            className="month-nav-btn"
            title={t.journey.prevMonthAria}
            aria-label={t.journey.prevMonthAria}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="month-title-wrap">
            <div className="month-title">
              {t.journey.months[selectedMonth]} {t.journey.monthOf} {selectedYear}
            </div>
            <div className="month-count-badge">
              {filteredRecords.length} {monthCountLabel}
            </div>
          </div>

          <button
            onClick={handleNextMonth}
            className="month-nav-btn"
            title={t.journey.nextMonthAria}
            aria-label={t.journey.nextMonthAria}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {!isCurrentMonthView && (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Calendar size={13} />
              <span>
                {language === 'en'
                  ? `Back to current month (${t.journey.months[new Date().getMonth()]})`
                  : `Voltar para o mês atual (${t.journey.months[new Date().getMonth()]})`}
              </span>
            </button>
          </div>
        )}

        {filteredRecords.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredRecords.map((rec) => {
              const isBaby = rec.subject === 'baby';
              const isMom = rec.subject === 'mom';

              return (
                <div key={rec.id} className="card" style={{ marginBottom: 0, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`tag-badge ${isBaby ? 'tag-primary' : isMom ? 'tag-sage' : 'tag-warm'}`}>
                        {isBaby ? t.journey.babyFilter : isMom ? t.journey.momFilter : t.journey.memoryFilter}
                      </span>
                      {rec.sourceActivityTitle && (
                        <span className="tag-badge tag-warm" style={{ fontSize: '0.7rem' }}>
                          <Sparkles size={11} /> {language === 'en' ? 'Practiced Care' : 'Cuidado Praticado'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {rec.dateLabel}
                    </span>
                  </div>

                  {rec.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: rec.note ? '8px' : '0' }}>
                      {rec.tags.map((tg, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.78rem',
                            backgroundColor: 'var(--bg-card-muted)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            color: 'var(--text-main)',
                            fontWeight: 500
                          }}
                        >
                          ✓ {tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {rec.note && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.45 }}>
                      {rec.note}
                    </p>
                  )}

                  {rec.sourceActivityTitle && (
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--sage)', fontStyle: 'italic' }}>
                      {language === 'en' ? 'Linked activity:' : 'Atividade vinculada:'} "{rec.sourceActivityTitle}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '32px 20px',
              backgroundColor: '#FFFFFF',
              border: '1.5px dashed var(--border-light)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card-muted)',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}
            >
              <Calendar size={18} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              {searchQuery ? t.journey.emptySearchTitle : t.journey.emptyMonthTitle}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto 16px auto', lineHeight: 1.4 }}>
              {searchQuery
                ? t.journey.emptySearchSubtitle
                : `${t.journey.emptyMonthSubtitle} (${t.journey.months[selectedMonth]}).`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '6px 14px', minHeight: '36px', fontSize: '0.8rem' }}
              >
                {t.journey.clearSearchBtn}
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: EXPORTAÇÃO E BACKUP LOCAL */}
      {isExportMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '22px',
              marginBottom: 0,
              boxShadow: 'var(--shadow-elevated)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{t.journey.exportModalTitle}</h3>
              <button
                onClick={() => setIsExportMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '16px' }}>
              {t.journey.exportModalDesc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  indexedDbService.exportAsJson(records);
                  setIsExportMenuOpen(false);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '12px 14px', fontSize: '0.88rem' }}
              >
                <Download size={16} color="var(--primary)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{t.journey.exportJsonTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.journey.exportJsonDesc}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  indexedDbService.exportAsTextSummary(records, profile, language);
                  setIsExportMenuOpen(false);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '12px 14px', fontSize: '0.88rem' }}
              >
                <FileText size={16} color="var(--sage)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{t.journey.exportTxtTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.journey.exportTxtDesc}</div>
                </div>
              </button>

              <button
                onClick={handleOpenRestoreModal}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '12px 14px', fontSize: '0.88rem' }}
              >
                <Upload size={16} color="var(--terracotta)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{t.journey.restoreBtnTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.journey.restoreBtnDesc}</div>
                </div>
              </button>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    setIsConfirmClearOpen(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C76B50',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 4px'
                  }}
                >
                  <Trash2 size={14} />
                  <span>{t.journey.clearAllDataBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAÇÃO EXPLÍCITA DE EXCLUSÃO */}
      {isConfirmClearOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '22px',
              marginBottom: 0,
              border: '2px solid #EAA8A8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B23B3B', marginBottom: '10px' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t.journey.clearModalTitle}</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45, marginBottom: '14px' }}>
              {t.journey.clearModalQuestion}
            </p>

            <div
              style={{
                backgroundColor: '#FFF2F2',
                borderLeft: '3px solid #D9534F',
                padding: '10px 12px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#7A2E2E',
                marginBottom: '16px',
                lineHeight: 1.4
              }}
            >
              {t.journey.clearModalWarning}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '40px', fontSize: '0.85rem' }}
              >
                {t.journey.clearModalCancelBtn}
              </button>
              <button
                onClick={() => {
                  onClearRecords();
                  setIsConfirmClearOpen(false);
                }}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  backgroundColor: '#B23B3B',
                  minHeight: '40px',
                  fontSize: '0.85rem'
                }}
              >
                {t.journey.clearModalConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESTAURAÇÃO DE BACKUP LOCAL (.JSON) */}
      {isRestoreModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '430px',
              padding: '22px',
              marginBottom: 0,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} color="var(--terracotta)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t.journey.restoreModalTitle}</h3>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label={t.journey.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '14px' }}>
              {t.journey.restoreModalDesc}
            </p>

            {/* Aviso de Privacidade */}
            <div
              style={{
                backgroundColor: '#FEF3C7',
                borderLeft: '3px solid #D97706',
                padding: '10px 12px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                color: '#92400E',
                marginBottom: '16px',
                lineHeight: 1.4,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{t.journey.restorePrivacyWarning}</div>
            </div>

            {/* Seletor de Arquivo */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />

            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: '0.88rem', gap: '8px' }}
              >
                <Upload size={16} />
                <span>{restoreFileName ? restoreFileName : t.journey.restoreSelectFileBtn}</span>
              </button>
            </div>

            {/* Alerta de Erro */}
            {restoreError && (
              <div
                style={{
                  backgroundColor: '#FFF2F2',
                  borderLeft: '3px solid #D9534F',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#7A2E2E',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}
              >
                <strong>{t.journey.restoreErrorTitle}</strong>
                <div style={{ marginTop: '4px' }}>{restoreError}</div>
              </div>
            )}

            {/* Alerta de Sucesso */}
            {restoreSuccessMsg && (
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  borderLeft: '3px solid #10B981',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#065F46',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={18} color="#10B981" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            {/* Prévia e Opções de Restauração */}
            {restoreValidation?.valid && !restoreSuccessMsg && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    backgroundColor: '#F8F9FA',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-main)' }}>
                    {t.journey.restorePreviewTitle}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <div>• {t.journey.restoreTotalRecords(restoreValidation.recordCount)}</div>
                    {restoreValidation.dateRange && (
                      <div>• {t.journey.restoreDateRange(restoreValidation.dateRange.min, restoreValidation.dateRange.max)}</div>
                    )}
                    {restoreValidation.subjectCounts && (
                      <div>
                        • {t.journey.restoreCounts(
                          restoreValidation.subjectCounts.baby,
                          restoreValidation.subjectCounts.mom,
                          restoreValidation.subjectCounts.memory
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Seletor de Modo */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                    {t.journey.restoreModeTitle}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: restoreMode === 'merge' ? '1px solid var(--terracotta)' : '1px solid var(--border-light)',
                        backgroundColor: restoreMode === 'merge' ? '#FFF9F5' : 'transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        style={{ marginTop: '2px' }}
                      />
                      <span>{t.journey.restoreModeMerge}</span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: restoreMode === 'replace' ? '1px solid #B23B3B' : '1px solid var(--border-light)',
                        backgroundColor: restoreMode === 'replace' ? '#FFF2F2' : 'transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        style={{ marginTop: '2px' }}
                      />
                      <span>{t.journey.restoreModeReplace}</span>
                    </label>
                  </div>
                </div>

                {/* Confirmação explícita se modo replace */}
                {restoreMode === 'replace' && (
                  <div
                    style={{
                      backgroundColor: '#FFF2F2',
                      border: '1px solid #EAA8A8',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#7A2E2E', lineHeight: 1.35 }}>
                      {t.journey.restoreConfirmReplaceWarning}
                    </div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: '#B23B3B',
                        fontWeight: 600
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={confirmReplace}
                        onChange={(e) => setConfirmReplace(e.target.checked)}
                        style={{ marginTop: '2px' }}
                      />
                      <span>{t.journey.restoreConfirmReplaceCheckbox}</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '40px', fontSize: '0.85rem' }}
              >
                {t.journey.restoreCancelBtn}
              </button>

              {restoreValidation?.valid && !restoreSuccessMsg && (
                <button
                  onClick={handleExecuteRestore}
                  disabled={isRestoring || (restoreMode === 'replace' && !confirmReplace)}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    minHeight: '40px',
                    fontSize: '0.85rem',
                    backgroundColor: restoreMode === 'replace' ? '#B23B3B' : 'var(--terracotta)',
                    opacity: (restoreMode === 'replace' && !confirmReplace) || isRestoring ? 0.6 : 1
                  }}
                >
                  {isRestoring ? 'Processando...' : t.journey.restoreExecuteBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
