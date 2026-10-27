import React, { useState, useMemo } from 'react';
import { UserProfile, JourneyRecord, RecordSubject } from '../types';
import { indexedDbService } from '../services/indexedDbService';
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
  AlertTriangle
} from 'lucide-react';

interface JourneyViewProps {
  profile: UserProfile;
  records: JourneyRecord[];
  onAddRecord: (record: JourneyRecord) => void;
  onClearRecords: () => void;
  storageError?: string | null;
}

interface MemorySuggestion {
  id: string;
  label: string;
  prompt: string;
}

interface TagDetailConfig {
  tag: string;
  question: string;
  placeholder: string;
  isRequired?: boolean;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const JourneyView: React.FC<JourneyViewProps> = ({
  profile,
  records,
  onAddRecord,
  onClearRecords,
  storageError
}) => {
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

  // Modais de Exportação e Limpeza
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Seleção de Data do Acontecimento (Permite datas anteriores)
  const todayISO = new Date().toISOString().split('T')[0];
  const [eventDateType, setEventDateType] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customEventDate, setCustomEventDate] = useState(todayISO);

  // Navegação da Linha do Tempo por Mês/Ano (Inicia no mês atual)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const subjectOptions: { id: RecordSubject; label: string; icon: React.ReactNode }[] = [
    { id: 'baby', label: 'Bebê', icon: <Baby size={18} /> },
    { id: 'mom', label: 'Mãe', icon: <Heart size={18} /> },
    { id: 'memory', label: 'Memória', icon: <Camera size={18} /> }
  ];

  const babyTagsConfig: TagDetailConfig[] = [
    {
      tag: 'Dormiu bem',
      question: 'Como foram as sonecas ou o sono da noite?',
      placeholder: 'Ex: Conseguiu dormir 2h direto sem despertar assustado...'
    },
    {
      tag: 'Mamou ou se alimentou normalmente',
      question: 'Observou algo especial na mamada ou refeição?',
      placeholder: 'Ex: Mamou com calma e sem engasgos...'
    },
    {
      tag: 'Estava mais irritado',
      question: 'Percebeu algum motivo provável para a irritação?',
      placeholder: 'Ex: Parecia incomodado com cólica ou salto de desenvolvimento...'
    },
    {
      tag: 'Teve alguma descoberta ou marco',
      question: 'Que gesto, som ou novidade você reparou?',
      placeholder: 'Ex: Tentou segurar o brinquedo com as duas mãozinhas...'
    },
    {
      tag: 'Apresentou algum sintoma',
      question: 'Qual sintoma você notou com atenção?',
      placeholder: 'Ex: Febre baixa após vacina, nariz com secreção transparente...',
      isRequired: true
    }
  ];

  const momTagsConfig: TagDetailConfig[] = [
    {
      tag: 'Tive uma conquista pessoal hoje',
      question: 'Qual vitória sua merece ser celebrada?',
      placeholder: 'Ex: Consegui almoçar sentada e com calma...'
    },
    {
      tag: 'Enfrentei uma dificuldade importante',
      question: 'O que tornou o dia difícil para você?',
      placeholder: 'Ex: Me senti muito sobrecarregada com as demandas...',
      isRequired: true
    },
    {
      tag: 'Consegui um tempo só para mim',
      question: 'O que você pôde fazer nesse momento seu?',
      placeholder: 'Ex: Tomei um banho relaxante de 20 minutos...'
    },
    {
      tag: 'Tive uma conversa ou troca significativa',
      question: 'Com quem foi e o que fez bem para você?',
      placeholder: 'Ex: Conversei com uma amiga que também tem bebê...'
    },
    {
      tag: 'Recebi apoio prático que fez a diferença',
      question: 'Qual ajuda recebida aliviou o seu dia?',
      placeholder: 'Ex: Minha mãe trouxe o almoço pronto...'
    },
    {
      tag: 'Observação sobre meu corpo ou recuperação',
      question: 'Como seu corpo tem respondido aos cuidados?',
      placeholder: 'Ex: Sinto menos dores nas costas hoje...'
    }
  ];

  const memorySuggestions: MemorySuggestion[] = [
    {
      id: 'first_achievement',
      label: 'Primeira conquista',
      prompt: 'O que seu bebê fez pela primeira vez?'
    },
    {
      id: 'special_moment',
      label: 'Momento especial',
      prompt: 'O que tornou esse momento especial hoje?'
    },
    {
      id: 'outing',
      label: 'Passeio',
      prompt: 'Onde vocês foram e o que descobriram juntos?'
    },
    {
      id: 'sounds_laughter',
      label: 'Som ou risada',
      prompt: 'Qual balbucio, som novo ou risada chamou sua atenção?'
    },
    {
      id: 'sweet_gesture',
      label: 'Gesto de carinho',
      prompt: 'Que abraço, olhar ou conexão aqueceu seu coração?'
    }
  ];

  const currentTagsConfig = subject === 'baby' ? babyTagsConfig : momTagsConfig;
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
        label: `Hoje, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      };
    } else if (eventDateType === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return {
        isoDate: y.toISOString().split('T')[0],
        label: 'Ontem'
      };
    } else {
      const parts = customEventDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return {
          isoDate: customEventDate,
          label: `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
        };
      }
      return { isoDate: todayISO, label: 'Data anterior' };
    }
  };

  const handleSave = () => {
    setValidationError(null);

    if (subject === 'memory') {
      if (!note.trim() && !selectedMemoryPrompt) {
        setValidationError('Por favor, escreva uma breve memória ou selecione uma ideia.');
        return;
      }
    } else {
      if (selectedTags.length === 0 && !note.trim()) {
        setValidationError('Selecione pelo menos uma opção rápida ou conte o que aconteceu.');
        return;
      }

      const requiresDescription = currentTagsConfig.some(
        (c) => c.isRequired && selectedTags.includes(c.tag)
      );

      if (requiresDescription && (!note || note.trim().length < 3)) {
        setValidationError(
          `Para acontecimentos como "${activeDetailConfig?.tag}", escreva ao menos uma breve descrição para contextualizar.`
        );
        return;
      }
    }

    const { isoDate, label: dateLabel } = calculateTargetDate();

    const tagsToSave = subject === 'memory'
      ? (selectedMemoryPrompt ? [selectedMemoryPrompt.label] : ['Memória Afetiva'])
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
            <strong>Armazenamento Local Restrito:</strong> {storageError}. Em respeito à sua privacidade, nenhum dado é enviado para servidores externos.
          </div>
        </div>
      )}

      {/* Cabeçalho com Botões de Ação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span className="tag-badge tag-primary" style={{ marginBottom: '6px' }}>
            Jornada • {profile.stageLabel}
          </span>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            Registrar um momento ♡
          </h1>
        </div>

        {/* Botão de Exportação & Opções */}
        <button
          onClick={() => setIsExportMenuOpen(true)}
          title="Backup e Opções dos Registros"
          className="btn btn-secondary"
          style={{ width: 'auto', minHeight: '38px', padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
        >
          <Download size={14} />
          <span>Exportar</span>
        </button>
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Anotações salvas no banco do seu dispositivo com persistência local IndexedDB.
      </p>

      {/* Formulário Interativo de Registro */}
      {isFormOpen ? (
        <div className="card" style={{ padding: '18px', border: '1.5px solid var(--border-light)' }}>
          {/* Seletor de Data do Acontecimento */}
          <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Quando aconteceu?
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                Hoje
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
                Ontem
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
                Outra data...
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
            Sobre quem vamos registrar?
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
                {subject === 'baby' ? 'Como foi o dia do bebê?' : 'O que aconteceu na sua jornada hoje?'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '8px' }}>
                Escolha uma ou mais opções e conte um pouco mais.
              </div>

              <div className="quick-tags-list">
                {currentTagsConfig.map((item) => {
                  const isSelected = selectedTags.includes(item.tag);
                  return (
                    <div
                      key={item.tag}
                      onClick={() => handleToggleTag(item.tag)}
                      className={`quick-tag-item ${isSelected ? 'selected' : ''}`}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                      <div className="checkbox-circle">
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span className="quick-tag-label">{item.tag}</span>
                    </div>
                  );
                })}
              </div>

              {activeDetailConfig && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-card-muted)',
                    borderLeft: '3px solid var(--primary)',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)'
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>
                    {activeDetailConfig.question}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {activeDetailConfig.isRequired ? 'Por favor, escreva uma breve descrição abaixo.' : 'Relate em poucas palavras se desejar.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASO 2: MEMÓRIA */}
          {subject === 'memory' && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-title)' }}>
                Sugestões de lembrança para guardar
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '8px' }}>
                Toque em uma ideia para inspirar sua escrita, ou conte livremente.
              </div>

              <div className="memory-suggestions-grid">
                {memorySuggestions.map((item) => {
                  const isSelected = selectedMemoryPrompt?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemoryPrompt(isSelected ? null : item);
                        setValidationError(null);
                      }}
                      className={`memory-pill ${isSelected ? 'active' : ''}`}
                    >
                      <Sparkles size={13} color={isSelected ? '#7A531C' : 'var(--warm-gold)'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedMemoryPrompt && (
                <div
                  style={{
                    backgroundColor: 'var(--warm-gold-light)',
                    border: '1px solid #F3DFC1',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <Lightbulb size={16} color="var(--warm-gold)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.85rem', color: '#6A4A1C', fontWeight: 600 }}>
                    "{selectedMemoryPrompt.prompt}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campo de Escrita Livre */}
          <div style={{ marginTop: '12px' }}>
            <label
              htmlFor="journey-note"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}
            >
              {subject === 'memory'
                ? (selectedMemoryPrompt ? 'Escreva sobre esse momento:' : 'Sua anotação da memória:')
                : activeDetailConfig
                  ? activeDetailConfig.question
                  : 'Quer acrescentar algo? (opcional)'}
            </label>
            <textarea
              id="journey-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setValidationError(null);
              }}
              placeholder={
                subject === 'memory'
                  ? (selectedMemoryPrompt ? selectedMemoryPrompt.prompt : 'Conte do seu jeito...')
                  : (activeDetailConfig ? activeDetailConfig.placeholder : 'Conte do seu jeito...')
              }
              rows={subject === 'memory' ? 3 : 2}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: validationError ? '1.5px solid #D9534F' : '1.5px solid var(--border-light)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                backgroundColor: '#FAF7F2'
              }}
            />
          </div>

          {validationError && (
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#C76B50',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <AlertCircle size={15} />
              <span>{validationError}</span>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{
                backgroundColor: saveSuccess ? 'var(--sage)' : 'var(--primary)',
                transition: 'background-color 0.2s ease'
              }}
            >
              {saveSuccess ? (
                <>
                  <Check size={18} />
                  <span>Momento registrado no IndexedDB!</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Salvar momento na linha do tempo</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn btn-secondary"
          style={{ marginBottom: '20px', gap: '8px' }}
        >
          <Plus size={18} color="var(--primary)" />
          <span>Fazer novo registro</span>
        </button>
      )}

      {/* FILTROS E BUSCA NA LINHA DO TEMPO */}
      <div style={{ marginTop: '20px', marginBottom: '14px' }}>
        {/* Barra de Busca Textual */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={16} color="var(--text-soft)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palavra nas anotações (ex: sono, vacina)..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-light)',
              fontSize: '0.85rem',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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
            { id: 'all', label: 'Todos' },
            { id: 'baby', label: '👶 Bebê' },
            { id: 'mom', label: '♡ Mãe' },
            { id: 'memory', label: '📷 Memórias' }
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
            title="Mês anterior"
            aria-label="Ver mês anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="month-title-wrap">
            <div className="month-title">
              {MONTH_NAMES[selectedMonth]} de {selectedYear}
            </div>
            <div className="month-count-badge">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'momento exibido' : 'momentos exibidos'}
            </div>
          </div>

          <button
            onClick={handleNextMonth}
            className="month-nav-btn"
            title="Próximo mês"
            aria-label="Ver próximo mês"
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
              <span>Voltar para o mês atual ({MONTH_NAMES[new Date().getMonth()]})</span>
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
                        {isBaby ? '👶 Bebê' : isMom ? '♡ Mãe' : '📷 Memória'}
                      </span>
                      {rec.sourceActivityTitle && (
                        <span className="tag-badge tag-warm" style={{ fontSize: '0.7rem' }}>
                          <Sparkles size={11} /> Cuidado Praticado
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {rec.dateLabel}
                    </span>
                  </div>

                  {rec.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: rec.note ? '8px' : '0' }}>
                      {rec.tags.map((t, idx) => (
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
                          ✓ {t}
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
                      Atividade vinculada: "{rec.sourceActivityTitle}"
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
              Nenhum momento encontrado
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto 16px auto', lineHeight: 1.4 }}>
              {searchQuery ? 'Tente buscar por outro termo ou limpar o filtro.' : `Nenhum momento registrado em ${MONTH_NAMES[selectedMonth]}.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '6px 14px', minHeight: '36px', fontSize: '0.8rem' }}
              >
                Limpar busca
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
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Soberania dos seus dados</h3>
              <button
                onClick={() => setIsExportMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '16px' }}>
              Seus registros estão guardados localmente no seu aparelho. Você pode exportá-los a qualquer momento em formato aberto.
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
                  <div style={{ fontWeight: 600 }}>Baixar Backup (.JSON)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arquivo completo para restauração futura</div>
                </div>
              </button>

              <button
                onClick={() => {
                  indexedDbService.exportAsTextSummary(records, profile);
                  setIsExportMenuOpen(false);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '12px 14px', fontSize: '0.88rem' }}
              >
                <FileText size={16} color="var(--sage)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>Baixar Resumo (.TXT)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Texto legível para levar à consulta médica</div>
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
                  <span>Apagar todos os registros deste aparelho...</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAÇÃO EXPLÍCITA DE EXCLUSÃO (CUIDADO 2) */}
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
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Confirmação de Exclusão</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45, marginBottom: '14px' }}>
              Tem certeza de que deseja apagar todos os registros do IndexedDB deste aparelho?
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
              <strong>Atenção:</strong> Como os dados ficam salvos apenas no seu dispositivo, essa exclusão é <strong>irreversível</strong> se você não tiver feito um backup em JSON antes.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: '40px', fontSize: '0.85rem' }}
              >
                Cancelar
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
                Sim, apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
