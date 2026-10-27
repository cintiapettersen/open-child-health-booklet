import { CheckInQuestion, SupportedLanguage } from '../types';

export const CHECKIN_QUESTIONS_PT: CheckInQuestion[] = [
  {
    id: 'checkin-sleep',
    phase: 'both',
    question: 'Como foi a sua noite?',
    subtitle: 'Uma pausa rápida de 5 segundos só para você se notar.',
    options: [
      {
        id: 'sleep-well',
        label: 'Descansei bem',
        feedback: 'Que alívio quando a noite permite recarregar! Aproveite essa disposição com calma.',
        mood: 'good'
      },
      {
        id: 'sleep-ok',
        label: 'Mais ou menos',
        feedback: 'Dias com descanso fragmentado pedem ritmo suave. Não hesite em delegar tarefas hoje.',
        mood: 'neutral'
      },
      {
        id: 'sleep-hard',
        label: 'Foi difícil',
        feedback: 'Sentimos muito. A privação de sono afeta corpo e mente. Priorize apenas o essencial hoje.',
        mood: 'tired'
      },
      {
        id: 'sleep-none',
        label: 'Quase não dormi',
        feedback: 'Um abraço apertado em você. Hoje a prioridade máxima é você e o bebê; todo o resto pode esperar.',
        mood: 'struggling'
      }
    ]
  },
  {
    id: 'checkin-energy',
    phase: 'both',
    question: 'Como está o seu nível de energia agora?',
    subtitle: 'Perceber seu corpo ajuda a calibrar o ritmo do dia.',
    options: [
      {
        id: 'energy-high',
        label: 'Com boa energia',
        feedback: 'Excelente! Um ótimo momento para pequenas brincadeiras ou momentos de autocuidado.',
        mood: 'good'
      },
      {
        id: 'energy-medium',
        label: 'Dá para levar',
        feedback: 'Siga no seu ritmo, fazendo pausas conscientes ao longo do dia.',
        mood: 'neutral'
      },
      {
        id: 'energy-low',
        label: 'Bem cansada',
        feedback: 'O corpo está pedindo desaceleração. Permita-se fazer apenas o mínimo indispensável hoje.',
        mood: 'tired'
      },
      {
        id: 'energy-drained',
        label: 'Exausta',
        feedback: 'Reconhecer a exaustão é o primeiro passo para pedir socorro ou descanso. Respire fundo.',
        mood: 'struggling'
      }
    ]
  },
  {
    id: 'checkin-connection',
    phase: 'baby',
    question: 'Como estão os momentos a sós com o bebê hoje?',
    subtitle: 'Sem cobranças: cada dia tem sua própria sintonia.',
    options: [
      {
        id: 'conn-sweet',
        label: 'Momentos gostosos',
        feedback: 'Essas trocas calmas fortalecem o vínculo e alimentam o coração de ambos.',
        mood: 'good'
      },
      {
        id: 'conn-busy',
        label: 'Corridos e no piloto automático',
        feedback: 'Completamente normal na rotina de cuidados. Pequenos segundos de toque já contam.',
        mood: 'neutral'
      },
      {
        id: 'conn-tense',
        label: 'Mais desafiadores hoje',
        feedback: 'Bebês também têm dias difíceis e sentem o cansaço ao redor. Vai passar.',
        mood: 'tired'
      },
      {
        id: 'conn-overwhelmed',
        label: 'Preciso de um respiro',
        feedback: 'Sentir vontade de se afastar um pouco por 5 minutos é um sinal saudável de limite. Peça apoio.',
        mood: 'struggling'
      }
    ]
  }
];

export const CHECKIN_QUESTIONS_EN: CheckInQuestion[] = [
  {
    id: 'checkin-sleep',
    phase: 'both',
    question: 'How was your night?',
    subtitle: 'A quick 5-second pause just to check in with yourself.',
    options: [
      {
        id: 'sleep-well',
        label: 'Rested well',
        feedback: 'What a relief when the night allows you to recharge! Enjoy this calm energy.',
        mood: 'good'
      },
      {
        id: 'sleep-ok',
        label: 'So-so',
        feedback: 'Days with fragmented sleep call for a gentle pace. Do not hesitate to delegate chores today.',
        mood: 'neutral'
      },
      {
        id: 'sleep-hard',
        label: 'It was hard',
        feedback: 'We are with you. Sleep deprivation affects body and mind. Prioritize only what is essential today.',
        mood: 'tired'
      },
      {
        id: 'sleep-none',
        label: 'Barely slept',
        feedback: 'A warm hug to you. Today the top priority is you and baby; everything else can wait.',
        mood: 'struggling'
      }
    ]
  },
  {
    id: 'checkin-energy',
    phase: 'both',
    question: 'How is your energy level right now?',
    subtitle: 'Noticing your body helps calibrate the pace of your day.',
    options: [
      {
        id: 'energy-high',
        label: 'Good energy',
        feedback: 'Wonderful! A great time for gentle play or a brief moment of self-care.',
        mood: 'good'
      },
      {
        id: 'energy-medium',
        label: 'Managing ok',
        feedback: 'Take things at your own pace, taking mindful breathers throughout the day.',
        mood: 'neutral'
      },
      {
        id: 'energy-low',
        label: 'Quite tired',
        feedback: 'Your body is asking to slow down. Allow yourself to do only the bare minimum today.',
        mood: 'tired'
      },
      {
        id: 'energy-drained',
        label: 'Exhausted',
        feedback: 'Acknowledging exhaustion is the first step toward asking for help or resting. Take a deep breath.',
        mood: 'struggling'
      }
    ]
  },
  {
    id: 'checkin-connection',
    phase: 'baby',
    question: 'How are your moments together with baby today?',
    subtitle: 'No expectations: each day has its own rhythm and tune.',
    options: [
      {
        id: 'conn-sweet',
        label: 'Sweet and gentle',
        feedback: 'These peaceful exchanges strengthen bonding and nourish both your hearts.',
        mood: 'good'
      },
      {
        id: 'conn-busy',
        label: 'Hectic and on autopilot',
        feedback: 'Completely normal in daily caregiving. Small seconds of warm touch truly count.',
        mood: 'neutral'
      },
      {
        id: 'conn-tense',
        label: 'More challenging today',
        feedback: 'Babies have difficult days too and sense fatigue around them. This too will pass.',
        mood: 'tired'
      },
      {
        id: 'conn-overwhelmed',
        label: 'I need a breather',
        feedback: 'Wanting to step away for 5 quiet minutes is a healthy sign of self-awareness. Ask for a hand.',
        mood: 'struggling'
      }
    ]
  }
];

export const getCheckinQuestions = (lang: SupportedLanguage = 'pt-BR'): CheckInQuestion[] => {
  return lang === 'en' ? CHECKIN_QUESTIONS_EN : CHECKIN_QUESTIONS_PT;
};

// Export padrão retrocompatível
export const CHECKIN_QUESTIONS = CHECKIN_QUESTIONS_PT;
