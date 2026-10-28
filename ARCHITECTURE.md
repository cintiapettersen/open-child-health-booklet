# Arquitetura do Sistema

## 1. Visão Geral (Local-First Core & Edge Desacoplado)

O **Primeiros 1.000 Dias / Open Child Health Booklet** foi concebido sob o paradigma **Local-First**, assegurando que toda a lógica de negócio essencial, as regras de triagem de puericultura e a persistência de registros aconteçam diretamente no dispositivo da usuária (*client-side*).

O aplicativo opera como uma Progressive Web App (PWA) estática e desacoplada, desenvolvida em **React 18** com **TypeScript** e empacotada com **Vite**, complementada opcionalmente por um Edge Gateway sem estado (*serverless*).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO DA USUÁRIA                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Interface Web (React / PWA)                   │  │
│  │       - Abas: Hoje, Pergunte (Educativo), Jornada, Cuidados      │  │
│  │       - PWA Service Worker (Cache-First / Stale-While-Revalidate) │  │
│  └──────────┬─────────────────────────────┬─────────────────────────┘  │
│             │                             │                            │
│             ▼                             ▼                            │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Motor de Regras Local │   │        Banco Local Estruturado       │  │
│  │ (Proatividade Offline)│   │        IndexedDB (`journey_records`) │  │
│  │ - Ponderação de fase  │   │        - Sem login nem envio de PII  │  │
│  │ - Resposta a check-in │   │        - Import/Export atômico JSON  │  │
│  │ - PII Scrubber Cliente│   │        - Resumo formatado em TXT     │  │
│  │ - Salvaguarda SAMU 192│   │        - Zero dependência de rede    │  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────────────┘
                            │ Requisições de IA Educativa (Aba Pergunte)
                            │ (Apenas pergunta sanitizada + faixa etária)
                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│               SERVIÇO DE EXTENSÃO DESACOPLADO (EDGE GATEWAY)           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │        Edge API Gateway (Cloudflare Worker na pasta /gateway)    │  │
│  │        - Stateless Proxy / Rate Limiting / Zero-Body Logging     │  │
│  │        - Hash efêmero de IP / Quota Diária / Anti-Abuso          │  │
│  └──────────────┬───────────────────────────────────┬───────────────┘  │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│  ┌──────────────────────────────┐     ┌─────────────────────────────┐  │
│  │     Base RAG Lexical/BM25    │     │       Provedor de LLM       │  │
│  │  (Trechos da Caderneta/OMS)  │     │   (Gemini 3.5 Flash-Lite)   │  │
│  │  - Citações auditáveis       │     │   - Chave em .dev.vars      │  │
│  │  - Classificação de relevância│     │   - MOCK_MODE=true padrão   │  │
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
  eventDate: string;                  // Data efetiva do acontecimento (YYYY-MM-DD, suporta retroatividade)
  dateLabel: string;                  // Rótulo amigável exibido na linha do tempo
}
```

---

## 3. Arquitetura PWA e Resiliência Offline

O aplicativo implementa padrões modernos de PWA para garantir funcionamento autônomo em regiões de baixa conectividade ou áreas rurais:

1. **Manifesto PWA (`public/manifest.webmanifest`)**:
   - `display: "standalone"`, permitindo instalação na tela de início de smartphones Android e iOS.
   - Cores temáticas `#FAF7F2` consistentes com a identidade acolhedora do projeto.
   - Ícones vetoriais SVG em resoluções 192x192 e 512x512.
2. **Service Worker (`public/sw.js`)**:
   - **Assets Estáticos**: Estratégia *Cache-First* combinada com *Stale-While-Revalidate* para o bundle JS/CSS e imagens.
   - **Navegação SPA**: Estratégia *Network-First* com fallback para o `index.html` em cache, viabilizando recargas de tela e navegação profunda sem internet.
   - **Isolamento Estrito de Privacidade**: O Service Worker intercepta requisições para `/api/*` e chamadas ao Edge Gateway local (porta 8787). Essas rotas **nunca são armazenadas no CacheStorage**. Em caso de falha de rede, o Service Worker devolve uma resposta HTTP 503 sintética sem persistir consultas ou respostas médicas.
3. **Eliminação do Bloqueio de Rede para Fontes**:
   - Folhas de estilo externas do Google Fonts são carregadas de forma assíncrona e não-bloqueadora (`media="print"` com comutação no evento `onload`).
   - O CSS define fallbacks nativos (`system-ui, -apple-system, sans-serif` e `Georgia, serif`), assegurando que a interface seja pintada imediatamente mesmo com a conexão desligada.

---

## 4. Restauração Atômica e Soberania de Dados

Para assegurar soberania completa dos dados sem depender de nuvem, o aplicativo implementa importação estruturada com transações atômicas nativas do IndexedDB:

