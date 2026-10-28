# Primeiros 1.000 Dias | First 1,000 Days

**Companheiro digital de apoio, orientações e registros para os primeiros 1.000 dias de vida — da gestação aos dois anos da criança.**  
*An open-source digital companion for maternal and early childhood care, guidance, and daily tracking (pregnancy through age 2).*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-MVP_Stage_5_Offline_PWA_Restore-success.svg)](ROADMAP.md)
[![Language](https://img.shields.io/badge/Language-pt--BR%20%7C%20en-orange.svg)](LOCALIZATION.md)
[![Architecture](https://img.shields.io/badge/Architecture-Local--First_PWA-brightgreen.svg)](ARCHITECTURE.md)

> **Contexto / Context:** Projeto independente de código aberto desenvolvido em preparação para a candidatura ao **UNICEF Venture Fund FemTech 2026**.  
> *(Nota de transparência: Este projeto encontra-se em fase de prototipagem e desenvolvimento comunitário. Não há, até o momento, parceria formal, aprovação prévia, financiamento governamental ou validação clínica concluída. O projeto adota como referência os princípios do Digital Public Goods Standard, sem alegar certificação prévia).*

---

## 1. O Conceito | The Concept

Os primeiros 1.000 dias (da concepção até o segundo aniversário) representam uma janela biológica e afetiva única para o desenvolvimento humano. No entanto, as mães e cuidadoras frequentemente enfrentam sobrecarga de tarefas, dúvidas diárias e informações dispersas.

O **Primeiros 1.000 Dias** foi desenhado como uma ferramenta leve e humanizada, baseada em três pilares fundamentais:

- **ORIENTAR (Guidance):** Oferecer informações de saúde confiáveis, adaptadas exatamente à semana de gestação ou à idade do bebê, com citações oficiais de fontes públicas (Ministério da Saúde do Brasil e OMS / WHO).
- **CUIDAR (Care):** Transformar orientações teóricas em pequenas ações práticas do cotidiano (alimentação, vínculo afetivo, estimulação precoce e bem-estar materno), sem cobranças de desempenho.
- **ACOMPANHAR (Track):** Permitir registros simples de acontecimentos, saúde, observações da mãe e memórias afetivas, organizados em uma linha do tempo mensal.

---

## 2. Princípios de Arquitetura & Governança

1. **Funcionamento Sem Login (Zero-Account Architecture):**  
   O aplicativo não exige cadastro de e-mail, senha, telefone, redes sociais ou identificadores biométricos. Não há sincronização automática com nuvem nem criação de perfis centralizados em servidores de terceiros.
2. **Local-First & Armazenamento Seguro (IndexedDB):**  
   Todos os dados de saúde, check-ins diários e notas pessoais residem exclusivamente no banco estruturado **IndexedDB** (`first_1000_days_db`) na sandbox do próprio navegador da usuária.
3. **PWA com Funcionamento Offline Real:**  
   O aplicativo conta com Manifesto PWA (`manifest.webmanifest`) e Service Worker (`sw.js`) com estratégia *Cache-First* e *Stale-While-Revalidate* para o App Shell. O carregamento de tipografia utiliza fallbacks nativos do sistema (`system-ui` e `Georgia`), permitindo abertura instantânea mesmo sem qualquer sinal de rede.
4. **Soberania e Recuperação de Dados (Backup & Restore Atômico):**  
   A usuária pode exportar todo o histórico em formato aberto `.JSON` ou como resumo para consultas de puericultura em `.TXT`. É possível restaurar backups com validação de esquema (`schemaVersion: 1.0`), prévia informativa e escolha entre mesclagem desduplicada (*merge*) ou substituição integral atômica (*replace* com confirmação explícita e rollback automático).
5. **Assistente RAG Desacoplado & Modo Mock de Custo Zero:**  
   A camada de inteligência educativa reside em um Edge Gateway isolado (`/gateway`). Por padrão, opera em `MOCK_MODE=true` com custo financeiro zero, acionando o modelo Gemini 3.5 Flash-Lite apenas se explicitamente configurado no servidor, com chave privada jamais exposta ao cliente.
6. **Não-Diagnóstico & Governança Clínica:**  
   O sistema é uma ferramenta educativa e de puericultura. Não substitui consultas presenciais, não emite prescrições e possui salvaguarda imediata para emergências médicas (acionando o SAMU 192 ou 911).

---

## 3. Estado Atual do MVP (O que já funciona)

- [x] **Funcionamento Sem Login:** Acesso imediato sem qualquer solicitação de dados cadastrais.
- [x] **Suporte Bilíngue Completo (PT-BR e EN):** Seletor discreto `PT | EN` acessível no onboarding e no cabeçalho, com tradução estática tipada em TypeScript.
- [x] **PWA Instalável e Offline Real:** Carregamento rápido via Service Worker, sem dependências bloqueadoras de rede para fontes.
- [x] **Onboarding Rápido em 3 Passos:** Seleção de momento (Gestante vs. Bebê), fase/semana e foco de apoio principal.
- [x] **Home Interativa com Check-in Reativo:** Resposta da mãe ao sono/disposição calibra dinamicamente as orientações do dia.
- [x] **Três Recomendações Diárias:** Orientação para o bebê, sugestão de cuidado para a mãe e prática vinculada ao foco escolhido.
- [x] **Integração Cuidados ➔ Jornada:** Gravação com um toque da atividade realizada na linha do tempo.
- [x] **Jornada de Registros Contextualizada:** Marcação de acontecimentos com suporte a datas retroativas e notas detalhadas.
- [x] **Linha do Tempo Mensal com Busca e Filtros:** Navegação mensal e busca textual em tempo real.
- [x] **Exportação de Dados:** Geração instantânea de arquivo `.JSON` completo e `.TXT` legível para consultas de saúde.
- [x] **Restauração de Backup com Validação:** Leitura local de `.JSON`, prévia de registros, mesclagem e substituição atômica com rollback.
- [x] **Aba Pergunte com Triagem Preventiva:** Sanitização local de PII (CPF e telefones), detector de emergências médicas locais (SAMU 192), e citação de diretrizes oficiais com identificação visual do modo (Mock vs. IA).

---

## 4. Limitações Conhecidas, Privacidade e Modo Offline

- **Armazenamento no Navegador:** Se a usuária limpar os dados de navegação do navegador ou desinstalar o aplicativo sem ter feito uma exportação de backup prévia em `.JSON`, os registros locais serão permanentemente apagados.
- **Segurança do Arquivo de Backup:** O arquivo exportado contém anotações pessoais em formato de texto aberto. A família deve armazená-lo em local de confiança (como pendrive seguro, pasta pessoal protegida ou nuvem criptografada privada).
- **Modo Offline do Assistente:** O acervo de orientações educativas e todos os registros da Jornada funcionam 100% offline. No entanto, a consulta com inteligência artificial em tempo real via Edge Gateway exige conectividade de rede; se o dispositivo estiver desconectado, o aplicativo indica claramente o estado offline e disponibiliza o catálogo demonstrativo local.
- **Conteúdos Pendentes de Revisão Clínica:** Orientações e práticas de puericultura que ainda não possuem consenso formal unificado em diretrizes públicas oficiais são expressamente sinalizadas como `pending_review` ou `demonstrative` no catálogo, devendo ser submetidas a comitê clínico antes de uso em larga escala.

---

## 5. Como Executar Localmente

### Pré-requisitos
- **Node.js** v18.0.0 ou superior (recomendado v20+ ou v24).
- **npm** v9 ou superior.

### 1. Iniciar o Frontend (PWA Client)
```bash
# 1. Clone o repositório
git clone https://github.com/cintiapettersen/open-child-health-booklet.git
cd open-child-health-booklet

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```
Acesse em: **[http://localhost:3000](http://localhost:3000)**.

### 2. Iniciar o Edge Gateway Local (Opcional - Aba Pergunte)
O frontend já possui fallback integrado em modo Mock no cliente. Para rodar o gateway localmente:
```bash
cd gateway
npm install
node scripts/localGateway.cjs
```
O gateway escutará em `http://127.0.0.1:8787` operando em `MOCK_MODE=true` (custo zero e sem chamadas externas).

### 3. Executar as Suítes de Testes Automatizados
```bash
# Testes unitários de backup, PWA offline e testes E2E
node --test --experimental-strip-types test/*.test.ts
```

### 4. Compilar para Produção (PWA)
```bash
npm run build
npm run preview
```
Os arquivos otimizados serão gerados em `dist/`, incluindo `sw.js`, `manifest.webmanifest` e os pacotes estáticos.

---

## 6. Configuração e Implantação para Outras Organizações (Self-Hosting)

O projeto é 100% aberto e desacoplado, permitindo que secretarias de saúde, municípios ou ONGs façam sua própria implantação independente:

1. **Hospedagem do Frontend (Estático / Custo Zero):**  
   O conteúdo da pasta `dist/` pode ser hospedado em qualquer servidor estático seguro com suporte a HTTPS (necessário para Service Worker e PWA): Cloudflare Pages, GitHub Pages, Vercel ou servidores Nginx municipais.
2. **Configuração de Idiomas e Catálogo Regional:**  
   Consulte [LOCALIZATION.md](LOCALIZATION.md) para adaptar as referências legais e sanitárias para o país ou região de atendimento.
3. **Gateway Opcional com Chave Privada Gemini:**  
   Caso a organização deseje ativar consultas com IA generativa fundamentada via Gemini 3.5 Flash-Lite, deve realizar deploy do diretório `/gateway` no Cloudflare Workers (`wrangler deploy`) e configurar a variável segura:
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```
   E ajustar `MOCK_MODE=false` e `ALLOWED_ORIGIN` no ambiente do Worker.

---

## 7. Estrutura do Repositório

```
├── .gitignore               # Proteção estrita contra vazamento de chaves (.dev.vars, node_modules, logs)
├── LICENSE                  # Licença Apache 2.0 para o software
├── NOTICE                   # Histórico de atribuição e integridade
├── ARCHITECTURE.md          # Arquitetura detalhada do Local-First Core e Edge Gateway
├── LOCALIZATION.md          # Governança clínica de idiomas (pt-BR e en)
├── ROADMAP.md               # Planejamento de etapas e entregas
├── index.html               # Shell HTML com PWA manifest e fontes resilientes
├── package.json             # Dependências limpas
├── tsconfig.json            # Configuração estrita TypeScript
├── vite.config.ts           # Configuração de build Vite
├── public/                  # Assets PWA (manifest.webmanifest, sw.js, icon-192.svg, icon-512.svg)
├── gateway/                 # Edge API Gateway Cloudflare Worker & RAG Engine
│   ├── src/                 # Lógica de RAG, triagem de emergências e PII Scrubber
│   ├── scripts/             # Daemon local para testes sem Cloudflare CLI
│   └── test/                # Suíte com 112 testes automatizados do gateway
├── test/                    # Testes de backup, restauração atômica, PWA e E2E
└── src/
    ├── main.tsx             # Inicialização React e registro do Service Worker
    ├── App.tsx              # Orquestrador das abas e ciclo de vida de dados
    ├── types/               # Tipos TypeScript estruturados
    ├── locales/             # Dicionários tipados pt-BR e en
    ├── context/             # LanguageContext com persistência reativa
    ├── data/                # Catálogo de conteúdos e check-ins bilíngues
    ├── services/            # indexedDbService, askService, ruleEngine, profileStorage
    ├── styles/              # Design System acolhedor
    ├── components/          # Componentes reutilizáveis
    └── views/               # TodayView, AskView, JourneyView, CareView, Onboarding
```

---

## 8. Licenciamento e Direitos Autorais

- **Software:** Licenciado sob a [Apache License, Version 2.0](LICENSE).
- **Atribuição Histórica:** O conceito e os arquivos fundacionais originais foram iniciados sob a licença MIT por Cintia Pettersen em outubro de 2026 (consulte o arquivo [NOTICE](NOTICE)).
- **Conteúdos de Saúde:** As diretrizes e textos de saúde pública citados pertencem às suas respectivas instituições de origem (Ministério da Saúde do Brasil e OMS) e são utilizados estritamente para fins educativos de saúde pública (consulte [content/LICENSE-CONTENT.md](content/LICENSE-CONTENT.md)).
