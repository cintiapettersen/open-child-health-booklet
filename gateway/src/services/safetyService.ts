import { SupportedLang } from '../types';
import { CONFIG } from '../config';

export interface EmergencyCheckResult {
  isEmergency: boolean;
  message?: string;
  emergencyPhone?: string;
}

// Padrões conservadores de situações potencialmente graves ou agudas
const EMERGENCY_PATTERNS = [
  // Febre em recém-nascido ou lactente jovem (< 3 meses)
  {
    regex: /(?:febre|temperatura\s+alta|38|39).*(?:rec[eé]m[\s-]nascido|dias|1\s*m[eê]s|2\s*meses|beb[eê].*pequeno|neonato)|(?:rec[eé]m[\s-]nascido|dias|1\s*m[eê]s|2\s*meses|beb[eê].*pequeno|neonato).*(?:febre|temperatura\s+alta|38|39)/i,
    category: 'neonatal_fever'
  },
  {
    regex: /(?:fever|high\s+temp).*(?:newborn|infant|days|1\s*month|2\s*months)|(?:newborn|infant|days|1\s*month|2\s*months).*(?:fever|high\s+temp)/i,
    category: 'neonatal_fever'
  },
  // Desconforto respiratório grave
  {
    regex: /(falta\s+de\s+ar|gemendo\s+para\s+respirar|peito\s+afundando|tiragem|l[aá]bios\s+roxos|cianose|sem\s+respirar|engasgado|engasgou|sufocando)/i,
    category: 'respiratory_distress'
  },
  {
    regex: /(can'?t\s+breathe|struggling\s+to\s+breathe|blue\s+lips|choking|choked|suffocating|stopped\s+breathing)/i,
    category: 'respiratory_distress'
  },
  // Convulsão / espasmos agudos
  {
    regex: /(convuls[aã]o|convulsionando|espasmos\s+fortes|ataque\s+epil[eé]ptico)/i,
    category: 'seizures'
  },
  {
    regex: /(seizure|convulsion|shaking\s+uncontrollably)/i,
    category: 'seizures'
  },
  // Sangramento materno profuso ou dor súbita incapacitante
  {
    regex: /(hemorragia|sangramento\s+muito\s+forte|sangramento\s+abundante|jorrando\s+sangue|dor\s+abdominal\s+insuport[aá]vel)/i,
    category: 'maternal_hemorrhage'
  },
  {
    regex: /(heavy\s+bleeding|hemorrhage|gushing\s+blood|unbearable\s+abdominal\s+pain)/i,
    category: 'maternal_hemorrhage'
  },
  // Perda de consciência / letargia profunda
  {
    regex: /(desmaiou|inconsciente|n[aã]o\s+acorda|n[aã]o\s+reage|comatoso|let[aá]rgico)/i,
    category: 'unresponsive'
  },
  {
    regex: /(unconscious|passed\s+out|won'?t\s+wake\s+up|unresponsive|lethargic)/i,
    category: 'unresponsive'
  },
  // Ideação de dano / crise emocional aguda
  {
    regex: /(machucar\s+meu\s+beb[eê]|me\s+machucar|suic[ií]dio|n[aã]o\s+quero\s+viver|vontade\s+de\s+sumir)/i,
    category: 'crisis_harm'
  },
  {
    regex: /(harm\s+myself|harm\s+my\s+baby|suicide|don'?t\s+want\s+to\s+live)/i,
    category: 'crisis_harm'
  }
];

export function checkEmergencySafety(question: string, lang: SupportedLang = 'pt-BR'): EmergencyCheckResult {
  const normalized = question.trim().toLowerCase();

  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      const isPt = lang === 'pt-BR';
      const phone = isPt ? CONFIG.EMERGENCY_PHONE_BR : CONFIG.EMERGENCY_PHONE_INTL;

      const message = isPt
        ? `🚨 ATENÇÃO MÉDICA URGENTE: Sua mensagem contém termos associados a uma situação potencialmente grave ou aguda. Por salvaguarda de segurança, este assistente educativo não realiza diagnóstico ou triagem clínica. Procure atendimento médico presencial imediatamente ou acione o serviço de urgência: Ligue ${phone}. Não aguarde respostas em aplicativos diante de sinais de emergência.\n\n⚠️ *Nota de Limitação:* Filtros automáticos por termos são salvaguardas preliminares e NÃO detectam todas as urgências médicas. Em qualquer dúvida sobre a saúde da mãe ou do bebê, busque atendimento presencial imediato.`
        : `🚨 URGENT MEDICAL NOTICE: Your message contains terms associated with an acute or potentially life-threatening situation. As a safety safeguard, this educational assistant does not provide clinical diagnosis or emergency triage. Seek immediate in-person emergency care or call emergency services: ${phone}. Do not wait for app responses during an emergency.\n\n⚠️ *Safety Limitation:* Automated keyword filters are preliminary safeguards and CANNOT detect all possible medical urgencies. When in doubt regarding maternal or infant health, always seek in-person medical evaluation immediately.`;

      return {
        isEmergency: true,
        message,
        emergencyPhone: phone
      };
    }
  }

  return { isEmergency: false };
}
