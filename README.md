# Primeiros 1.000 Dias | First 1,000 Days

**Companheiro digital de apoio, orientações e registros para os primeiros 1.000 dias de vida — da gestação aos dois anos da criança.**  
*A open-source digital companion for maternal and early childhood care, guidance, and daily tracking (pregnancy through age 2).*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-MVP_Stage_3.1_i18n-success.svg)](ROADMAP.md)
[![Language](https://img.shields.io/badge/Language-pt--BR%20%7C%20en-orange.svg)](LOCALIZATION.md)

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

## 2. Princípios de Arquitetura | Architectural Principles

1. **Local-First & Resiliência Offline:** O aplicativo funciona diretamente no navegador através de tecnologias PWA e **IndexedDB**. Todos os registros permanecem salvos no próprio aparelho da família, funcionando perfeitamente sem conexão com a internet.
2. **Privacidade por Design (Privacy by Design):** Não há cadastro obrigatório de e-mail, senha ou dados pessoais sensíveis em servidores centrais. A usuária é soberana sobre seus dados.
3. **Internacionalização Sem IA em Execução (Zero-Cost i18n):** O sistema oferece suporte bilíngue nativo em **Português brasileiro (`pt-BR`) e Inglês internacional (`en`)** com dicionários estáticos tipados em TypeScript, sem chamadas a APIs pagas e sem risco de alucinação médica. Consulte [LOCALIZATION.md](LOCALIZATION.md).
4. **Não-Diagnóstico (Educational Scope):** O sistema é uma ferramenta de apoio educativo e organizacional; não fornece diagnósticos médicos, prescrições de dosagem ou condutas clínicas autônomas.
5. **Independência Tecnológica (Open Standards):** Todo o código é independente, de código aberto e executável por qualquer organização pública, prefeitura ou terceiro setor sem custos de licença proprietária.

---

## 3. Estado Atual do MVP (O que já funciona) | Current Features

- [x] **Suporte Bilíngue Completo (PT-BR e EN):** Seletor discreto `PT | EN` acessível no onboarding e no cabeçalho, com tradução integral de todas as telas, formulários, modais e relatórios.
- [x] **Onboarding Rápido em 3 Passos:** Seleção de momento (Gestante vs. Bebê), fase/semana e foco de apoio principal, sem pedir dados pessoais.
- [x] **Home Interativa com Check-in Reativo:** A resposta ao momento da mãe (*"Como foi a sua noite?"*) calibra dinamicamente as orientações de bem-estar do dia.
- [x] **Três Recomendações Diárias:** Orientação para o bebê, sugestão de cuidado para a mãe e uma prática vinculada ao foco escolhido.
- [x] **Integração Cuidados ➔ Jornada:** Botão *"Fiz essa atividade hoje"* que grava a prática diretamente na linha do tempo com observação opcional e proteção contra toques repetidos.
- [x] **Jornada de Registros Contextualizada:** Opções de marcação rápida para Bebê e Mãe com perguntas de apoio, validação para acontecimentos sensíveis e suporte a datas anteriores.
- [x] **Memórias com Sugestões Inspiradoras:** Ideias de escrita que estimulam relatos afetivos livres sem engessar a usuária em formulários rígidos.
- [x] **Linha do Tempo Mensal com Busca e Filtros:** Navegação por mês/ano, busca textual em tempo real e filtros por categoria (`Bebê`, `Mãe`, `Memória`).
- [x] **Soberania dos Dados (Exportação Bilíngue):** Exportação de backup em `.json` e resumo legível para consultas de puericultura em `.txt` formatado no idioma ativo.
- [x] **Limpeza Segura de Dados:** Exclusão local irreversível mediante confirmação explícita com aviso de risco.

*(O assistente de IA conectado via RAG e a sincronização em nuvem estão planejados para a Etapa 4 no Roadmap).*

---

## 4. Como Executar Localmente | Getting Started

### Pré-requisitos
- **Node.js** v18.0.0 ou superior.
- **npm** v9 ou superior.

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/cintiapettersen/open-child-health-booklet.git
cd open-child-health-booklet

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra seu navegador em: **[http://localhost:3000](http://localhost:3000)**.  
*(Recomendamos abrir no celular ou ativar a simulação de tela de smartphone no navegador com `Cmd + Option + I` para testar a experiência mobile-first).*

### Como Compilar para Produção

```bash
npm run build
```
O build estático e otimizado será gerado na pasta `dist/`, pronto para hospedagem em qualquer servidor estático ou CDN (Cloudflare Pages, Vercel, GitHub Pages).

---

## 5. Estrutura do Repositório

```
├── .gitignore               # Regras de exclusão rigorosas (sem node_modules, dist ou segredos)
├── LICENSE                  # Licença Apache License 2.0 para o código de software
├── NOTICE                   # Atribuições históricas e avisos de integridade
├── ARCHITECTURE.md          # Documentação detalhada da arquitetura técnica
├── LOCALIZATION.md          # Diretrizes de internacionalização e governança clínica
├── ROADMAP.md               # Planejamento das fases de desenvolvimento (12 meses)
├── index.html               # Ponto de entrada HTML mobile-first
├── package.json             # Dependências limpas (React 18, Vite, Lucide, TypeScript)
├── tsconfig.json            # Configurações TypeScript
├── vite.config.ts           # Configurações do Vite
├── content/
│   └── LICENSE-CONTENT.md   # Separação e atribuição dos conteúdos oficiais de saúde
└── src/
    ├── main.tsx             # Inicialização React
    ├── App.tsx              # Orquestrador de fluxo e abas principais
    ├── types/               # Definições de tipos TypeScript (incluindo SupportedLanguage)
    ├── locales/             # Dicionários tipados pt-BR e en, e contratos de tradução
    ├── context/             # LanguageContext com persistência local reativa
    ├── constants/           # Nomes provisórios e configurações desacopladas
    ├── data/                # Catálogo de conteúdos oficiais e check-ins bilíngues
    ├── services/            # indexedDbService, ruleEngine, profileStorage, journeyStorage
    ├── styles/              # Design System acolhedor (Fraunces + Plus Jakarta Sans)
    ├── components/          # Header, Navigation, LanguageSelector
    └── views/               # Onboarding, TodayView, AskView, JourneyView, CareView
```

---

## 6. Licenciamento e Direitos Autorais

- **Software:** Licenciado sob a [Apache License, Version 2.0](LICENSE).
- **Atribuição Histórica:** O conceito e os arquivos fundacionais originais foram iniciados sob a licença MIT por Cintia Pettersen em outubro de 2026 (consulte o arquivo [NOTICE](NOTICE)).
- **Conteúdos de Saúde:** As diretrizes e textos de saúde pública citados no aplicativo pertencem às suas respectivas instituições de origem (Ministério da Saúde do Brasil e OMS) e são utilizados estritamente para fins educativos e informativos de saúde pública (consulte [content/LICENSE-CONTENT.md](content/LICENSE-CONTENT.md)).
