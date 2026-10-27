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
| **2. Assistente Educativo com RAG Desacoplado** | Meses 3–5 | Implementação de Edge API Gateway sem estado, indexação de diretrizes oficiais em base vetorial aberta, respostas com citação de fontes e filtros rigorosos contra emissão de diagnósticos. | *Próxima Etapa (Etapa 4)* |
| **3. Usabilidade e Revisão com Cuidadoras** | Meses 5–7 | Testes de usabilidade com mães e profissionais de saúde da família; auditoria de acessibilidade (WCAG 2.1 AA); testes em celulares de entrada e redes de baixa conectividade. | *Planejado* |
| **4. Piloto Comunitário em Atenção Primária** | Meses 7–12 | Projeto piloto em Unidades Básicas de Saúde (UBS) parceiras; medição de continuidade do cuidado e engajamento da família no acompanhamento do desenvolvimento infantil. | *Planejado* |

---

## O que já está implementado (Versão Atual)
- [x] Estrutura React 18 + TypeScript + Vite.
- [x] Suporte bilíngue nativo em Português brasileiro (`pt-BR`) e Inglês internacional (`en`) sem chamadas de IA pagas.
- [x] Seletor discreto `PT | EN` no Onboarding e no Header principal.
- [x] Onboarding simplificado sem solicitação de e-mail ou dados pessoais.
- [x] Home interativa com check-in reativo e adaptação imediata das orientações.
- [x] Catálogo de orientações oficiais com referências bibliográficas auditáveis (Caderneta da Criança, Caderneta da Gestante, OMS) em ambos os idiomas.
- [x] Integração direta entre cartões de Cuidados e registros da Jornada.
- [x] Persistência estruturada em IndexedDB local com prevenção de toques repetidos.
- [x] Registro com suporte a datas anteriores e contexto obrigatório para acontecimentos sensíveis.
- [x] Linha do tempo com navegação mensal, busca textual e filtros por categoria.
- [x] Exportação de backup em `.json` e relatório para puericultura em `.txt` formatado no idioma ativo.

## O que ainda NÃO está implementado nesta fase
- Conexão em nuvem com provedores de Inteligência Artificial (prevista para a Fase 2 / Etapa 4).
- Notificações push em segundo plano.
- Sincronização multi-dispositivo ou autenticação centralizada.
- Integração formal com prontuários eletrônicos do SUS (e-SUS / SISAB).
- Validação clínica longitudinal (objeto do plano piloto de 12 meses).
