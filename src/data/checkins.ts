import { CheckInQuestion } from '../types';

export const CHECKIN_QUESTIONS: CheckInQuestion[] = [
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
