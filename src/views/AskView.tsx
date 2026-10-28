import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { consultEducationalAssistant, AskResponse, checkGatewayHealth, GatewayHealthStatus } from '../services/askService';
import {
  Send,
  ShieldAlert,
  BookOpen,
  Sparkles,
  CheckCircle,
  PhoneCall,
  RotateCcw,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  WifiOff
} from 'lucide-react';

interface AskViewProps {
  profile: UserProfile;
}

// Renderizador de formatação inline (negrito ** e itálico *)
function renderInlineFormatting(line: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={`${keyPrefix}-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`${keyPrefix}-${match.index}`}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : line;
}

// Renderizador tipográfico de respostas: separa listas em linhas individuais com espaçamento ideal para celular
function renderFormattedAnswer(text: string): React.ReactNode {
  const blocks = text.split(/\n\n+/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {blocks.map((block, bIdx) => {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);

        // Verifica se o bloco contém itens de lista
        const hasListItems = lines.some(l => /^[•\-*]|\d+\.\s+/.test(l));

        if (!hasListItems) {
          return (
            <p
              key={bIdx}
              style={{
                margin: 0,
                fontSize: '0.94rem',
                color: 'var(--text-main)',
                lineHeight: 1.68
              }}
            >
              {renderInlineFormatting(lines.join(' '), `p-${bIdx}`)}
            </p>
          );
        }

        return (
          <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lines.map((line, lIdx) => {
              const listMatch = line.match(/^([•\-*]|\d+\.)\s*(.+)$/);

              if (listMatch) {
                const marker = listMatch[1];
                const content = listMatch[2];
                const isNumeric = /\d+\./.test(marker);

                return (
                  <div
                    key={`${bIdx}-${lIdx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '4px 0',
                      fontSize: '0.92rem',
                      lineHeight: 1.62,
                      color: 'var(--text-main)'
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--primary)',
                        fontWeight: isNumeric ? 600 : 700,
                        fontSize: isNumeric ? '0.85rem' : '1.1rem',
                        lineHeight: '1.45rem',
                        userSelect: 'none',
                        flexShrink: 0,
                        minWidth: isNumeric ? '18px' : '10px',
                        textAlign: isNumeric ? 'right' : 'center'
                      }}
                    >
                      {isNumeric ? marker : '•'}
                    </span>
                    <div style={{ flex: 1 }}>
                      {renderInlineFormatting(content, `${bIdx}-${lIdx}`)}
                    </div>
                  </div>
                );
              }

              // Linha introdutória ou texto antes da lista dentro do mesmo bloco
              return (
                <p
                  key={`${bIdx}-${lIdx}`}
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '0.94rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.68
                  }}
                >
                  {renderInlineFormatting(line, `${bIdx}-${lIdx}`)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const AskView: React.FC<AskViewProps> = ({ profile }) => {
  const { language, t } = useLanguage();
  const isDev = Boolean((import.meta as any).env?.DEV);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayHealthStatus | null>(null);
  const [forceLocalMock, setForceLocalMock] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isDev) checkGatewayHealth().then(setGatewayStatus);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isDev]);

  useEffect(() => {
    if (isDev) {
      checkGatewayHealth().then(setGatewayStatus);
    }
  }, [isDev]);

  const sampleQuestions = profile.phase === 'pregnancy'
    ? t.ask.sampleQuestionsPregnancy
    : t.ask.sampleQuestionsBaby;

  const localizedStage = getLocalizedStageLabel(profile, language);
  const maxChars = 300;

  const handleAsk = async (textToAsk: string = question) => {
    const trimmed = textToAsk.trim();
    if (!trimmed || trimmed.length < 4 || isLoading) return;

    // Se estiver sem conexão e tentando consultar modo Live
    if (!navigator.onLine && gatewayStatus?.mode === 'live' && !forceLocalMock) {
      setResponse({
        status: 'error',
        answer: language === 'pt-BR'
          ? 'O assistente de IA real está indisponível porque o dispositivo está sem conexão à internet. O aplicativo continua funcionando normalmente para consulta dos conteúdos e do histórico salvos no aparelho.'
          : 'The live AI assistant is unavailable because this device is offline. The application continues functioning normally for all locally saved guides and journal history.',
        citations: [],
        safetyDisclaimer: '',
        mode: 'gemini-3.5-flash-lite',
        isEmergency: false,
        retrievedCount: 0,
        errorMessage: 'offline'
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setShowSources(false);

    try {
      const result = await consultEducationalAssistant(trimmed, profile, language, forceLocalMock);
      setResponse(result);
    } catch {
      setResponse({
        status: 'error',
        answer: language === 'pt-BR'
          ? 'Ocorreu uma instabilidade na consulta. Por favor, tente novamente em instantes.'
          : 'A temporary error occurred while processing your query. Please try again.',
        citations: [],
        safetyDisclaimer: '',
        mode: 'mock',
        isEmergency: false,
        retrievedCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setResponse(null);
    setShowSources(false);
  };

  return (
    <div className="content-area">
      {/* Cabeçalho */}
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

      {/* Alerta Ético de Saúde */}
      <div
        style={{
          backgroundColor: '#FFF9F2',
          border: '1px solid #F5E6D3',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}
      >
        <ShieldAlert size={18} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.8rem', color: '#6A5647', lineHeight: 1.4 }}>
          <strong>{t.ask.disclaimerTitle}</strong> {t.ask.disclaimerText}
        </div>
      </div>

      {/* Painel Exclusivo de Testes de Desenvolvimento (jamais incluído em builds de produção) */}
      {isDev && (
        <div
          style={{
            backgroundColor: '#F8F9FA',
            border: '1px dashed #BDC3C7',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '18px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛠️ Gateway Local (Desenvolvimento)
            </span>
            <button
              onClick={() => checkGatewayHealth().then(setGatewayStatus)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={11} /> Atualizar status
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <span>
              Status:{' '}
              <strong style={{ color: gatewayStatus?.online ? '#27AE60' : '#E67E22' }}>
                {gatewayStatus?.online ? '🟢 Conectado (127.0.0.1:8787)' : '⚪ Desconectado (Fallback In-App)'}
              </strong>
            </span>
            {gatewayStatus?.online && (
              <span>
                • Modo do Servidor:{' '}
                <strong style={{ color: gatewayStatus.mode === 'live' ? '#C0392B' : '#27AE60' }}>
                  {gatewayStatus.mode === 'live' ? '🔴 Live (Gemini 3.5 Flash-Lite)' : '🟢 Mock (Custo Zero)'}
                </strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={forceLocalMock}
                onChange={(e) => setForceLocalMock(e.target.checked)}
              />
              <span>Forçar simulação local no navegador (ignorar gateway)</span>
            </label>
          </div>
        </div>
      )}

      {/* Indicador de Status Offline */}
      {!isOnline && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            borderLeft: '3px solid #D97706',
            padding: '10px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#92400E',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: 1.4
          }}
        >
          <WifiOff size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{language === 'pt-BR' ? 'Modo Offline Ativo' : 'Offline Mode Active'}:</strong>{' '}
            {language === 'pt-BR'
              ? 'O dispositivo está sem conexão à internet. Respostas que dependem de IA em tempo real não estão acessíveis; o catálogo educacional demonstrativo e o histórico do aparelho continuam disponíveis.'
              : 'No internet connection detected. Real-time AI consultation is unavailable; local educational guides and all device records remain fully accessible.'}
          </div>
        </div>
      )}

      {/* Estado sem resposta: Formulário de Pergunta */}
      {!response && (
        <>
          {/* Sugestões de Perguntas Rápidas */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              {t.ask.commonQuestionsTitle} ({localizedStage})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  disabled={isLoading}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="btn btn-secondary"
                  style={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    padding: '10px 14px',
                    minHeight: '44px',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isLoading ? 0.6 : 1
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {t.ask.inputTitle}
              </div>
              <span style={{ fontSize: '0.75rem', color: question.length > maxChars ? '#C76B50' : 'var(--text-soft)' }}>
                {t.ask.inputLimitHint(question.length, maxChars)}
              </span>
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, maxChars))}
              placeholder={t.ask.inputPlaceholder}
              disabled={isLoading}
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
                marginBottom: '8px',
                backgroundColor: isLoading ? '#FAFAFA' : '#FFFFFF'
              }}
            />

            {/* Aviso de Privacidade de PII */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-soft)', marginBottom: '12px' }}>
              <Lock size={12} />
              <span>{t.ask.piiNotice}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-soft)' }}>
                <BookOpen size={14} />
                <span>{t.ask.sourcesNotice}</span>
              </div>
              <button
                className="btn btn-primary"
                disabled={isLoading || question.trim().length < 4}
                style={{ width: 'auto', padding: '10px 18px', minHeight: '42px', fontSize: '0.88rem' }}
                onClick={() => handleAsk()}
              >
                <span>{isLoading ? t.ask.consultingBtn : t.ask.consultBtn}</span>
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Estado com Resposta Retornada */}
      {response && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Alerta de Emergência Médica */}
          {response.isEmergency ? (
            <div
              style={{
                backgroundColor: '#FDF2F2',
                border: '1.5px solid #F5B7B1',
                borderRadius: 'var(--radius-md)',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <AlertTriangle size={20} color="#C0392B" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#922B21', margin: 0 }}>
                  {t.ask.emergencyAlertTitle}
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#641E16', lineHeight: 1.5, margin: '0 0 14px 0', whiteSpace: 'pre-line' }}>
                {response.answer}
              </p>
              {response.emergencyPhone && (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F5B7B1',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#922B21' }}>
                      {t.ask.emergencyPhoneLabel}
                    </span>
                    <a
                      href={`tel:${response.emergencyPhone.replace(/\D/g, '')}`}
                      className="btn btn-primary"
                      style={{
                        width: 'auto',
                        padding: '8px 14px',
                        backgroundColor: '#C0392B',
                        fontSize: '0.85rem',
                        display: 'flex',
                        gap: '6px'
                      }}
                    >
                      <PhoneCall size={14} />
                      <span>{t.ask.emergencyCallSAMU}</span>
                    </a>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#78281F', borderTop: '1px dashed #F5B7B1', paddingTop: '8px' }}>
                    ℹ️ {t.ask.emergencyIntlNotice}
                  </div>
                </div>
              )}
            </div>
          ) : response.status === 'error' ? (
            /* Erro Explícito na Conexão com o Modelo Oficial */
            <div
              style={{
                backgroundColor: '#FDF2E9',
                border: '1.5px solid #F5CBA7',
                borderRadius: 'var(--radius-md)',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <AlertTriangle size={20} color="#D35400" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#A04000', margin: 0 }}>
                  {t.ask.errorCardTitle}
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#6E2C00', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                {response.answer}
              </p>
              {response.errorMessage && (
                <div style={{ fontSize: '0.76rem', color: '#873600', fontFamily: 'monospace', backgroundColor: '#FBEEE6', padding: '6px 10px', borderRadius: '4px' }}>
                  {response.errorMessage}
                </div>
              )}
            </div>
          ) : (
            /* Resposta Educativa Normal */
            <div className="card" style={{ padding: '18px' }}>
              {/* Badge de Transparência do Modo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  className={`tag-badge ${response.mode === 'mock' ? 'tag-peach' : 'tag-sage'}`}
                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {response.mode === 'mock' ? t.ask.modeMockBadge : t.ask.modeLiveBadge}
                </span>
                {response.retrievedCount > 0 && (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-soft)' }}>
                    {response.retrievedCount} {language === 'pt-BR' ? 'evidências consultadas' : 'guidelines matched'}
                  </span>
                )}
              </div>

              {/* Aviso explícito de Demonstração em Modo Mock */}
              {response.mode === 'mock' && (
                <div
                  style={{
                    backgroundColor: '#F8F9FA',
                    border: '1px dashed #BDC3C7',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '0.76rem',
                    color: '#5D6D7E',
                    marginBottom: '12px',
                    lineHeight: 1.4
                  }}
                >
                  💡 <strong>{t.ask.modeMockBadge}:</strong> {t.ask.mockNoticeText}
                </div>
              )}

              {/* Aviso explícito de IA Real (Gemini 3.5 Flash-Lite) */}
              {response.mode === 'gemini-3.5-flash-lite' && (
                <div
                  style={{
                    backgroundColor: '#F4FBF7',
                    border: '1.5px solid #A9DFBF',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#196F3D' }}>
                    <Sparkles size={15} color="#1E8449" />
                    <span>Resposta gerada por IA Oficial (Google Gemini 3.5 Flash-Lite)</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#1E8449', lineHeight: 1.4 }}>
                    Fundamentada exclusivamente nas evidências oficiais recuperadas do catálogo.
                    {response.usage && (
                      <span style={{ display: 'block', marginTop: '4px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#145A32' }}>
                        Tokens: {response.usage.promptTokens} in / {response.usage.candidatesTokens} out • Latência: {response.executionMs}ms
                        {response.estimatedCost && ` • Custo est.: ~$${response.estimatedCost.totalCostUSD.toFixed(6)} USD`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Aviso se dados pessoais foram mascarados */}
              {response.piiWarning && (
                <div
                  style={{
                    backgroundColor: '#FEF9E7',
                    border: '1px solid #F9E79F',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '0.76rem',
                    color: '#7D6608',
                    marginBottom: '12px',
                    lineHeight: 1.4
                  }}
                >
                  🔒 {response.piiWarning}
                </div>
              )}

              {/* Pergunta Original */}
              <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '14px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px' }}>
                "{question}"
              </div>

              {/* Texto da Resposta Educativa Formatada (sem asteriscos e com parágrafos acolhedores) */}
              <div style={{ marginBottom: '14px' }}>
                {renderFormattedAnswer(response.answer)}
              </div>

              {/* Seção Recolhível de Fontes Oficiais ("Consultar fontes" / "View sources") */}
              {response.citations.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                  <button
                    onClick={() => setShowSources(prev => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      outline: 'none'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={15} color="var(--primary)" />
                      <span>{showSources ? t.ask.hideSourcesBtn : t.ask.viewSourcesBtn}</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-soft)', fontWeight: 400 }}>
                        {t.ask.sourcesCount(response.citations.length)}
                      </span>
                    </span>
                    {showSources ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Conteúdo Expandido das Fontes */}
                  {showSources && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      {response.citations.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            backgroundColor: '#F8F9FA',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {c.document} ({c.edition})
                            </span>
                            {/* Selo estrito: Somente fontes 'verified' recebem badge oficial verde */}
                            {c.validationStatus === 'verified' ? (
                              <span
                                style={{
                                  backgroundColor: '#EBF5FB',
                                  color: '#21618C',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <CheckCircle size={10} color="#21618C" />
                                {t.ask.verifiedGuidelineBadge}
                              </span>
                            ) : (
                              <span
                                style={{
                                  backgroundColor: '#FEF9E7',
                                  color: '#7D6608',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Clock size={10} color="#7D6608" />
                                {t.ask.pendingReviewBadge}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <strong>{c.sourceName}</strong> — {c.sectionOrPage}
                          </div>

                          {/* Contexto de Jurisdição Internacional */}
                          <div style={{ fontSize: '0.73rem', color: '#566573' }}>
                            🌍 {c.countryJurisdiction === 'GLOBAL' ? t.ask.jurisdictionGlobal : t.ask.jurisdictionBR}
                          </div>

                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '2px',
                                textDecoration: 'none'
                              }}
                            >
                              <span>{t.ask.officialLinkText}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botão de Nova Consulta */}
          <button
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ width: '100%', minHeight: '44px', gap: '8px', fontSize: '0.9rem' }}
          >
            <RotateCcw size={16} />
            <span>{t.ask.newConsultationBtn}</span>
          </button>
        </div>
      )}

      {/* Transparência da Etapa 4A */}
      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-soft)', fontSize: '0.78rem', marginTop: '12px' }}>
        🛡️ <strong>{t.ask.statusNoticeTitle}</strong> {t.ask.statusNoticeDesc}
      </div>
    </div>
  );
};
