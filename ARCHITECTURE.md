# Arquitetura do Sistema

## 1. Visão Geral (Local-First Core)

O **Primeiros 1.000 Dias / Open Child Health Booklet** foi concebido sob o paradigma **Local-First**, assegurando que toda a lógica de negócio essencial, as regras clínicas de triagem e a persistência de registros aconteçam diretamente no dispositivo da usuária (*client-side*).

O aplicativo opera como uma Progressive Web App (PWA) estática, desenvolvida em **React 18** com **TypeScript** e empacotada com **Vite**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO DA USUÁRIA                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Interface Web (React / PWA)                   │  │
│  │       - Abas: Hoje, Pergunte (Educativo), Jornada, Cuidados      │  │
│  └──────────┬─────────────────────────────┬─────────────────────────┘  │
│             │                             │                            │
│             ▼                             ▼                            │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Motor de Regras Local │   │        Banco Local Estruturado       │  │
│  │ (Proatividade Offline)│   │        IndexedDB (`journey_records`) │  │
│  │ - Ponderação de fase  │   │        - Sem envio de PII a servidores│  │
│  │ - Resposta a check-in │   │        - Exportação JSON e TXT       │  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────────────┘
                            │ Requisições de IA Educativa (Fase 2)
                            │ (Apenas pergunta anonimizada + faixa etária)
                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│               SERVIÇO DE EXTENSÃO DESACOPLADO (EDGE RAG)               │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │        Edge API Gateway (Cloudflare Worker / Vercel Edge)        │  │
│  │        - Stateless Proxy / Rate Limiting / Zero-Body Logging     │  │
│  └──────────────┬───────────────────────────────────┬───────────────┘  │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│  ┌──────────────────────────────┐     ┌─────────────────────────────┐  │
│  │     Base Vetorial RAG        │     │       Provedor de LLM       │  │
│  │  (Trechos da Caderneta/OMS)  │     │   (Agnóstico via OpenAI API)│  │
│  └──────────────────────────────┘     └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo de Dados Local (IndexedDB)

Os registros residem na base `first_1000_days_db` (ObjectStore `journey_records`):

```typescript
export interface JourneyRecord {
  id: string;                         // Identificador único do registro (ex: "rec-1730000000")
  subject: 'baby' | 'mom' | 'memory'; // Classificação do sujeito do cuidado
  tags: string[];                     // Marcações de contexto selecionadas
  note?: string;                      // Anotação textual contextualizada
  sourceActivityTitle?: string;       // Título da orientação prática vinculada
  contentId?: string;                 // ID da atividade (prevenção contra duplicatas diárias)
  timestamp: string;                  // Data/hora de gravação (ISO 8601)
  eventDate: string;                  // Data efetiva do acontecimento (YYYY-MM-DD, suporta datas anteriores)
  dateLabel: string;                  // Rótulo amigável exibido na linha do tempo
}
```

---

## 3. Segurança e Privacidade por Design

1. **Zero-PII na Nuvem:** O protótipo opera sem banco de dados central na nuvem para registros de usuárias. Todos os dados permanecem na sandbox do navegador (IndexedDB).
2. **Sem Fallback Inseguro:** Se o IndexedDB estiver bloqueado por políticas do navegador, o aplicativo informa a limitação abertamente, sem gravar dados sensíveis de saúde em texto plano no `localStorage`.
3. **Soberania e Portabilidade:** A usuária pode gerar backup estruturado em `.json` ou exportar resumo textual formatado em `.txt` a qualquer momento para levar a consultas médicas.
4. **Exclusão Local Segura:** O comando de limpeza esvazia o banco de dados do aparelho de forma irreversível mediante confirmação explícita.
