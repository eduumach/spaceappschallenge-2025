import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Detectar idioma do navegador ou usar o padrão
const browserLanguage = typeof window !== 'undefined'
  ? navigator.language
  : 'pt-BR';

// Mapear códigos de idioma do navegador para nossos códigos
const languageMap: Record<string, string> = {
  'pt': 'pt-BR',
  'pt-BR': 'pt-BR',
  'en': 'en-US',
  'en-US': 'en-US',
};

const defaultLanguage = languageMap[browserLanguage] || 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': {
        common: await import('./locales/en-US/common.json').then(m => m.default),
        home: await import('./locales/en-US/home.json').then(m => m.default),
        analysis: await import('./locales/en-US/analysis.json').then(m => m.default),
        eventProfiles: await import('./locales/en-US/eventProfiles.json').then(m => m.default),
        results: await import('./locales/en-US/results.json').then(m => m.default),
      },
      'pt-BR': {
        common: await import('./locales/pt-BR/common.json').then(m => m.default),
        home: await import('./locales/pt-BR/home.json').then(m => m.default),
        analysis: await import('./locales/pt-BR/analysis.json').then(m => m.default),
        eventProfiles: await import('./locales/pt-BR/eventProfiles.json').then(m => m.default),
        results: await import('./locales/pt-BR/results.json').then(m => m.default),
      },
    },
    lng: defaultLanguage,
    fallbackLng: 'pt-BR',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React já faz escape
    },
  });

export default i18n;
