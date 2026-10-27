import { TranslationDictionary } from './types';

export const ptBR: TranslationDictionary = {
  app: {
    name: 'Primeiros 1.000 Dias',
    tagline: 'Seu companheiro de cuidado, apoio e orientação',
    subtitle: 'Da gestação aos dois anos de vida'
  },
  nav: {
    today: 'Hoje',
    ask: 'Pergunte',
    journey: 'Jornada',
    care: 'Cuidados'
  },
  header: {
    changePhaseTitle: 'Alterar fase ou reiniciar introdução',
    changePhaseAria: 'Reiniciar introdução'
  },
  onboarding: {
    welcomeBadge: 'Boas-vindas',
    stageBadge: 'Etapa',
    focusBadge: 'Foco inicial',
    step1Title: 'Em qual momento você está agora?',
    step1Subtitle: 'Queremos oferecer orientações no momento certo, sem complicar o seu dia.',
    phasePregnancyTitle: 'Estou grávida',
    phasePregnancyDesc: 'Acompanhamento trimestre a trimestre, autocuidado e preparação.',
    phaseBabyTitle: 'Meu bebê já nasceu',
    phaseBabyDesc: 'Cuidados diários, desenvolvimento, amamentação e rotina nos primeiros anos.',
    step2Title: 'Em qual semana ou mês vocês estão?',
    step2Subtitle: 'Isso nos ajuda a calibrar o conteúdo de acordo com cada fase de desenvolvimento.',
    pregnancyStages: [
      { value: 12, label: 'Início da gestação (até 12 sem.)' },
      { value: 24, label: 'Meio da gestação (20 a 28 sem.)' },
      { value: 36, label: 'Reta final (32 a 40 sem.)' }
    ],
    babyStages: [
      { value: 0, label: 'Recém-nascido (primeiro mês)' },
      { value: 2, label: 'Bebê de 2 a 3 meses' },
      { value: 6, label: 'Bebê de 4 a 6 meses' },
      { value: 12, label: 'Bebê de 7 a 12 meses' },
      { value: 24, label: 'Criança de 1 a 2 anos' }
    ],
    step3Title: 'O que mais precisa de atenção hoje?',
    step3Subtitle: 'Você pode mudar isso a qualquer momento. Suas orientações diárias serão personalizadas com base nesta escolha.',
    needs: {
      understand_baby: {
        title: 'Entender o bebê',
        subtitle: 'Choro, sono, sinais e rotinas do dia a dia'
      },
      self_care: {
        title: 'Cuidar de mim',
        subtitle: 'Descanso, emoções, autocuidado e apoio materno'
      },
      feeding: {
        title: 'Amamentação e Alimentação',
        subtitle: 'Pega, livre demanda, introdução alimentar e nutrição'
      },
      development: {
        title: 'Acompanhar o desenvolvimento',
        subtitle: 'Estímulos, marcos motores e conquistas de cada fase'
      },
      all: {
        title: 'Um pouco de tudo',
        subtitle: 'Orientações equilibradas para cada momento'
      }
    },
    nextBtn: 'Continuar',
    backBtn: 'Voltar',
    startBtn: 'Começar com calma'
  },
  today: {
    badge: 'Hoje com você',
    greetingPregnancy: 'Como você está hoje?',
    greetingBaby: 'Um dia de cada vez',
    phasePrefix: 'Fase',
    focusPrefix: 'Foco',
    checkinBadge: 'Check-in do dia',
    changeAnswerBtn: 'Mudar resposta',
    skipCheckinBtn: 'Pular por hoje',
    rhythmTitle: 'Seu Ritmo Semanal',
    rhythmSubtitle: 'Últimos 7 dias de registros locais',
    rhythmMom: 'cuidados da mãe',
    rhythmBaby: 'marcos do bebê',
    rhythmActivities: 'atividades praticadas',
    rhythmEmpty: 'Nenhum registro ainda nos últimos 7 dias. Responda ao check-in ou registre uma memória na Jornada!',
    guideTitle: 'Orientações para o Seu Dia',
    guideSubtitle: 'Baseadas na sua fase e no que você compartilhou conosco hoje.',
    viewAllCareBtn: 'Explorar todos os cuidados',
    verifiedBadge: 'Referência Oficial (MS / OMS)',
    demonstrativeBadge: 'Demonstrativo',
    activityCompletedToast: 'Atividade salva na sua Jornada!',
    doActivityBtn: 'Fiz essa orientação hoje',
    alreadyDoneBadge: 'Feito hoje',
    completeModalTitle: 'Registrar Atividade',
    completeModalDesc: 'Deseja adicionar alguma anotação sobre como foi colocar essa orientação em prática?',
    completeModalPlaceholder: 'Ex: O bebê ficou calmo e foi um momento leve...',
    completeModalSaveBtn: 'Salvar na Jornada',
    completeModalCancelBtn: 'Cancelar'
  },
  care: {
    badge: 'Biblioteca de Cuidados',
    title: 'Orientações Práticas',
    subtitle: 'Ações recomendadas para o momento de vocês. Ao concluir, você pode salvá-las na sua Jornada.',
    catAll: 'Tudo',
    catMom: 'Mãe & Bem-estar',
    catDevelopment: 'Bebê & Estímulos',
    catFeeding: 'Nutrição & Amamentação',
    catMonitoring: 'Acompanhamento',
    doActivityBtn: 'Fiz essa atividade hoje',
    activityDoneBadge: 'Concluído hoje',
    sourceLabel: 'Fonte',
    modalTitle: 'Registrar Cuidado Praticado',
    modalDesc: 'Ao confirmar, essa atividade será salva na sua Linha do Tempo da Jornada.',
    modalPlaceholder: 'Como foi praticar esse cuidado? (opcional)',
    modalConfirmBtn: 'Confirmar e Salvar',
    modalCancelBtn: 'Cancelar'
  },
  journey: {
    badge: 'Linha do Tempo Local',
    title: 'Sua Jornada',
    subtitle: 'Registros diários, conquistas e memórias guardados com segurança apenas no seu aparelho.',
    searchPlaceholder: 'Buscar anotações, sintomas, memórias...',
    clearSearchBtn: 'Limpar busca',
    allFilter: 'Todos',
    babyFilter: '👶 Bebê',
    momFilter: '♡ Mãe',
    memoryFilter: '📷 Memórias',
    countSingle: 'momento exibido',
    countPlural: 'momentos exibidos',
    monthOf: 'de',
    prevMonthAria: 'Ver mês anterior',
    nextMonthAria: 'Ver próximo mês',
    emptyMonthTitle: 'Nenhum registro neste mês',
    emptyMonthSubtitle: 'Use o botão "+ Novo registro" para guardar o primeiro momento deste período.',
    emptySearchTitle: 'Nenhum registro encontrado',
    emptySearchSubtitle: 'Tente outros termos de busca ou selecione outro mês.',
    newRecordBtn: 'Novo registro',
    closeBtn: 'Fechar',
    exportMenuBtn: 'Opções de Backup e Exportação',
    newRecordTitle: 'Novo Registro',
    dateSectionTitle: 'Quando aconteceu?',
    dateToday: 'Hoje',
    dateYesterday: 'Ontem',
    dateOther: 'Outra data...',
    subjectSectionTitle: 'Sobre quem vamos registrar?',
    subjectOptions: {
      baby: 'Bebê',
      mom: 'Mãe',
      memory: 'Memória'
    },
    babyPromptTitle: 'Como foi o dia do bebê?',
    momPromptTitle: 'O que aconteceu na sua jornada hoje?',
    memoryPromptTitle: 'Guardar um momento que merece ser lembrado',
    optionsSubtitle: 'Escolha uma ou mais opções e conte um pouco mais.',
    memorySuggestionsSubtitle: 'Sugestões inspiradoras para o seu relato:',
    memorySuggestions: [
      {
        id: 'first_achievement',
        label: 'Primeira conquista',
        prompt: 'O que seu bebê fez pela primeira vez?'
      },
      {
        id: 'special_moment',
        label: 'Momento especial',
        prompt: 'O que tornou esse momento especial hoje?'
      },
      {
        id: 'outing',
        label: 'Passeio',
        prompt: 'Onde vocês foram e o que descobriram juntos?'
      },
      {
        id: 'sounds_laughter',
        label: 'Som ou risada',
        prompt: 'Qual balbucio, som novo ou risada chamou sua atenção?'
      },
      {
        id: 'sweet_gesture',
        label: 'Gesto de carinho',
        prompt: 'Que abraço, olhar ou conexão aqueceu seu coração?'
      }
    ],
    babyTags: [
      {
        tag: 'Dormiu bem',
        question: 'Como foram as sonecas ou o sono da noite?',
        placeholder: 'Ex: Conseguiu dormir 2h direto sem despertar assustado...'
      },
      {
        tag: 'Mamou ou se alimentou normalmente',
        question: 'Observou algo especial na mamada ou refeição?',
        placeholder: 'Ex: Mamou com calma e sem engasgos...'
      },
      {
        tag: 'Estava mais irritado',
        question: 'Percebeu algum motivo provável para a irritação?',
        placeholder: 'Ex: Parecia incomodado com cólica ou salto de desenvolvimento...'
      },
      {
        tag: 'Teve alguma descoberta ou marco',
        question: 'Que gesto, som ou novidade você reparou?',
        placeholder: 'Ex: Tentou segurar o brinquedo com as duas mãozinhas...'
      },
      {
        tag: 'Apresentou algum sintoma',
        question: 'Qual sintoma você notou com atenção?',
        placeholder: 'Ex: Febre baixa após vacina, nariz com secreção transparente...',
        isRequired: true
      }
    ],
    momTags: [
      {
        tag: 'Tive uma conquista pessoal hoje',
        question: 'Qual vitória sua merece ser celebrada?',
        placeholder: 'Ex: Consegui almoçar sentada e com calma...'
      },
      {
        tag: 'Enfrentei uma dificuldade importante',
        question: 'O que tornou o dia difícil para você?',
        placeholder: 'Ex: Me senti muito sobrecarregada com as demandas...',
        isRequired: true
      },
      {
        tag: 'Consegui um tempo só para mim',
        question: 'O que você pôde fazer nesse momento seu?',
        placeholder: 'Ex: Tomei um banho relaxante de 20 minutos...'
      },
      {
        tag: 'Tive uma conversa ou troca significativa',
        question: 'Com quem foi e o que fez bem para você?',
        placeholder: 'Ex: Conversei com uma amiga que também tem bebê...'
      },
      {
        tag: 'Recebi apoio prático que fez a diferença',
        question: 'Qual ajuda recebida aliviou o seu dia?',
        placeholder: 'Ex: Minha mãe trouxe o almoço pronto...'
      },
      {
        tag: 'Observação sobre meu corpo ou recuperação',
        question: 'Como seu corpo tem respondido aos cuidados?',
        placeholder: 'Ex: Sinto menos dores nas costas hoje...'
      }
    ],
    noteLabel: 'Seu relato:',
    noteGeneralPlaceholder: 'Escreva um breve relato sobre esse momento...',
    saveRecordBtn: 'Salvar Registro',
    savingRecordBtn: 'Salvando...',
    savedSuccessMsg: 'Registro salvo com sucesso!',
    validationChooseOption: 'Selecione ao menos uma opção antes de salvar.',
    validationDescribeBriefly: (tagName: string) =>
      `Para acontecimentos como "${tagName}", escreva ao menos uma breve descrição para contextualizar.`,
    exportModalTitle: 'Soberania dos seus dados',
    exportModalDesc: 'Seus registros estão guardados localmente no seu aparelho. Você pode exportá-los a qualquer momento em formato aberto.',
    exportJsonTitle: 'Baixar Backup (.JSON)',
    exportJsonDesc: 'Arquivo completo para restauração futura',
    exportTxtTitle: 'Baixar Resumo (.TXT)',
    exportTxtDesc: 'Texto legível para levar à consulta médica',
    clearAllDataBtn: 'Apagar todos os registros deste aparelho...',
    clearModalTitle: 'Confirmação de Exclusão',
    clearModalQuestion: 'Tem certeza de que deseja apagar todos os registros do IndexedDB deste aparelho?',
    clearModalWarning: 'Atenção: Como os dados ficam salvos apenas no seu dispositivo, essa exclusão é irreversível se você não tiver feito um backup em JSON antes.',
    clearModalCancelBtn: 'Cancelar',
    clearModalConfirmBtn: 'Sim, apagar tudo',
    months: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    dateTodayPrefix: 'Hoje',
    dateYesterdayPrefix: 'Ontem'
  },
  ask: {
    badge: 'Assistente Educativo',
    title: 'Tire suas dúvidas',
    subtitle: 'Respostas fundamentadas em guias oficiais de saúde (OMS e Ministério da Saúde).',
    disclaimerTitle: 'Aviso de Saúde:',
    disclaimerText: 'Este assistente tem finalidade exclusivamente educativa e informativa. Ele não substitui consultas presenciais, diagnósticos ou condutas médicas.',
    commonQuestionsTitle: 'Dúvidas comuns para esta fase:',
    sampleQuestionsPregnancy: [
      'É normal sentir sono excessivo no primeiro trimestre?',
      'Quais alimentos evitar durante a gestação?',
      'Como identificar os primeiros sinais do trabalho de parto?'
    ],
    sampleQuestionsBaby: [
      'Bebê de 2 meses soluçando muito após mamar é perigoso?',
      'Como sei se a pega da amamentação está correta?',
      'Quantas horas de sono são esperadas nessa idade?'
    ],
    inputTitle: 'Sua pergunta:',
    inputPlaceholder: 'Ex: Como lidar com cólicas no bebê de 2 meses?',
    sourcesNotice: 'Fontes: MS / OMS',
    consultBtn: 'Consultar',
    statusNoticeTitle: 'Etapa 3.1 (Concluída):',
    statusNoticeDesc: 'Interface bilíngue pronta. Aguardando a Etapa 4 para ativação da IA e citação de fontes via Edge Gateway.',
    alertComingSoon: 'Estrutura de interface pronta! A conexão com a IA educativa e citação de fontes será ativada na Etapa 4.'
  },
  common: {
    loading: 'Carregando dados locais...',
    dbErrorTitle: 'Armazenamento Local Restrito',
    dbErrorDesc: 'O IndexedDB não pôde ser inicializado neste navegador. Novos registros não serão salvos.',
    saveError: 'Não foi possível gravar no armazenamento do aparelho.',
    clearError: 'Erro ao apagar registros locais.',
    confirmPhaseReset: 'Deseja alterar a fase ou reiniciar a introdução rápida?'
  }
};
