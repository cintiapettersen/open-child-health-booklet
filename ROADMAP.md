# Roadmap do Projeto (12 Meses)

> **Candidatura:** Preparação para o UNICEF Venture Fund FemTech 2026  
> **Natureza:** Software de Código Aberto / Bem Público Digital (em desenvolvimento)

---

## Fases de Desenvolvimento

| Fase | Período | Objetivos Principais | Status |
| :--- | :---: | :--- | :---: |
| **0. Fundação** | Mês 0 | Definição de premissas, repositório público, diretrizes de privacidade por design e modelo de dados preliminar. | **Concluída** |
| **1. MVP Funcional Local-First** | Meses 1–3 | PWA estático, design system acolhedor, onboarding em 3 passos, Home interativa com check-in reativo, motor local de regras com catálogo oficial (MS/OMS), persistência em IndexedDB, linha do tempo mensal e exportação JSON/TXT. | **Concluída (v0.1.0)** |
| **1.1. Internacionalização (i18n)** | Mês 3 | Suporte bilíngue completo (pt-BR e en), dicionários tipados em TypeScript, seletor de idioma discreto (PT \| EN), governança clínica e diretrizes de localização (`LOCALIZATION.md`). | **Concluída (v0.1.1)** |
| **2. Assistente Educativo com RAG Desacoplado** | Meses 3–4 | Edge API Gateway Cloudflare Workers, RAG com busca lexical/BM25, sanitizador de PII no cliente, salvaguardas imediatas para emergências (SAMU 192), suporte desacoplado ao Gemini 3.5 Flash-Lite e suíte de 112 testes automatizados. | **Concluída (v0.2.0)** |
| **3. Resiliência Offline & Restauração Atômica** | Meses 4–5 | PWA com Service Worker Cache-First/Stale-While-Revalidate, remoção de bloqueio de rede para fontes, importador e restaurador de backup JSON com transações atômicas no IndexedDB (mesclagem e substituição com rollback), e isolamento de privacidade no cache. | **Concluída (v0.3.0)** |
| **4. Usabilidade e Publicação de Demonstração** | Meses 5–7 | Refinamento visual e UX (Etapa 6); publicação subsequente do frontend PWA na Vercel (em modo demonstrativo e sem gateway externo conectado); testes de usabilidade com cuidadoras e profissionais de saúde; auditoria de acessibilidade (WCAG 2.1 AA). | *Próxima Etapa (Etapa 6 & Vercel)* |
| **5. Piloto Comunitário em Atenção Primária** | Meses 7–12 | Projeto piloto em Unidades Básicas de Saúde (UBS) parceiras; medição de continuidade do cuidado e engajamento da família no acompanhamento do desenvolvimento infantil. | *Planejado* |

---

## O que já está implementado (Versão Atual)
- [x] Estrutura React 18 + TypeScript + Vite.
- [x] Arquitetura sem login nem coleta de dados pessoais.
- [x] Suporte bilíngue nativo em Português brasileiro (`pt-BR`) e Inglês internacional (`en`).
- [x] PWA com manifesto e Service Worker operando offline sem bloqueio de rede para fontes.
- [x] Onboarding simplificado sem solicitação de e-mail ou dados pessoais.
- [x] Home interativa com check-in reativo e adaptação imediata das orientações.
- [x] Catálogo de orientações oficiais com referências bibliográficas auditáveis (Caderneta da Criança, Caderneta da Gestante, OMS) em ambos os idiomas.
- [x] Integração direta entre cartões de Cuidados e registros da Jornada.
- [x] Persistência estruturada em IndexedDB local com prevenção de toques repetidos.
- [x] Exportação de backup em `.JSON` e resumo formatado para puericultura em `.TXT`.
- [x] Restauração atômica de backup com validação de esquema 1.0, prévia informativa, modo mesclar e modo substituição com confirmação explícita.
- [x] Aba Pergunte com Edge Gateway desacoplado, PII scrubber local, detector de emergência (SAMU 192), e RAG com citações auditáveis.

## O que ainda NÃO está implementado nesta fase
- Notificações push em segundo plano.
- Sincronização multi-dispositivo ou autenticação centralizada (mantido Local-First propositalmente para privacidade).
- Integração formal com prontuários eletrônicos do SUS (e-SUS / SISAB).
- Validação clínica longitudinal colegiada (objeto do plano piloto de 12 meses).

---

## Planejamento de Publicação do Frontend (Vercel)

Após a conclusão da **Etapa 6 (Refinamentos Visuais e UX)**, o frontend estático do First 1,000 Days será publicado na Vercel para testes de usabilidade e ergonomia em dispositivos móveis reais:

1. **Hospedagem Estritamente Estática (Client-Side):**  
   Apenas o bundle compilado do frontend React/Vite (`dist/`) será servido via CDN global da Vercel.
2. **Modo Demonstrativo Local Garantido (Custo Zero):**  
   O Edge Gateway Gemini **não será conectado** nessa publicação. A aba Pergunte utilizará exclusivamente o motor local de evidências (Modo Mock educativo), com identificação visual transparente de conteúdo demonstrativo.
3. **Configuração de Rotas e PWA (`vercel.json`):**  
   O arquivo `vercel.json` gerencia as regras de reescrita para SPA (`/(.*) -> /index.html`) e os cabeçalhos de controle de cache do Service Worker (`/sw.js` com `max-age=0, must-revalidate`).
4. **Preservação do IndexedDB:**  
   Toda a persistência da Jornada e dos check-ins permanece operando 100% no dispositivo da usuária via IndexedDB, sem sincronização com a nuvem.
5. **Segurança de Credenciais:**  
   Nenhuma chave privada ou segredo reside ou pode ser incorporado ao frontend.

