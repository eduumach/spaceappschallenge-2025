import { useTranslation as useI18nextTranslation } from 'react-i18next';

export const useTranslation = (namespace: string = 'common') => {
  return useI18nextTranslation(namespace);
};

export const languages = [
  { code: 'pt-BR', name: 'Português' },
  { code: 'en-US', name: 'English' },
] as const;

export type Language = typeof languages[number]['code'];
