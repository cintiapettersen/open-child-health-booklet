# First 1,000 Days — Decoupled Edge Gateway & RAG Engine

Módulo desacoplado de backend projetado para implantação no **Cloudflare Workers**, implementando arquitetura RAG (Retrieval-Augmented Generation) com base de evidências oficiais verificadas e suporte ao modelo **Gemini 3.5 Flash-Lite**.

---

## 🎯 Princípios Fundamentais (DPG Standard & UNICEF FemTech 2026)

1. **Privacidade e Soberania dos Dados:**
   - **Zero registros da Jornada enviados ao servidor:** Diários, memórias, fotos e dados pessoais nunca saem do dispositivo.
   - **Data Minimization:** O Gateway recebe estritamente `{ question, phase, stageValue, lang }`.
   - **Sem fingerprinting persistente:** Identificação efêmera por IP utilizando hash SHA-256 com sal temporário (`hash(IP + YYYY-MM-DD + salt)`). O IP do usuário nunca é armazenado.
   - **Anonimização no cliente e no servidor:** Regex sanitiza telefones, CPFs, e-mails e apresentações nominais antes do processamento.

2. **Segurança de Credenciais:**
   - Chave `GEMINI_API_KEY` mantida **exclusivamente como segredo de ambiente no servidor** (`wrangler secret put GEMINI_API_KEY`).
   - O aplicativo cliente PWA contém **zero credenciais ou segredos embutidos**.

3. **Salvaguarda de Emergência Médica:**
   - Detecção conservadora de termos associados a urgências agudas (ex: febre em lactente < 3 meses, desconforto respiratório grave, convulsões, hemorragia pós-parto, ideação de autoagressão).
   - Redirecionamento imediato para serviços de emergência (SAMU 192 no Brasil / serviços locais internacionais), **sem gerar triagem clínica autônoma ou consumir tokens de IA**.

4. **Governança Clínica Estrita:**
   - Somente são geradas respostas fundamentadas em evidências com status `validationStatus: 'verified'`, citando explicitamente documento, edição, página/seção e instituição oficial (Ministério da Saúde do Brasil / OMS / UNICEF).
   - Caso a pergunta não encontre evidência comprovada no catálogo, o assistente emite uma **recusa responsável e orienta busca presencial por profissional de saúde**.

5. **Modo Mock (Custo Zero e Desenvolvimento Desconectado):**
   - Ativo por padrão (`MOCK_MODE=true` ou ausência de chave).
   - Executa a recuperação RAG completa e sintetiza respostas baseadas nos trechos oficiais, permitindo testes locais ilimitados sem gastar cota financeira.

6. **Controle de Consumo e Limites no Gateway:**
   - **Rate Limiting:** Limite de 15 consultas por janela de 10 minutos por cliente efêmero.
   - **Cota Diária Global:** Teto diário configurável (padrão: 500 consultas/dia) para proteção de orçamento do projeto, não dependendo apenas do billing do provedor.

---

## 📂 Estrutura de Arquivos

```
gateway/
├── wrangler.toml              # Configuração do Cloudflare Workers
├── package.json               # Configurações de dependências e scripts
├── tsconfig.json              # Configurações TypeScript para Cloudflare Workers
├── README.md                  # Este documento
├── src/
│   ├── index.ts               # Handler principal fetch(), rotas, CORS e orquestração
│   ├── types.ts               # Tipos TypeScript estritos da API
│   ├── config.ts              # Constantes de configuração e limites
│   ├── data/
│   │   └── evidenceCatalog.ts # Catálogo oficial verificado (MS Brasil / OMS)
│   └── services/
│       ├── ragService.ts      # Motor de busca semântica/lexical com relevância
│       ├── safetyService.ts   # Salvaguarda conservadora de emergências clínicas
│       ├── piiScrubber.ts     # Filtro de dados pessoais (PII)
│       ├── rateLimiter.ts     # Rate limiter efêmero e controle de cota diária
│       ├── mockEngine.ts      # Sintetizador de respostas fundamentadas em Mock
│       └── geminiEngine.ts    # Cliente desacoplado para Gemini 3.5 Flash-Lite
└── test/
    └── gateway.test.ts        # Suíte de testes automatizados unitários e de integração
```

---

## 🚀 Como Executar Localmente

### 1. Testes Automatizados (Zero Dependências Externas)

```bash
# Compila e roda os 34 testes automatizados
npx esbuild test/gateway.test.ts --bundle --platform=node --outfile=test/gateway.test.cjs && node test/gateway.test.cjs
```

### 2. Desenvolvimento com Wrangler ou Executor Local Node.js

**Opção A — Com Wrangler (Simulador Cloudflare Workers):**
```bash
cd gateway
npm install
npm run dev
# O Worker estará acessível em http://localhost:8787
```

**Opção B — Com Executor Local Node.js (Sem Cloudflare CLI):**
O código-fonte do servidor local reside em `scripts/localGateway.ts`. O arquivo compilado `scripts/localGateway.cjs` é um artefato gerado ignorado pelo git.
```bash
cd gateway
npm install
npm run build:server   # Compila scripts/localGateway.ts com esbuild
npm run dev:local      # Inicia o daemon local em http://127.0.0.1:8787 em MOCK_MODE
```

### 3. Endpoints Disponíveis

- **`GET /health`**: Retorna status, modo ativo (mock/live), trechos carregados e cota diária disponível.
- **`POST /api/ask`**: Consulta educativa RAG.
  - **Payload:**
    ```json
    {
      "question": "Qual a posição recomendada para o bebê dormir?",
      "phase": "baby",
      "stageValue": 2,
      "lang": "pt-BR"
    }
    ```
  - **Resposta de Sucesso:**
    ```json
    {
      "status": "success",
      "answer": "Com base nas diretrizes oficiais do Ministério da Saúde do Brasil...",
      "citations": [
        {
          "id": "ev-safe-sleep-01",
          "sourceName": "Ministério da Saúde do Brasil",
          "document": "Caderneta da Criança - Passaporte da Cidadania",
          "edition": "5ª Edição, 2022/2023",
          "sectionOrPage": "Página 43 (Cuidados com o Sono e Prevenção de Acidentes)",
          "validationStatus": "verified"
        }
      ],
      "mode": "mock",
      "retrievedCount": 1
    }
    ```

---

## 🔒 Ativação Futura do Gemini 3.5 Flash-Lite

Para migrar de Mock Mode para o modelo real da Google Cloud / AI Studio:

1. Obter a chave exclusiva do projeto no Google AI Studio (sob plano pago Pay-As-You-Go, garantindo que os dados não sejam usados para treino de modelos).
2. Definir o segredo no Cloudflare Workers:
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```
3. Alterar `MOCK_MODE = "false"` em `wrangler.toml` (ou via variável de ambiente de produção).
4. Fazer deploy:
   ```bash
   wrangler deploy
   ```
