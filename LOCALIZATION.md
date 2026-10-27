# Diretrizes de Internacionalização e Localização (i18n)
*Internationalization and Localization Guidelines*

> **Contexto:** Este documento estabelece a arquitetura bilíngue (`pt-BR` e `en`) do aplicativo **Primeiros 1.000 Dias** (*First 1,000 Days*), concebido como um bem público digital aberto para apoiar gestantes, mães e cuidadores nos primeiros 1.000 dias de vida da criança.

---

## 1. Princípios de Localização e Governança Clínica

A tradução e localização de um aplicativo de saúde materna e infantil diferem fundamentalmente da tradução de interfaces utilitárias convencionais:

1. **Separação entre Código e Linguagem:**  
   Nenhum texto de interface ou orientação de cuidado é fixado (*hardcoded*) na lógica de renderização. Todos os elementos derivam de dicionários fortemente tipados em TypeScript (`src/locales/`).

2. **Proibição de Tradução Dinâmica por IA em Tempo de Execução:**  
   Não utilizamos APIs de inteligência artificial generativa em segundo plano para traduzir textos médicos em tempo real. Toda tradução de saúde deve ser estática, determinística, auditável e previamente revisada para evitar alucinações terminológicas ou recomendações clínicas equivocadas.

3. **Integridade de Fontes Oficiais:**  
   A tradução de um conteúdo para inglês **não substitui** sua fonte oficial de origem por uma instituição estrangeira aleatória. As referências originais (como o Ministério da Saúde do Brasil e a Sociedade Brasileira de Pediatria) são mantidas e descritas com precisão em inglês, acompanhadas de diretrizes correlatas da OMS (*World Health Organization*) quando aplicável.

4. **Identificação Transparente de Conteúdo Demonstrativo:**  
   Orientações que ainda não passaram por validação clínica formal e colegiada permanecem expressamente categorizadas como `validationStatus: 'demonstrative'` em todos os idiomas.

---

## 2. Estrutura de Arquivos

```
src/
├── locales/
│   ├── types.ts          # Contrato de tipos TypeScript (TranslationDictionary)
│   ├── pt-BR.ts          # Português brasileiro (idioma padrão e mercado piloto)
│   ├── en.ts             # Inglês internacional (segunda língua para avaliação global)
│   └── index.ts          # Provedor de dicionários e utilitários de formatação
├── context/
│   └── LanguageContext.tsx # Contexto reativo com persistência local (localStorage/IndexedDB)
├── components/
│   └── LanguageSelector.tsx # Seletor discreto de texto (PT | EN) sem bandeiras nacionais
└── data/
    ├── contents.ts       # Acervo educativo bilíngue com IDs semânticos invariantes
    └── checkins.ts       # Banco de perguntas de check-in diário bilíngue
```

---

## 3. Como Contribuir com um Novo Idioma

Para adicionar um novo idioma (por exemplo, Espanhol `es`, Francês `fr` ou línguas indígenas brasileiras):

### Passo 1: Criar o Arquivo de Dicionário
Crie `src/locales/[codigo].ts` implementando rigorosamente a interface `TranslationDictionary` de `src/locales/types.ts`.
O compilador TypeScript (`tsc`) verificará em tempo de compilação se todas as chaves foram preenchidas.

### Passo 2: Traduzir o Acervo Educativo e Check-ins
Em `src/data/contents.ts` e `src/data/checkins.ts`, adicione o catálogo correspondente mantendo os **mesmos identificadores canônicos** (`id: 'mom-rest-fragmented'`, `id: 'baby-tummy-time-gentle'`, etc.). O motor de regras local opera exclusivamente com base em IDs semânticos e critérios de fase, garantindo paridade de comportamento clínico em qualquer idioma.

### Passo 3: Revisão por Profissional de Saúde
Toda adição de orientações deve passar por revisão por profissional de saúde materno-infantil ou citar diretamente guia oficial de ministério de saúde ou organismo multilateral reconhecido.

---

## 4. Alinhamento com o Digital Public Goods Standard

Este projeto foi desenhado buscando consonância com os princípios do **Digital Public Goods Standard** (DPG Alliance):

- **Indicador 5 (Documentação Aberta):** A arquitetura de internacionalização, modelos de dados e procedimentos de contribuição são públicos e auditáveis.
- **Indicador 6 (Extração e Soberania dos Dados):** O aplicativo oferece exportação integral em formato aberto (.JSON) e resumo legível (.TXT) diretamente no idioma ativo do usuário.
- **Indicador 7 (Melhores Práticas de Privacidade):** A preferência de idioma é armazenada estritamente no dispositivo da usuária (`localStorage`), sem cookies de rastreamento ou envio de metadados a servidores externos.
- **Indicadores 8 e 9 (Prevenção de Danos / Do No Harm):** Todo conteúdo exibe avisos explícitos de que o aplicativo é educativo e não substitui consultas presenciais. Nenhuma IA traduz orientações de saúde sem curadoria humana prévia.

> *Nota de Transparência:* Este projeto adota as diretrizes técnicas do padrão DPG como referência de arquitetura aberta e de proteção a populações vulneráveis. O software encontra-se em fase de preparação para submissão e **não alega credenciamento, certificação ou reconhecimento oficial prévio** por parte da Digital Public Goods Alliance.
