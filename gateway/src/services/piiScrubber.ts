export interface SanitizeResult {
  sanitized: string;
  piiDetected: boolean;
  warning?: string;
}

const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const NAME_INTRO_REGEX = /\b(meu nome [eé]|me chamo|o nome do meu beb[eê] [eé]|meu filho se chama|minha filha se chama)\s+([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+)*)/gi;
const NAME_INTRO_EN_REGEX = /\b(my name is|i am called|my baby name is|my child is named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;

export function sanitizeUserInput(input: string, lang: 'pt-BR' | 'en' = 'pt-BR'): SanitizeResult {
  let text = input.trim();
  let piiDetected = false;

  if (CPF_REGEX.test(text)) {
    text = text.replace(CPF_REGEX, '[DOCUMENTO_OMITIDO]');
    piiDetected = true;
  }

  if (PHONE_REGEX.test(text)) {
    text = text.replace(PHONE_REGEX, '[TELEFONE_OMITIDO]');
    piiDetected = true;
  }

  if (EMAIL_REGEX.test(text)) {
    text = text.replace(EMAIL_REGEX, '[EMAIL_OMITIDO]');
    piiDetected = true;
  }

  if (NAME_INTRO_REGEX.test(text)) {
    text = text.replace(NAME_INTRO_REGEX, '$1 [NOME_OMITIDO]');
    piiDetected = true;
  }

  if (NAME_INTRO_EN_REGEX.test(text)) {
    text = text.replace(NAME_INTRO_EN_REGEX, '$1 [NAME_OMITTED]');
    piiDetected = true;
  }

  const warning = piiDetected
    ? lang === 'pt-BR'
      ? 'Aviso: Informações potencialmente identificáveis foram mascaradas. Importante: A filtragem automática por expressões regulares não garante 100% de anonimização. Nunca insira nomes completos, documentos ou contatos.'
      : 'Notice: Potentially identifiable details were masked. Important: Automated regex filtering cannot guarantee 100% anonymization. Never submit full names, IDs, or contact information.'
    : undefined;

  return {
    sanitized: text,
    piiDetected,
    warning
  };
}
