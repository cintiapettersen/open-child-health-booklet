import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Send, ShieldAlert, BookOpen, Sparkles } from 'lucide-react';

interface AskViewProps {
  profile: UserProfile;
}

export const AskView: React.FC<AskViewProps> = ({ profile }) => {
  const [question, setQuestion] = useState('');

  const sampleQuestions = profile.phase === 'pregnancy' ? [
    'É normal sentir sono excessivo no primeiro trimestre?',
    'Quais alimentos evitar durante a gestação?',
    'Como identificar os primeiros sinais do trabalho de parto?'
  ] : [
    'Bebê de 2 meses soluçando muito após mamar é perigoso?',
    'Como sei se a pega da amamentação está correta?',
    'Quantas horas de sono são esperadas nessa idade?'
  ];

  return (
    <div className="content-area">
      <div style={{ marginBottom: '16px' }}>
        <span className="tag-badge tag-sage" style={{ marginBottom: '6px' }}>
          Assistente Educativo
        </span>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Tire suas dúvidas
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Respostas fundamentadas em guias oficiais de saúde (OMS e Ministério da Saúde).
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
          <strong>Aviso de Saúde:</strong> Este assistente tem finalidade exclusivamente educativa e informativa. Ele não substitui consultas presenciais, diagnósticos ou condutas médicas.
        </div>
      </div>

      {/* Sugestões de Perguntas Rápidas */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          Dúvidas comuns para {profile.stageLabel}:
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
          Sua pergunta:
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: Como lidar com cólicas no bebê de 2 meses?"
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
            <span>Fontes: MS / OMS</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 18px', minHeight: '42px', fontSize: '0.88rem' }}
            onClick={() => {
              alert('Estrutura de interface pronta! A conexão com o Edge Gateway e RAG com citação de fontes será ativada na Etapa 4.');
            }}
          >
            <span>Consultar</span>
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Nota da Etapa de Implementação */}
      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-soft)', fontSize: '0.78rem' }}>
        🔌 <strong>Etapa 1 (Concluída):</strong> Interface e contratos de dados prontos.<br />
        Aguardando <strong>Etapa 4</strong> para conexão com o RAG real via Edge Gateway.
      </div>
    </div>
  );
};