1. **Validador de Esquema (`validateBackupJson`)**:
   - Verifica integridade JSON, versão do esquema (`1.0`), presença dos campos obrigatórios (`id`, `subject`, `eventDate`) e sintaxe de datas.
   - Desduplica IDs repetidos internamente no arquivo, preservando a primeira ocorrência.
   - Gera prévia detalhada com contagem por sujeito e amplitude de datas antes de qualquer gravação.
2. **Modo Mesclar (`restoreBackupMerge`)**:
   - Consulta as chaves existentes via `store.getAllKeys()`.
   - Adiciona apenas registros cujos IDs não constem na base local, preservando anotações prévias e evitando duplicações.
3. **Modo Substituição Integral (`restoreBackupReplace`)**:
   - Executa `store.clear()` e a re-inserção de todos os registros dentro de uma única transação `readwrite`.
   - Se ocorrer qualquer exceção durante a inserção, o método aciona `tx.abort()`, fazendo com que a API nativa do IndexedDB desfaça todas as alterações e restaure o estado anterior sem perda parcial.
   - Exige confirmação explícita por checkbox antes de habilitar o botão de ação.

---

## 5. Edge Gateway Desacoplado & RAG Educativo

A camada de consulta inteligente opera de modo estritamente desacoplado na pasta `/gateway`, desenhada para execução sem servidor (*serverless*) em **Cloudflare Workers**:

```
[ Usuária / PWA ] 
       │ 
       │  POST /api/ask { question, phase, stageValue, lang }
       ▼
┌────────────────────────────────────────────────────────┐
│ Cloudflare Workers Edge Gateway                        │
│ 1. Hash de IP efêmero com sal temporário (Anti-abuso)  │
│ 2. Rate Limiting (15 req/10min) + Cota Diária (500/dia)│
│ 3. PII Scrubber (Mascaramento de telefones/CPFs)       │
│ 4. Salvaguarda Imediata de Emergência (SAMU 192)       │
│ 5. RAG Retriever (BM25 lexical/semântico ponderado)    │
│ 6. Seletor de Modo:                                    │
│    ├─ MOCK_MODE=true: Mock Engine (Custo Zero)         │
│    └─ MOCK_MODE=false: Gemini 3.5 Flash-Lite (API Key) │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
          [ Resposta Educativa Fundamentada ]
          - Texto acolhedor focado em orientações práticas
          - Citações oficiais (Documento, Edição, Página)
          - Indicador visual do modo (Mock vs. IA Real)
          - Estimador de custos oficial ($0,30 in / $2,50 out por milhão)
          - Aviso ético de saúde não substituível
```

### Salvaguardas e Governança Clínica
1. **Credenciais no Servidor:** A chave `GEMINI_API_KEY` reside exclusivamente no arquivo seguro `.dev.vars` (no ambiente de desenvolvimento) ou em `wrangler secret put` (em produção), com zero credenciais no código compilado do frontend.
2. **Emergências Clínicas:** Situações agudas (como febre em lactente menor de 3 meses, sangramentos ou insuficiência respiratória) disparam imediatamente o aviso de emergência e o telefone do SAMU 192 (ou 911 em inglês), sem gerar chamadas de IA.
3. **Catálogo de Evidências:** As respostas fundamentam-se em trechos auditáveis do Ministério da Saúde do Brasil e da OMS. Quando uma pergunta não possui evidência correspondente, o assistente emite uma recusa responsável informando a limitação do acervo.
4. **Resiliência e Fallback Local:** Se o gateway estiver desligado, o frontend dispõe de um motor RAG local idêntico embutido no cliente operando em modo demonstrativo.

---

## 6. Instruções de Implantação para Outras Organizações (Self-Hosting)

Organizações públicas ou do terceiro setor podem implantar o sistema de forma totalmente independente:

### Frontend
- O build estático (`npm run build`) gera a pasta `dist/`.
- Pode ser servido em qualquer hospedagem estática compatível com HTTPS (obrigatório para Service Workers).
- O arquivo `.env` pode definir opcionalmente `VITE_GATEWAY_URL` para apontar para o gateway próprio da organização.

### Edge Gateway
- Localizado na pasta `gateway/`.
- Pode ser publicado via Cloudflare Workers (`npx wrangler deploy`) ou executado em contêineres Node.js usando o script `gateway/scripts/localGateway.cjs`.
- Variáveis de ambiente configuráveis:
  - `MOCK_MODE`: `true` (padrão) para operar com respostas simuladas auditáveis a custo zero; `false` para acionar a API do Gemini.
  - `GEMINI_API_KEY`: Chave da API do Google Cloud / Google AI Studio.
  - `GEMINI_MODEL`: `gemini-3.5-flash-lite`.
  - `ALLOWED_ORIGIN`: Origens HTTP permitidas para controle de CORS.
